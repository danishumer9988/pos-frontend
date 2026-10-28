import { useState } from "react";
import "../../styles/pos.css";

// A small "Download" button with PDF / Excel / JSON / CSV choices.
export default function ExportMenu({ onExport, disabled }) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  async function pick(format) {
    setOpen(false);
    setBusy(true);
    try { await onExport(format); } finally { setBusy(false); }
  }

  return (
    <div className="exp">
      <button className="btn-o" disabled={disabled || busy} onClick={() => setOpen((o) => !o)}>
        {busy ? "Preparing..." : "⬇ Download"}
      </button>
      {open && (
        <div className="exp-menu" onMouseLeave={() => setOpen(false)}>
          {[["pdf", "PDF"], ["xlsx", "Excel (.xlsx)"], ["json", "JSON"], ["csv", "CSV"]].map(([k, l]) => (
            <button key={k} onClick={() => pick(k)}>{l}</button>
          ))}
        </div>
      )}
    </div>
  );
}
