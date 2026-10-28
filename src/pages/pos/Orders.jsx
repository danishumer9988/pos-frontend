import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiFetch } from "../../auth/api";
import { useAuth } from "../../auth/AuthProvider";
import { money, shortDate, errorText } from "../../utils/money";
import { exportRows } from "../../utils/exporters";
import { printReceipt } from "../../utils/printReceipt";
import Receipt from "../../components/pos/Receipt";
import ExportMenu from "../../components/pos/ExportMenu";
import "../../styles/pos.css";

const TYPE_LABEL = { dine_in: "Dine-in", takeaway: "Takeaway", delivery: "Delivery" };
const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };
const EMPTY = { q: "", status: "", order_type: "", payment_method: "", date_from: "", date_to: "" };

function useDebounced(value, ms) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

export default function Orders() {
  const { business, can } = useAuth();
  const cur = business?.currency || "PKR";
  const [params] = useSearchParams();
  const [f, setF] = useState({ ...EMPTY, q: params.get("q") || "" });
  const applied = useDebounced(f, 300);
  const [orders, setOrders] = useState([]);
  const [open, setOpen] = useState(null);
  const [pay, setPay] = useState(null);           // { order, method, tendered }
  const [printing, setPrinting] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    let alive = true;
    const qs = new URLSearchParams({ limit: "1000" });
    Object.entries(applied).forEach(([k, v]) => v && qs.set(k, v));
    apiFetch(`/api/me/orders?${qs}`)
      .then((rows) => { if (alive) { setOrders(rows); setError(""); } })
      .catch((e) => { if (alive) setError(errorText(e)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [applied, tick]);

  const paidTotal = useMemo(() => orders.filter((o) => o.status === "paid").reduce((s, o) => s + o.total_cents, 0), [orders]);
  const filtered = Object.values(f).some(Boolean);

  async function act(o, status, extra = {}) {
    try {
      const updated = await apiFetch(`/api/me/orders/${o.id}`, { method: "PATCH", body: JSON.stringify({ status, ...extra }) });
      setOpen(updated); setPay(null); setTick((t) => t + 1);
    } catch (e) { setError(errorText(e)); setPay(null); }
  }
  function confirmAct(o, status) {
    if (confirm(`${status === "cancelled" ? "Cancel" : "Refund"} order ${o.order_number}?`)) act(o, status);
  }

  async function onExport(format) {
    const m = (c) => c / 100;
    const columns = [
      { label: "Order", key: "order_number" },
      { label: "Date", value: (o) => new Date(o.created_at).toLocaleString() },
      { label: "Type", value: (o) => TYPE_LABEL[o.order_type] || o.order_type },
      { label: "Table", key: "table_name" },
      { label: "Customer", value: (o) => o.customer_name || "" },
      { label: "Phone", key: "customer_phone" },
      { label: "Address", key: "delivery_address" },
      { label: "Items", value: (o) => o.items.map((i) => `${i.quantity}x ${i.product_name}`).join("; ") },
      { label: "Subtotal", value: (o) => m(o.subtotal_cents) },
      { label: "Discount", value: (o) => m(o.discount_cents) },
      { label: "Tax", value: (o) => m(o.tax_cents) },
      { label: "Total", value: (o) => m(o.total_cents) },
      { label: "Payment", value: (o) => o.payment_method || "" },
      { label: "Cash received", value: (o) => m(o.tendered_cents) },
      { label: "Change", value: (o) => m(o.change_cents) },
      { label: "Status", key: "status" },
      { label: "Served by", value: (o) => o.created_by_name || "" },
    ];
    const pdfCols = ["Order", "Date", "Type", "Table", "Customer", "Phone", "Payment", "Total", "Status"].map((l) => columns.find((c) => c.label === l));
    await exportRows({
      format, title: "Orders", filename: "orders", rows: orders,
      columns: format === "pdf" ? pdfCols : columns,
      extraSheets: [{
        name: "Items",
        columns: [{ label: "Order", key: "order" }, { label: "Product", key: "product" }, { label: "Qty", key: "qty" }, { label: "Unit price", key: "price" }, { label: "Line total", key: "line" }],
        rows: orders.flatMap((o) => o.items.map((i) => ({ order: o.order_number, product: i.product_name, qty: i.quantity, price: m(i.unit_price_cents), line: m(i.unit_price_cents * i.quantity) }))),
      }],
      footer: [`${orders.length} orders`, `Paid total: ${money(paidTotal, cur)}`],
    });
  }

  const quick = (from, to) => setF({ ...f, date_from: from, date_to: to });

  return (
    <div>
      <Receipt order={printing} business={business} />
      <div className="pg-head">
        <div><h2>Orders</h2><p>{loading ? "Loading..." : `${orders.length} order${orders.length === 1 ? "" : "s"} · ${money(paidTotal, cur)} paid`}</p></div>
        <ExportMenu onExport={onExport} disabled={!orders.length} />
      </div>

      <div className="filters">
        <input className="inp" style={{ minWidth: 220 }} placeholder="Search order #, customer, phone, table" value={f.q} onChange={set("q")} />
        <select className="inp" value={f.status} onChange={set("status")}>
          <option value="">All statuses</option><option value="open">Open</option><option value="paid">Paid</option><option value="cancelled">Cancelled</option><option value="refunded">Refunded</option>
        </select>
        <select className="inp" value={f.order_type} onChange={set("order_type")}>
          <option value="">All types</option><option value="dine_in">Dine-in</option><option value="takeaway">Takeaway</option><option value="delivery">Delivery</option>
        </select>
        <select className="inp" value={f.payment_method} onChange={set("payment_method")}>
          <option value="">Any payment</option><option value="cash">Cash</option><option value="card">Card</option><option value="other">Other</option>
        </select>
        <input className="inp" type="date" value={f.date_from} onChange={set("date_from")} title="From" />
        <input className="inp" type="date" value={f.date_to} onChange={set("date_to")} title="To" />
      </div>
      <div className="filters">
        <div className="chips">
          <button className="chip" onClick={() => quick(iso(new Date()), iso(new Date()))}>Today</button>
          <button className="chip" onClick={() => quick(daysAgo(6), iso(new Date()))}>Last 7 days</button>
          <button className="chip" onClick={() => quick(daysAgo(29), iso(new Date()))}>Last 30 days</button>
          {filtered && <button className="chip" onClick={() => setF(EMPTY)}>✕ Clear filters</button>}
        </div>
      </div>

      {error && <div className="err">{error}</div>}
      {!loading && orders.length === 0 ? <div className="card empty">{filtered ? "No orders match these filters." : "No orders yet. Use Checkout to create one."}</div> : (
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead><tr><th>Order</th><th>Date</th><th>Type</th><th>Customer</th><th>Payment</th><th>Served by</th><th>Total</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><strong>{o.order_number}</strong></td>
                  <td>{shortDate(o.created_at)}</td>
                  <td><span className={`badge ${o.order_type}`}>{TYPE_LABEL[o.order_type]}</span>{o.table_name && <span className="muted"> {o.table_name}</span>}</td>
                  <td>{o.customer_name && o.customer_name !== o.customer_phone ? o.customer_name : ""}{o.customer_phone && <div className="muted" style={{ fontSize: ".8rem" }}>{o.customer_phone}</div>}{!o.customer_name && !o.customer_phone && <span className="muted">Walk-in</span>}</td>
                  <td>{o.payment_method ? <span className={`badge ${o.payment_method}`}>{o.payment_method}</span> : <span className="muted">-</span>}</td>
                  <td>{o.created_by_name || "-"}</td>
                  <td>{money(o.total_cents, cur)}</td>
                  <td><span className={`badge ${o.status}`}>{o.status}</span></td>
                  <td><button className="btn-o" onClick={() => setOpen(o)}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <div className="modal-bg" onClick={() => setOpen(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <h3>Order {open.order_number} <span className={`badge ${open.status}`}>{open.status}</span></h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", margin: "14px 0", fontSize: ".92rem" }}>
              <div><span className="muted">Type</span><br /><span className={`badge ${open.order_type}`}>{TYPE_LABEL[open.order_type]}</span></div>
              <div><span className="muted">Table</span><br />{open.table_name || "-"}</div>
              <div><span className="muted">Date</span><br />{new Date(open.created_at).toLocaleString()}</div>
              <div><span className="muted">Served by</span><br />{open.created_by_name || "-"}</div>
              <div><span className="muted">Customer</span><br />{open.customer_name || "Walk-in"}</div>
              <div><span className="muted">Phone</span><br />{open.customer_phone || "-"}</div>
              {open.delivery_address && <div style={{ gridColumn: "1 / -1" }}><span className="muted">Delivery address</span><br />{open.delivery_address}</div>}
            </div>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10 }}>
              {open.items.map((i) => (
                <div key={i.id} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
                  <span>{i.quantity} × {i.product_name} <span className="muted">@ {money(i.unit_price_cents, cur)}</span></span><span>{money(i.quantity * i.unit_price_cents, cur)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8 }}><span className="muted">Subtotal</span><span>{money(open.subtotal_cents, cur)}</span></div>
              {open.discount_cents > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span className="muted">Discount</span><span>-{money(open.discount_cents, cur)}</span></div>}
              {open.tax_cents > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span className="muted">Tax</span><span>{money(open.tax_cents, cur)}</span></div>}
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1.1rem", borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 6 }}><span>Total</span><span>{money(open.total_cents, cur)}</span></div>
            </div>
            {open.payment_method && (
              <div style={{ marginTop: 12, padding: 12, background: "#f8fafc", borderRadius: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span className="muted">Paid by</span><span className={`badge ${open.payment_method}`}>{open.payment_method}</span></div>
                {open.payment_method === "cash" && <>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}><span className="muted">Cash received</span><span>{money(open.tendered_cents, cur)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span className="muted">Change given</span><span>{money(open.change_cents, cur)}</span></div>
                </>}
                {open.payments[0] && <div className="muted" style={{ fontSize: ".8rem", marginTop: 4 }}>Paid {new Date(open.payments[0].created_at).toLocaleString()}</div>}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
              {open.status === "open" && <button className="btn" onClick={() => setPay({ order: open, method: "cash", tendered: "" })}>Take payment</button>}
              {open.status === "open" && <button className="btn-o" onClick={() => confirmAct(open, "cancelled")}>Cancel order</button>}
              {open.status === "paid" && can("refunds") && <button className="btn-o" onClick={() => confirmAct(open, "refunded")}>Refund</button>}
              <button className="btn-o" onClick={() => printReceipt(setPrinting, open)}>Print receipt</button>
              <button className="btn-o" onClick={() => setOpen(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {pay && (
        <div className="modal-bg" onClick={() => setPay(null)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} style={{ display: "grid", gap: 12 }}
            onSubmit={(e) => { e.preventDefault(); act(pay.order, "paid", { payment_method: pay.method, tendered_cents: pay.method === "cash" && pay.tendered !== "" ? Math.round(parseFloat(pay.tendered) * 100) : null }); }}>
            <h3>Take payment — {money(pay.order.total_cents, cur)}</h3>
            <div className="chips">{["cash", "card", "other"].map((m) => <button type="button" key={m} className={`chip ${pay.method === m ? "on" : ""}`} onClick={() => setPay({ ...pay, method: m })} style={{ textTransform: "capitalize" }}>{m}</button>)}</div>
            {pay.method === "cash" && <input className="inp" type="number" step="0.01" min="0" placeholder="Cash received" value={pay.tendered} onChange={(e) => setPay({ ...pay, tendered: e.target.value })} />}
            <div style={{ display: "flex", gap: 8 }}><button type="button" className="btn-o" onClick={() => setPay(null)}>Back</button><button className="btn">Confirm payment</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
