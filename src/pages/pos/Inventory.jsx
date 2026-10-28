import { Link, Outlet, useLocation } from "react-router-dom";

const css = `
.inv-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.inv-tabs { display: flex; gap: 12px; background: var(--surface); padding: 6px; border-radius: 10px; border: 1px solid var(--border); }
.inv-tab { padding: 8px 24px; border-radius: 8px; font-weight: 600; text-decoration: none; color: var(--text-muted); transition: all 0.2s; }
.inv-tab:hover { color: var(--text); }
.inv-tab.active { background: var(--primary); color: #fff; }
`;

export default function Inventory() {
  const { pathname } = useLocation();
  const isCat = pathname.includes("/categories");
  const isHist = pathname.includes("/stock-history");

  return (
    <div>
      <style>{css}</style>
      <div className="inv-header">
        <div>
          <h2 style={{ color: "var(--text)" }}>Inventory</h2>
          <p style={{ color: "var(--text-muted)" }}>Manage your products and categories.</p>
        </div>
        <div className="inv-tabs">
          <Link to="/dashboard/inventory" className={`inv-tab ${!isCat && !isHist ? "active" : ""}`}>Products</Link>
          <Link to="/dashboard/inventory/categories" className={`inv-tab ${isCat ? "active" : ""}`}>Categories</Link>
          <Link to="/dashboard/inventory/stock-history" className={`inv-tab ${isHist ? "active" : ""}`}>Stock history</Link>
        </div>
      </div>
      <Outlet />
    </div>
  );
}