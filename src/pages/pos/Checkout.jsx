import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../auth/api";
import { useAuth } from "../../auth/AuthProvider";
import { money, errorText } from "../../utils/money";
import Receipt from "../../components/pos/Receipt";
import "../../styles/pos.css";

const css = `
.co { display:grid; grid-template-columns:190px minmax(0,1fr) 380px; gap:20px; align-items:start; }
.co-cats { position:sticky; top:96px; background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:10px; display:grid; gap:4px; max-height:calc(100vh - 120px); overflow-y:auto; box-shadow:var(--shadow-sm); }
.co-cats-title { font-size:.72rem; text-transform:uppercase; letter-spacing:.06em; color:var(--text-muted); font-weight:700; padding:6px 10px 4px; }
.co-cat { display:flex; justify-content:space-between; align-items:center; gap:8px; text-align:left; padding:11px 12px; border:0; border-radius:10px; background:none; font:inherit; font-weight:600; color:var(--text-muted); cursor:pointer; transition:all .2s var(--ease); }
.co-cat span { font-size:.75rem; background:#f1f5f9; color:var(--text-muted); border-radius:999px; padding:1px 8px; }
.co-cat:hover { background:#fff7ed; color:var(--primary); transform:translateX(3px); }
.co-cat.on { background:var(--grad); color:#fff; box-shadow:0 4px 12px rgba(249,115,22,.3); }
.co-cat.on span { background:rgba(255,255,255,.25); color:#fff; }
.co-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:12px; }
.co-item { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:16px; text-align:left; cursor:pointer; font:inherit; }
.co-cart { position:sticky; top:96px; }
.co-line { display:flex; justify-content:space-between; align-items:center; gap:8px; padding:10px 0; border-bottom:1px solid var(--border); }
.co-qty { display:flex; align-items:center; gap:8px; }
.co-qty button { width:28px; height:28px; border-radius:6px; border:1px solid var(--border); background:#fff; cursor:pointer; transition:all .15s; }
.co-qty button:hover { background:var(--primary); color:#fff; border-color:var(--primary); }
.co-types { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:14px; }
.co-type { padding:12px 6px; border-radius:12px; border:2px solid var(--border); background:#fff; cursor:pointer; font:inherit; font-weight:700; transition:all .2s var(--ease); text-align:center; }
.co-type small { display:block; font-weight:500; color:var(--text-muted); font-size:.72rem; margin-top:2px; }
.co-type:hover { border-color:var(--primary); transform:translateY(-2px); }
.co-type.on { background:var(--grad); color:#fff; border-color:transparent; box-shadow:0 6px 16px rgba(249,115,22,.35); }
.co-type.on small { color:rgba(255,255,255,.85); }
.co-table { display:flex; justify-content:space-between; align-items:center; gap:8px; padding:12px 14px; border-radius:10px; background:#faf5ff; border:1px dashed #c4b5fd; margin-bottom:12px; }
.co-table.missing { background:#fff7ed; border-color:#fdba74; }
.co-methods { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:10px; }
.co-method { padding:10px 4px; border-radius:10px; border:1px solid var(--border); background:#fff; cursor:pointer; font:inherit; font-weight:600; transition:all .2s var(--ease); }
.co-method:hover { border-color:var(--primary); }
.co-method.on { background:#fff7ed; border-color:var(--primary); color:var(--primary); box-shadow:0 0 0 3px rgba(249,115,22,.15); }
.co-chips { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px; }
@media (max-width:1250px){ .co { grid-template-columns:170px minmax(0,1fr) 340px; } }
@media (max-width:1000px){
  .co { grid-template-columns:1fr; } .co-cart { position:static; }
  .co-cats { position:static; display:flex; overflow-x:auto; max-height:none; padding:8px; } .co-cats-title { display:none; }
  .co-cat { white-space:nowrap; flex:0 0 auto; }
}
`;

const TYPES = [
  { id: "dine_in", label: "Dine-in", sub: "Pick a table" },
  { id: "takeaway", label: "Takeaway", sub: "Take away" },
  { id: "delivery", label: "Delivery", sub: "Send out" },
];
const METHODS = [["cash", "Cash"], ["card", "Card"], ["other", "Other"]];
const DRAFT_KEY = "pos_draft";
const BLANK = { cart: {}, orderType: "takeaway", tableId: "", tableName: "", method: "cash", tendered: "", name: "", phone: "", address: "", discInput: "", discMode: "amount" };

function loadDraft() {
  try { return { ...BLANK, ...JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "{}") }; } catch { return BLANK; }
}

