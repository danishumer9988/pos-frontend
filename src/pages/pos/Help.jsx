import "../../styles/pos.css";

const STEPS = [
  ["Add products", "Go to Inventory → Categories to create categories, then Products to add what you sell."],
  ["Take a sale", "Open Checkout, tap products, choose cash or card, then Charge & mark paid."],
  ["Save for later", "Use Save as open order, then mark it paid from Orders when the customer pays."],
  ["Fix mistakes", "In Orders, cancel an open order or refund a paid one. Refunds are removed from revenue."],
  ["Track stock", "Tick 'Track stock quantity' on a product. Sales reduce it, cancels and refunds put it back, and Stock history shows every change."],
  ["Staff", "Under Users, add a cashier or manager. Cashiers can sell but cannot see finance, reports or settings."],
  ["Receipts", "Click Print receipt after a sale or from Orders. Set the tax rate and footer message in Settings."],
  ["Track money", "Finance and Analytics are calculated from paid orders only."],
];

export default function Help() {
  return (
    <div style={{ maxWidth: 640 }}>
      <div className="pg-head"><div><h2>Help</h2><p>Quick start guide.</p></div></div>
      <div className="card">
        {STEPS.map(([t, d], i) => <div key={t} style={{ padding: "12px 0", borderBottom: i < STEPS.length - 1 ? "1px solid var(--border)" : "none" }}><strong>{i + 1}. {t}</strong><div className="muted" style={{ marginTop: 4 }}>{d}</div></div>)}
      </div>
    </div>
  );
}
