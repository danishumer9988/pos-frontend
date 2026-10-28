// Download tables as PDF / Excel / JSON / CSV. Heavy libraries load only when the user exports.
function save(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const stamp = () => new Date().toISOString().slice(0, 10);
const cell = (col, row) => (col.value ? col.value(row) : row[col.key]) ?? "";

/**
 * exportRows({ format: "pdf"|"xlsx"|"json"|"csv", title, filename, columns, rows, extraSheets, json })
 *  columns: [{ label, key | value(row) }]
 *  extraSheets (xlsx only): [{ name, columns, rows }]
 *  json: what to write for "json" (defaults to the raw rows)
 *  footer: optional array of lines printed under the PDF table
 */
export async function exportRows({ format, title, filename, columns, rows, extraSheets = [], json, footer = [] }) {
  const base = `${filename}-${stamp()}`;
  const matrix = (cols, data) => data.map((r) => cols.map((c) => cell(c, r)));

  if (format === "json") {
    save(new Blob([JSON.stringify(json ?? rows, null, 2)], { type: "application/json" }), `${base}.json`);
    return;
  }
  if (format === "csv") {
    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [columns.map((c) => esc(c.label)).join(","), ...matrix(columns, rows).map((r) => r.map(esc).join(","))];
    save(new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" }), `${base}.csv`);
    return;
  }
  if (format === "xlsx") {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const add = (name, cols, data) => {
      const ws = XLSX.utils.aoa_to_sheet([cols.map((c) => c.label), ...matrix(cols, data)]);
      ws["!cols"] = cols.map((c) => ({ wch: Math.max(12, c.label.length + 2) }));
      XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
    };
    add(title || "Data", columns, rows);
    extraSheets.forEach((s) => add(s.name, s.columns, s.rows));
    XLSX.writeFile(wb, `${base}.xlsx`);
    return;
  }
  if (format === "pdf") {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
    const doc = new jsPDF({ orientation: columns.length > 6 ? "landscape" : "portrait", unit: "pt", format: "a4" });
    doc.setFontSize(16);
    doc.text(title || "Report", 40, 40);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Generated ${new Date().toLocaleString()}`, 40, 56);
    autoTable(doc, {
      startY: 70,
      head: [columns.map((c) => c.label)],
      body: matrix(columns, rows).map((r) => r.map(String)),
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [249, 115, 22] },
      alternateRowStyles: { fillColor: [250, 250, 250] },
    });
    let y = doc.lastAutoTable.finalY + 18;
    doc.setTextColor(30);
    doc.setFontSize(10);
    footer.forEach((line) => { doc.text(line, 40, y); y += 14; });
    doc.save(`${base}.pdf`);
  }
}