export default function Checkout() {
  const { business, can } = useAuth();
  const navigate = useNavigate();
  const cur = business?.currency || "PKR";
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cat, setCat] = useState("");
  const [d, setD] = useState(loadDraft);            // the order being built; survives a trip to the floor plan
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  const [tick, setTick] = useState(0);
  const [autoPrint, setAutoPrint] = useState(() => localStorage.getItem("pos_autoprint") !== "0");

  const patch = (x) => setD((s) => ({ ...s, ...x }));
  useEffect(() => { try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch { /* private mode */ } }, [d]);

  useEffect(() => {
    let alive = true;
    Promise.all([apiFetch("/api/me/products"), apiFetch("/api/me/categories")])
      .then(([p, c]) => { if (alive) { setProducts(p.filter((x) => x.is_active)); setCategories(c); } })
      .catch((e) => { if (alive) setError(errorText(e)); });
    return () => { alive = false; };
  }, [tick]);

  const shown = products.filter((p) => !cat || p.category_id === cat);
  const lines = useMemo(
    () => Object.entries(d.cart).map(([id, qty]) => ({ p: products.find((x) => x.id === id), qty })).filter((l) => l.p),
    [d.cart, products],
  );
  const subtotal = lines.reduce((s, l) => s + l.p.price_cents * l.qty, 0);
  const rawDisc = parseFloat(d.discInput) || 0;
  const discount = Math.max(0, Math.min(subtotal, d.discMode === "percent" ? Math.round((subtotal * rawDisc) / 100) : Math.round(rawDisc * 100)));
  const taxBps = business?.tax_rate_bps || 0;
  const tax = Math.floor(((subtotal - discount) * taxBps + 5000) / 10000); // same rounding as the server
  const total = subtotal - discount + tax;
  const tenderedCents = Math.round((parseFloat(d.tendered) || 0) * 100);
  const change = d.method === "cash" && d.tendered !== "" ? tenderedCents - total : null;
  const needTable = d.orderType === "dine_in" && !d.tableId;

  const add = (id) => {
    const p = products.find((x) => x.id === id);
    const have = d.cart[id] || 0;
    if (p?.track_stock && have >= p.stock_quantity) return; // can't sell more than we have
    setDone(null);
    patch({ cart: { ...d.cart, [id]: have + 1 } });
  };
  const dec = (id) => {
    const cart = { ...d.cart, [id]: (d.cart[id] || 0) - 1 };
    if (cart[id] <= 0) delete cart[id];
    patch({ cart });
  };
  const reset = () => setD({ ...BLANK, orderType: d.orderType });

  async function charge(payNow) {
    setBusy(true); setError("");
    try {
      const order = await apiFetch("/api/me/orders", {
        method: "POST",
        body: JSON.stringify({
          items: lines.map((l) => ({ product_id: l.p.id, quantity: l.qty })),
          order_type: d.orderType, table_id: d.orderType === "dine_in" ? d.tableId : null,
          payment_method: d.method, tendered_cents: d.method === "cash" && d.tendered !== "" ? tenderedCents : null,
          customer_name: d.name.trim(), customer_phone: d.phone.trim(), delivery_address: d.orderType === "delivery" ? d.address.trim() : "",
          pay_now: payNow, discount_cents: discount,
        }),
      });
      setDone(order); reset(); setTick((t) => t + 1);
      if (payNow && autoPrint) setTimeout(() => window.print(), 450);   // receipt modal is on screen by then
    } catch (e) {
      if (e.data?.error === "table_occupied") patch({ tableId: "", tableName: "" });
      setError(errorText(e));
    } finally { setBusy(false); }
  }

  function toggleAuto(v) { setAutoPrint(v); localStorage.setItem("pos_autoprint", v ? "1" : "0"); }
  const chooseTable = () => navigate("/dashboard/floor-plan?select=1");
  const canCharge = lines.length > 0 && !busy && !needTable && (change === null || change >= 0);

  return (
    <div>
      <style>{css}</style>
      <div className="pg-head"><div><h2>Checkout</h2><p>Choose the order type, tap products, then take payment.</p></div></div>
      {error && <div className="err">{error}</div>}
      <div className="co">
        <aside className="co-cats" aria-label="Product categories">
          <div className="co-cats-title">Categories</div>
          <button className={`co-cat ${!cat ? "on" : ""}`} onClick={() => setCat("")}>All items<span>{products.length}</span></button>
          {categories.map((c) => (
            <button key={c.id} className={`co-cat ${cat === c.id ? "on" : ""}`} onClick={() => setCat(c.id)}>{c.name}<span>{products.filter((p) => p.category_id === c.id).length}</span></button>
          ))}
        </aside>
        <div className="stagger">
          {shown.length === 0 ? (
            <div className="card empty">No active products. Add some under Inventory.</div>
          ) : (
            <div className="co-grid">
              {shown.map((p) => {
                const out = p.track_stock && p.stock_quantity <= 0;
                return (
                  <button key={p.id} className="co-item" onClick={() => add(p.id)} disabled={out} style={out ? { opacity: 0.5, cursor: "not-allowed" } : undefined}>
                    <strong>{p.name}</strong>
                    <div className="muted" style={{ marginTop: 6 }}>{money(p.price_cents, cur)}</div>
                    {p.track_stock && (
                      <div style={{ marginTop: 4, fontSize: ".8rem", color: out ? "var(--danger)" : p.is_low_stock ? "var(--warning)" : "var(--text-muted)" }}>
                        {out ? "Out of stock" : `${p.stock_quantity} ${p.unit || ""} left`}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="card co-cart">
          <div className="co-types">
            {TYPES.map((t) => (
              <button key={t.id} className={`co-type ${d.orderType === t.id ? "on" : ""}`} onClick={() => patch({ orderType: t.id })}>
                {t.label}<small>{t.sub}</small>
              </button>
            ))}
          </div>

          {d.orderType === "dine_in" && (
            <div className={`co-table ${needTable ? "missing" : ""}`}>
              <div>
                <div className="muted" style={{ fontSize: ".78rem" }}>Table</div>
                <strong>{d.tableName || "Not chosen yet"}</strong>
              </div>
              {can(["floor_plan", "tables_edit", "checkout"]) && <button className="btn-o" onClick={chooseTable}>{d.tableId ? "Change" : "Choose table →"}</button>}
            </div>
          )}

          <h3 style={{ marginBottom: 6 }}>Current order</h3>
          {lines.length === 0 && <p className="muted">Cart is empty.</p>}
          {lines.map(({ p, qty }) => (
            <div className="co-line" key={p.id}>
              <div><div style={{ fontWeight: 600 }}>{p.name}</div><div className="muted">{money(p.price_cents * qty, cur)}</div></div>
              <div className="co-qty"><button onClick={() => dec(p.id)}>−</button>{qty}<button onClick={() => add(p.id)}>+</button></div>
            </div>
          ))}

          <div style={{ display: "grid", gap: 6, margin: "14px 0 12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span className="muted">Subtotal</span><span>{money(subtotal, cur)}</span></div>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="inp" type="number" min="0" step="0.01" placeholder="Discount" value={d.discInput} onChange={(e) => patch({ discInput: e.target.value })} />
              <select className="inp" style={{ width: 90 }} value={d.discMode} onChange={(e) => patch({ discMode: e.target.value })}>
                <option value="amount">{cur}</option><option value="percent">%</option>
              </select>
            </div>
            {discount > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span className="muted">Discount</span><span>-{money(discount, cur)}</span></div>}
            {taxBps > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span className="muted">Tax ({(taxBps / 100).toFixed(2).replace(/\.?0+$/, "")}%)</span><span>{money(tax, cur)}</span></div>}
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1.25rem" }}><span>Total</span><span>{money(total, cur)}</span></div>
          </div>

          {d.orderType === "delivery" && (
            <textarea className="inp" rows={2} placeholder="Delivery address" value={d.address} onChange={(e) => patch({ address: e.target.value })} style={{ marginBottom: 10, resize: "vertical" }} />
          )}

          <div className="co-methods">
            {METHODS.map(([k, l]) => <button key={k} className={`co-method ${d.method === k ? "on" : ""}`} onClick={() => patch({ method: k })}>{l}</button>)}
          </div>
          {d.method === "cash" && lines.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <input className="inp" type="number" min="0" step="0.01" placeholder="Cash received" value={d.tendered} onChange={(e) => patch({ tendered: e.target.value })} />
              {change !== null && <div style={{ marginTop: 6, fontWeight: 700, color: change < 0 ? "var(--danger)" : "var(--success)" }}>{change < 0 ? `Short by ${money(-change, cur)}` : `Change due: ${money(change, cur)}`}</div>}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
            <input className="inp" placeholder="Customer name" value={d.name} onChange={(e) => patch({ name: e.target.value })} />
            <input className="inp" type="tel" placeholder="Customer phone number" value={d.phone} onChange={(e) => patch({ phone: e.target.value })} />
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <button className="btn" disabled={!canCharge} onClick={() => charge(true)}>{busy ? "Processing..." : `Charge ${money(total, cur)}`}</button>
            <button className="btn-o" disabled={!lines.length || busy || needTable} onClick={() => charge(false)}>Save as open order</button>
            <button className="btn-o" disabled={busy || (!lines.length && !d.tableId)} onClick={reset}>Clear</button>
          </div>
          {needTable && lines.length > 0 && <p className="muted" style={{ marginTop: 10, marginBottom: 0 }}>Choose a table to continue.</p>}
        </div>
      </div>

      {done && (
        <div className="modal-bg" onClick={() => setDone(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="ok" style={{ marginBottom: 14 }}>
              {done.status === "paid" ? "Payment received" : "Saved as open order"} — {done.order_number}
              {done.change_cents > 0 && <strong> · Change {money(done.change_cents, cur)}</strong>}
            </div>
            <Receipt order={done} business={business} preview />
            <label style={{ display: "flex", gap: 8, alignItems: "center", margin: "14px 0" }}>
              <input type="checkbox" checked={autoPrint} onChange={(e) => toggleAuto(e.target.checked)} /> Print automatically after payment
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn" onClick={() => window.print()}>Print receipt</button>
              <button className="btn-o" onClick={() => setDone(null)}>New order</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
