import { useEffect, useState } from "react";
import { apiFetch } from "../../auth/api";
import { shortDate, errorText } from "../../utils/money";
import "../../styles/pos.css";

export default function StockHistory() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    apiFetch("/api/me/stock-movements").then((r) => { if (alive) setRows(r); }).catch((e) => { if (alive) setError(errorText(e)); });
    return () => { alive = false; };
  }, []);

  if (error) return <div className="err">{error}</div>;
  if (!rows) return <p className="muted">Loading...</p>;
  if (rows.length === 0) return <div className="card empty">No stock movements yet. Turn on "Track stock" for a product to start.</div>;
  return (
    <table className="tbl">
      <thead><tr><th>Date</th><th>Product</th><th>Change</th><th>Balance</th><th>Reason</th><th>By</th></tr></thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            <td>{shortDate(r.created_at)}</td><td>{r.product_name}</td>
            <td style={{ color: r.change < 0 ? "var(--danger)" : "var(--success)", fontWeight: 700 }}>{r.change > 0 ? `+${r.change}` : r.change}</td>
            <td>{r.balance_after}</td><td>{r.reason}</td><td>{r.user_name || "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
