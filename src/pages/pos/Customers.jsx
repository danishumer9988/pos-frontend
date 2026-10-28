import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../auth/api";
import { useAuth } from "../../auth/AuthProvider";
import { money, shortDate, errorText } from "../../utils/money";
import { exportRows } from "../../utils/exporters";
import ExportMenu from "../../components/pos/ExportMenu";
import "../../styles/pos.css";

const EMPTY = { id: null, name: "", phone: "", email: "", address: "", notes: "" };
const TYPE = { dine_in: "Dine-in", takeaway: "Takeaway", delivery: "Delivery" };

const unnamed = (c) => !c.name || c.name === c.phone;   // created from a phone number only
const shownName = (c) => (unnamed(c) ? "No name yet" : c.name);

function ago(iso) {
  if (!iso) return "Never";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d <= 0 ? "Today" : d === 1 ? "Yesterday" : `${d} days ago`;
}

export default function Customers() {
  const { business, can } = useAuth();
  const cur = business?.currency || "PKR";
  const canManage = can("customers");
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("name");
  const [form, setForm] = useState(null);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const reload = () => setTick((t) => t + 1);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      apiFetch(`/api/me/customers?sort=${sort}&q=${encodeURIComponent(q)}`)
        .then((r) => { if (alive) setRows(r); })
        .catch((e) => { if (alive) setError(errorText(e)); });
    }, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [q, sort, tick]);

  const stats = useMemo(() => {
    const spent = rows.reduce((s, c) => s + (c.total_spent || 0), 0);
    return { count: rows.length, repeat: rows.filter((c) => c.order_count >= 2).length, spent, avg: rows.length ? Math.round(spent / rows.length) : 0 };
  }, [rows]);
  const topIds = useMemo(() => new Set([...rows].filter((c) => c.order_count >= 2).sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0)).slice(0, 3).map((c) => c.id)), [rows]);

  async function save(e) {
    e.preventDefault();
    try {
      const { id, name, phone, email, address, notes } = form;
      await apiFetch(id ? `/api/me/customers/${id}` : "/api/me/customers", { method: id ? "PATCH" : "POST", body: JSON.stringify({ name, phone, email, address, notes }) });
      setForm(null); setError(""); reload();
    } catch (err) { setError(errorText(err)); }
  }
  async function remove(id) {
    if (!confirm("Delete this customer? Their past orders are kept.")) return;
    try { await apiFetch(`/api/me/customers/${id}`, { method: "DELETE" }); setDetail(null); reload(); } catch (err) { setError(errorText(err)); }
  }
  async function open(c) {
    try { setDetail(await apiFetch(`/api/me/customers/${c.id}`)); } catch (err) { setError(errorText(err)); }
  }
  const onExport = (format) => exportRows({
    format, title: "Customers", filename: "customers", rows, json: rows,
    columns: [{ label: "Name", value: (c) => (unnamed(c) ? "" : c.name) }, { label: "Phone", key: "phone" }, { label: "Email", key: "email" }, { label: "Address", key: "address" }, { label: "Orders", key: "order_count" }, { label: "Total spent", value: (c) => (c.total_spent || 0) / 100 }, { label: "Last order", value: (c) => (c.last_order_at ? new Date(c.last_order_at).toLocaleDateString() : "") }, { label: "Notes", key: "notes" }],
    footer: [`${rows.length} customers · total spent ${money(stats.spent, cur)}`],
  });

  return (
    <div>
      <div className="pg-head">
        <div><h2>Customers</h2><p>Added automatically when a phone number is entered at checkout.</p></div>
        <div style={{ display: "flex", gap: 8 }}>
          {canManage && <ExportMenu onExport={onExport} disabled={!rows.length} />}
          <button className="btn" onClick={() => setForm(EMPTY)}>+ Add customer</button>
        </div>
      </div>
      <div className="grid4 stagger">
        <div className="card kpi"><div className="stat-label">Customers</div><div className="stat-value">{stats.count}</div></div>
        <div className="card kpi k-green"><div className="stat-label">Repeat customers</div><div className="stat-value">{stats.repeat}</div><div className="delta muted">{stats.count ? Math.round((stats.repeat / stats.count) * 100) : 0}% came back</div></div>
        <div className="card kpi k-blue"><div className="stat-label">Total spent</div><div className="stat-value" style={{ fontSize: "1.35rem" }}>{money(stats.spent, cur)}</div></div>
        <div className="card kpi k-rose"><div className="stat-label">Average per customer</div><div className="stat-value" style={{ fontSize: "1.35rem" }}>{money(stats.avg, cur)}</div></div>
      </div>
      <div className="filters">
        <input className="inp" style={{ minWidth: 240 }} placeholder="Search name, phone or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="inp" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="name">Sort: Name</option><option value="spent">Sort: Top spenders</option><option value="orders">Sort: Most orders</option><option value="recent">Sort: Recently active</option><option value="newest">Sort: Newest</option>
        </select>
      </div>
      {error && <div className="err">{error}</div>}
      {rows.length === 0 ? <div className="card empty">{q ? "No customers match your search." : "No customers yet."}</div> : (
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead><tr><th>Name</th><th>Phone</th><th>Orders</th><th>Spent</th><th>Average</th><th>Last order</th><th></th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>{unnamed(c) ? <em className="muted">{shownName(c)}</em> : <strong>{c.name}</strong>} {topIds.has(c.id) && <span className="badge paid" style={{ animation: "none" }}>⭐ Top</span>}{c.email && <div className="muted" style={{ fontSize: ".8rem" }}>{c.email}</div>}</td>
                  <td>{c.phone ? <a href={`tel:${c.phone}`} style={{ color: "inherit" }}>{c.phone}</a> : "-"}</td>
                  <td>{c.order_count}</td><td>{money(c.total_spent || 0, cur)}</td>
                  <td>{c.order_count ? money(Math.round((c.total_spent || 0) / c.order_count), cur) : "-"}</td>
                  <td>{ago(c.last_order_at)}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {canManage && <button className="btn-o" style={{ marginRight: 8 }} onClick={() => open(c)}>History</button>}
                    <button className="btn-o" style={{ marginRight: 8 }} onClick={() => setForm({ ...EMPTY, ...c, name: unnamed(c) ? "" : c.name })}>{unnamed(c) ? "Add name" : "Edit"}</button>
                    {canManage && <button className="btn-o" onClick={() => remove(c.id)}>Delete</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <div className="modal-bg" onClick={() => setDetail(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620 }}>
            <h3>{unnamed(detail) ? <em className="muted">No name yet</em> : detail.name}</h3>
            <div className="muted" style={{ margin: "4px 0 14px" }}>{[detail.phone, detail.email, detail.address].filter(Boolean).join(" · ") || "No contact details"}</div>
            <div className="grid4" style={{ marginBottom: 14 }}>
              <div className="card" style={{ padding: 14 }}><div className="stat-label">Orders</div><div className="stat-value" style={{ fontSize: "1.3rem" }}>{detail.order_count}</div></div>
              <div className="card" style={{ padding: 14 }}><div className="stat-label">Spent</div><div className="stat-value" style={{ fontSize: "1.1rem" }}>{money(detail.total_spent || 0, cur)}</div></div>
              <div className="card" style={{ padding: 14 }}><div className="stat-label">Average</div><div className="stat-value" style={{ fontSize: "1.1rem" }}>{money(detail.average_order_cents, cur)}</div></div>
            </div>
            {detail.notes && <p style={{ background: "#fffbeb", padding: 10, borderRadius: 8 }}>📝 {detail.notes}</p>}
            <h4 style={{ margin: "12px 0 6px" }}>Order history</h4>
            {detail.orders.length === 0 ? <p className="muted">No orders yet.</p> : (
              <div style={{ maxHeight: 260, overflow: "auto" }}>
                <table className="tbl" style={{ border: 0 }}><tbody>
                  {detail.orders.map((o) => <tr key={o.id}><td>{o.order_number}</td><td>{shortDate(o.created_at)}</td><td>{TYPE[o.order_type]}</td><td>{o.items.map((i) => `${i.quantity}× ${i.product_name}`).join(", ")}</td><td>{money(o.total_cents, cur)}</td><td><span className={`badge ${o.status}`}>{o.status}</span></td></tr>)}
                </tbody></table>
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}><button className="btn-o" onClick={() => { setForm({ ...EMPTY, ...detail }); setDetail(null); }}>Edit</button><button className="btn" onClick={() => setDetail(null)}>Close</button></div>
          </div>
        </div>
      )}

      {form && (
        <div className="modal-bg">
          <form className="modal" onSubmit={save} style={{ display: "grid", gap: 12 }}>
            <h3>{form.id ? "Edit" : "Add"} customer</h3>
            <input className="inp" required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="inp" type="tel" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input className="inp" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="inp" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <textarea className="inp" rows={2} placeholder="Notes (allergies, preferences...)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <div style={{ display: "flex", gap: 8 }}><button type="button" className="btn-o" onClick={() => setForm(null)}>Cancel</button><button className="btn">Save</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
