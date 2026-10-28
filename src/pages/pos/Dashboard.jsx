import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { apiFetch } from "../../auth/api";
import { money, shortDate, errorText } from "../../utils/money";
import { RevenueBars } from "./Analytics";

const css = `
.db-grid { display: grid; gap: 24px; grid-template-columns: repeat(12, 1fr); }
.db-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
.db-title { font-size: 1.25rem; font-weight: 700; margin-bottom: 24px; color: var(--text); }

/* Stats Row */
.db-stat { grid-column: span 3; display: flex; flex-direction: column; gap: 8px; }
.db-stat-label { color: var(--text-muted); font-size: 0.9rem; font-weight: 500; }
.db-stat-value { font-size: 2rem; font-weight: 800; color: var(--text); }
.db-stat-trend { font-size: 0.85rem; color: var(--success); font-weight: 600; }
.db-stat-trend.negative { color: var(--danger); }

/* Middle Row */
.db-chart-area { grid-column: span 8; min-height: 350px; display: flex; flex-direction: column; }
.db-chart-placeholder { flex: 1; display: flex; align-items: flex-end; gap: 16px; padding-top: 20px; border-bottom: 1px solid var(--border); padding-bottom: 10px; }
.db-bar { flex: 1; background: #fed7aa; border-radius: 6px 6px 0 0; min-height: 10px; transition: height 0.3s; }
.db-bar:hover { background: var(--primary); }

.db-top-products { grid-column: span 4; }
.db-product-list { display: flex; flex-direction: column; gap: 16px; }
.db-product-item { display: flex; justify-content: space-between; align-items: center; }
.db-product-info { display: flex; gap: 12px; align-items: center; }
.db-product-img { width: 40px; height: 40px; border-radius: 8px; background: var(--bg); border: 1px solid var(--border); }
.db-product-name { font-weight: 600; font-size: 0.95rem; }
.db-product-orders { color: var(--text-muted); font-size: 0.85rem; }
.db-product-revenue { font-weight: 700; color: var(--text); }

/* Bottom Row */
.db-recent { grid-column: span 12; }
.db-table { width: 100%; border-collapse: collapse; text-align: left; }
.db-table th { padding: 12px 0; border-bottom: 1px solid var(--border); color: var(--text-muted); font-weight: 600; font-size: 0.9rem; }
.db-table td { padding: 16px 0; border-bottom: 1px solid var(--border); font-size: 0.95rem; font-weight: 500; }
.db-table tr:last-child td { border-bottom: none; }
.db-status { padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
.db-status.success { background: #dcfce7; color: #166534; }
.db-status.pending { background: #fef9c3; color: #854d0e; }
.db-status.refunded { background: #e0e7ff; color: #3730a3; }
.db-status.cancelled { background: #fee2e2; color: #991b1b; }

@media (max-width: 1200px) {
  .db-stat { grid-column: span 6; }
  .db-chart-area, .db-top-products { grid-column: span 12; }
}
@media (max-width: 768px) {
  .db-stat { grid-column: span 12; }
}
`;

export default function Dashboard() {
  const { business } = useAuth();
  const cur = business?.currency || "PKR";
  const [d, setD] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/me/dashboard").then(setD).catch((e) => setError(errorText(e)));
  }, []);

  return (
    <div>
      <style>{css}</style>
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ color: "var(--text)" }}>Welcome to {business?.name || "Dashboard"}</h2>
        <p style={{ color: "var(--text-muted)", marginTop: "8px" }}>Clear overview of your store performance.</p>
      </div>
      {error && <p style={{ background: "#fee2e2", color: "#991b1b", padding: 12, borderRadius: 8 }}>{error}</p>}
      {!d && !error && <p style={{ color: "var(--text-muted)" }}>Loading...</p>}
      {d && (
        <div className="db-grid">
          <div className="db-card db-stat"><span className="db-stat-label">Total Revenue</span><span className="db-stat-value">{money(d.total_revenue_cents, cur)}</span></div>
          <div className="db-card db-stat"><span className="db-stat-label">Paid Orders</span><span className="db-stat-value">{d.total_orders}</span></div>
          <div className="db-card db-stat"><span className="db-stat-label">Open Orders</span><span className="db-stat-value">{d.pending_orders}</span></div>
          <div className="db-card db-stat"><span className="db-stat-label">Low-stock items</span><span className="db-stat-value" style={d.low_stock_count ? { color: "var(--danger)" } : undefined}>{d.low_stock_count}</span>{d.low_stock_count > 0 && <Link to="/dashboard/inventory" style={{ color: "var(--primary)", fontWeight: 600, fontSize: ".85rem" }}>Review stock</Link>}</div>

          <div className="db-card db-chart-area">
            <h3 className="db-title">Revenue — last 7 days</h3>
            <RevenueBars series={d.week.series} cur={cur} />
          </div>

          <div className="db-card db-top-products">
            <h3 className="db-title">Popular products</h3>
            <div className="db-product-list">
              {d.week.top_products.length === 0 && <span style={{ color: "var(--text-muted)" }}>No sales this week yet. <Link to="/dashboard/checkout" style={{ color: "var(--primary)" }}>Make a sale</Link></span>}
              {d.week.top_products.map((p) => (
                <div className="db-product-item" key={p.product_id}>
                  <div className="db-product-info"><div className="db-product-img"></div><div><div className="db-product-name">{p.name}</div><div className="db-product-orders">{p.quantity} sold</div></div></div>
                  <div className="db-product-revenue">{money(p.revenue_cents, cur)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="db-card db-recent">
            <h3 className="db-title">Recent Transactions</h3>
            {d.recent_orders.length === 0 ? <p style={{ color: "var(--text-muted)" }}>No orders yet.</p> : (
              <table className="db-table">
                <thead><tr><th>Order</th><th>Items</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {d.recent_orders.map((o) => (
                    <tr key={o.id}>
                      <td>{o.order_number}</td>
                      <td>{o.items.map((i) => `${i.quantity}× ${i.product_name}`).join(", ")}</td>
                      <td>{shortDate(o.created_at)}</td>
                      <td>{money(o.total_cents, cur)}</td>
                      <td><span className={`db-status ${o.status === "paid" ? "success" : o.status === "open" ? "pending" : o.status}`}>{o.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
