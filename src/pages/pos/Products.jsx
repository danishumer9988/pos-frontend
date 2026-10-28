import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../auth/api";
import { useAuth } from "../../auth/AuthProvider";
import { errorText, money } from "../../utils/money";
import "../../styles/pos.css";

const UNITS = ["pcs", "plate", "cup", "bottle", "pack", "box", "dozen", "kg", "g", "litre", "ml", "meter"];
const NEW = { id: null, name: "", category_id: "", price: "", cost: "", sku: "", barcode: "", unit: "pcs", description: "", is_active: true, track_stock: false, stock_quantity: "0", low_stock_threshold: "5" };
const cents = (v) => Math.round(parseFloat(v) * 100);

export default function Products() {
  const { business } = useAuth();
  const cur = business?.currency || "PKR";
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(null);
  const [adjust, setAdjust] = useState(null);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const [q, setQ] = useState("");
  const [catF, setCatF] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const reload = () => setTick((t) => t + 1);

  useEffect(() => {
    let alive = true;
    Promise.all([apiFetch("/api/me/products"), apiFetch("/api/me/categories")])
      .then(([p, c]) => { if (alive) { setProducts(p); setCategories(c); } })
      .catch((e) => { if (alive) setError(errorText(e)); });
    return () => { alive = false; };
  }, [tick]);

  async function save(e) {
    e.preventDefault();
    setError("");
    const price = cents(form.price);
    const cost = form.cost === "" ? 0 : cents(form.cost);
    if (!Number.isFinite(price) || price < 0) { setError("Enter a valid selling price."); return; }
    if (!Number.isFinite(cost) || cost < 0) { setError("Enter a valid cost price."); return; }
    const body = {
      name: form.name, price_cents: price, cost_cents: cost, category_id: form.category_id || null,
      sku: form.sku, barcode: form.barcode, unit: form.unit, description: form.description,
      is_active: form.is_active, track_stock: form.track_stock, low_stock_threshold: Number(form.low_stock_threshold) || 0,
    };
    if (!form.id) body.stock_quantity = Math.max(0, parseInt(form.stock_quantity, 10) || 0); // later changes go through "Adjust stock" so they are logged
    try {
      await apiFetch(form.id ? `/api/me/products/${form.id}` : "/api/me/products", { method: form.id ? "PATCH" : "POST", body: JSON.stringify(body) });
    } catch (err) { setError(errorText(err)); return; }
    setForm(null); reload();
  }

  async function remove(id) {
    if (!confirm("Delete product?")) return;
    try { await apiFetch(`/api/me/products/${id}`, { method: "DELETE" }); } catch (err) {
      setError(err?.data?.error === "protected" ? "This product is used in past orders and can't be deleted. Untick Active instead." : errorText(err));
      return;
    }
    reload();
  }

  async function saveAdjust(e) {
    e.preventDefault();
    try {
      await apiFetch(`/api/me/products/${adjust.product.id}/stock`, { method: "POST", body: JSON.stringify({ change: parseInt(adjust.change, 10), reason: adjust.reason }) });
      setAdjust(null); setError(""); reload();
    } catch (err) { setError(errorText(err)); }
  }

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return products.filter((p) =>
      (!s || [p.name, p.sku, p.barcode].some((x) => (x || "").toLowerCase().includes(s))) &&
      (!catF || p.category_id === catF) && (!lowOnly || p.is_low_stock));
  }, [products, q, catF, lowOnly]);
  const low = products.filter((p) => p.is_active && p.is_low_stock).length;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const price = parseFloat(form?.price), cost = parseFloat(form?.cost);
  const margin = price > 0 && cost >= 0 && form?.cost !== "" ? Math.round(((price - cost) * 100) / price) : null;

  return (
    <div>
      <div className="pg-head">
        <div className="filters" style={{ margin: 0 }}>
          <input className="inp" style={{ minWidth: 220 }} placeholder="Search name, SKU or barcode" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="inp" value={catF} onChange={(e) => setCatF(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className={`chip ${lowOnly ? "on" : ""}`} onClick={() => setLowOnly(!lowOnly)}>Low stock{low ? ` (${low})` : ""}</button>
        </div>
        <button className="btn" onClick={() => setForm(NEW)}>+ Add Product</button>
      </div>
      {error && <div className="err">{error}</div>}
      {products.length === 0 ? <div className="card empty">No products yet. Add your first one.</div> : shown.length === 0 ? <div className="card empty">No products match.</div> : (
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead><tr><th>Name</th><th>SKU / Barcode</th><th>Category</th><th>Price</th><th>Cost</th><th>Margin</th><th>Stock</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {shown.map((p) => {
                const m = p.price_cents > 0 && p.cost_cents > 0 ? Math.round(((p.price_cents - p.cost_cents) * 100) / p.price_cents) : null;
                return (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong>{p.description && <div className="muted" style={{ fontSize: ".78rem" }}>{p.description}</div>}</td>
                    <td>{p.sku || "-"}{p.barcode && <div className="muted" style={{ fontSize: ".78rem" }}>{p.barcode}</div>}</td>
                    <td>{p.category_name || "-"}</td>
                    <td>{money(p.price_cents, cur)} <span className="muted">/{p.unit}</span></td>
                    <td>{p.cost_cents ? money(p.cost_cents, cur) : <span className="muted">-</span>}</td>
                    <td>{m === null ? <span className="muted">-</span> : <span className={`badge ${m >= 30 ? "paid" : m >= 10 ? "open" : "cancelled"}`} style={{ animation: "none" }}>{m}%</span>}</td>
                    <td>{p.track_stock ? <span className={p.stock_quantity <= 0 ? "badge cancelled" : p.is_low_stock ? "badge open" : ""}>{p.stock_quantity} {p.unit}</span> : <span className="muted">Not tracked</span>}</td>
                    <td>{p.is_active ? "Active" : "Hidden"}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {p.track_stock && <button className="btn-o" style={{ marginRight: 8 }} onClick={() => setAdjust({ product: p, change: "", reason: "" })}>Adjust stock</button>}
                      <button className="btn-o" style={{ marginRight: 8 }} onClick={() => setForm({ ...NEW, id: p.id, name: p.name, price: (p.price_cents / 100).toString(), cost: p.cost_cents ? (p.cost_cents / 100).toString() : "", category_id: p.category_id || "", sku: p.sku || "", barcode: p.barcode || "", unit: p.unit || "pcs", description: p.description || "", is_active: p.is_active, track_stock: p.track_stock, low_stock_threshold: String(p.low_stock_threshold) })}>Edit</button>
                      <button className="btn-o" onClick={() => remove(p.id)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <div className="modal-bg">
          <form className="modal" onSubmit={save} style={{ display: "grid", gap: 12, maxWidth: 560 }}>
            <h3>{form.id ? "Edit" : "Add"} product</h3>
            {error && <div className="err" style={{ margin: 0 }}>{error}</div>}
            <label>Product name<input className="inp" required value={form.name} onChange={set("name")} /></label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label>Category<select className="inp" value={form.category_id} onChange={set("category_id")}><option value="">No category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
              <label>Unit<select className="inp" value={form.unit} onChange={set("unit")}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select></label>
              <label>Selling price ({cur})<input className="inp" required type="number" step="0.01" min="0" value={form.price} onChange={set("price")} /></label>
              <label>Cost price ({cur})<input className="inp" type="number" step="0.01" min="0" value={form.cost} onChange={set("cost")} /></label>
            </div>
            {margin !== null && <div style={{ padding: "8px 12px", borderRadius: 8, background: margin >= 0 ? "#dcfce7" : "#fee2e2", color: margin >= 0 ? "#166534" : "#991b1b", fontWeight: 600 }}>
              Profit {money(Math.round((price - cost) * 100), cur)} per {form.unit} · margin {margin}%
            </div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label>SKU / item code<input className="inp" value={form.sku} onChange={set("sku")} /></label>
              <label>Barcode<input className="inp" value={form.barcode} onChange={set("barcode")} /></label>
            </div>
            <label>Description<input className="inp" maxLength={300} value={form.description} onChange={set("description")} placeholder="Size, flavour, notes..." /></label>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" checked={form.track_stock} onChange={set("track_stock")} /> Track stock quantity</label>
            {form.track_stock && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {!form.id && <label>Opening stock<input className="inp" type="number" min="0" value={form.stock_quantity} onChange={set("stock_quantity")} /></label>}
                <label>Low-stock alert at<input className="inp" type="number" min="0" value={form.low_stock_threshold} onChange={set("low_stock_threshold")} /></label>
              </div>
            )}
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" checked={form.is_active} onChange={set("is_active")} /> Active (shown in Checkout)</label>
            <div style={{ display: "flex", gap: 8 }}><button type="button" className="btn-o" onClick={() => setForm(null)}>Cancel</button><button className="btn">Save product</button></div>
          </form>
        </div>
      )}

      {adjust && (
        <div className="modal-bg">
          <form className="modal" onSubmit={saveAdjust} style={{ display: "grid", gap: 12 }}>
            <h3>Adjust stock — {adjust.product.name}</h3>
            <p className="muted" style={{ margin: 0 }}>Currently {adjust.product.stock_quantity} {adjust.product.unit}. Use a positive number to add, negative to remove.</p>
            <input className="inp" required type="number" step="1" placeholder="e.g. 20 or -3" value={adjust.change} onChange={(e) => setAdjust({ ...adjust, change: e.target.value })} />
            <input className="inp" placeholder="Reason (delivery, damaged, recount...)" value={adjust.reason} onChange={(e) => setAdjust({ ...adjust, reason: e.target.value })} />
            <div style={{ display: "flex", gap: 8 }}><button type="button" className="btn-o" onClick={() => setAdjust(null)}>Cancel</button><button className="btn">Apply</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
