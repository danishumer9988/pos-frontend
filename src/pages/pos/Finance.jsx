import { useEffect, useState } from "react";
import { apiFetch } from "../../auth/api";
import { useAuth } from "../../auth/AuthProvider";
import { money, shortDate, errorText } from "../../utils/money";
import { exportRows } from "../../utils/exporters";
import ExportMenu from "../../components/pos/ExportMenu";
import "../../styles/pos.css";

const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const CATS = ["Rent", "Salaries", "Utilities", "Ingredients / stock", "Marketing", "Maintenance", "Transport", "Other"];

export default function Finance() {
  const { business } = useAuth();
  const cur = business?.currency || "PKR";
  const [days, setDays] = useState(30);
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [d, setD] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ title: "", amount: "", category: "Rent", spent_on: iso(new Date()), note: "" });
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  const useCustom = custom.from && custom.to;
  const qs = useCustom ? `date_from=${custom.from}&date_to=${custom.to}` : `days=${days}`;
  useEffect(() => {
    let alive = true;
    Promise.all([apiFetch(`/api/me/finance?${qs}`), apiFetch(`/api/me/expenses?${qs}`)])
      .then(([f, e]) => { if (alive) { setD(f); setExpenses(e); setError(""); } })
      .catch((e) => { if (alive) setError(errorText(e)); });
    return () => { alive = false; };
  }, [qs, tick]);

  const pick = (n) => { setCustom({ from: "", to: "" }); setDays(n); };

  async function addExpense(e) {
    e.preventDefault();
    const amount = Math.round(parseFloat(form.amount) * 100);
    if (!form.title.trim() || !(amount > 0)) return setError("Enter what it was for and an amount above zero.");
    try {
      await apiFetch("/api/me/expenses", { method: "POST", body: JSON.stringify({ title: form.title, amount_cents: amount, category: form.category, spent_on: form.spent_on, note: form.note }) });
      setForm({ ...form, title: "", amount: "", note: "" }); setError(""); setTick((t) => t + 1);
    } catch (err) { setError(errorText(err)); }
  }
  async function delExpense(id) {
    if (!confirm("Delete this expense?")) return;
    try { await apiFetch(`/api/me/expenses/${id}`, { method: "DELETE" }); setTick((t) => t + 1); } catch (err) { setError(errorText(err)); }
  }

  async function onExport(format) {
    const m = (c) => c / 100;
    await exportRows({
      format, title: "Profit by day", filename: "finance", rows: d.daily, json: { summary: d, expenses },
      columns: [{ label: "Date", key: "date" }, { label: "Orders", key: "orders" }, { label: "Revenue", value: (r) => m(r.revenue_cents) }, { label: "Cost of goods", value: (r) => m(r.cogs_cents) }, { label: "Expenses", value: (r) => m(r.expenses_cents) }, { label: "Profit", value: (r) => m(r.profit_cents) }],
      extraSheets: [{ name: "Expenses", rows: expenses, columns: [{ label: "Date", key: "spent_on" }, { label: "Title", key: "title" }, { label: "Category", key: "category" }, { label: "Amount", value: (r) => m(r.amount_cents) }, { label: "Note", key: "note" }] }],
      footer: [`Revenue ${money(d.revenue_cents, cur)} · Gross profit ${money(d.gross_profit_cents, cur)}`, `Expenses ${money(d.expenses_cents, cur)} · Net profit ${money(d.net_profit_cents, cur)}`],
    });
  }

  const maxCat = d ? Math.max(1, ...d.expenses_by_category.map((c) => c.total_cents)) : 1;
  const kpis = d ? [
    ["Revenue (incl. tax)", d.revenue_cents, ""], ["Tax collected", d.tax_cents, "k-blue"], ["Net sales", d.net_sales_cents, ""],
    ["Cost of goods", d.cogs_cents, "k-rose"], ["Gross profit", d.gross_profit_cents, "k-green"], ["Expenses", d.expenses_cents, "k-rose"],
    ["Net profit", d.net_profit_cents, d.net_profit_cents >= 0 ? "k-green" : "k-rose"], ["Cash expected in drawer", d.cash_expected_cents, "k-blue"],
    ["Unpaid open orders", d.open_orders_cents, ""], ["Discounts given", d.discount_cents, ""], ["Refunded", d.refunded_cents, "k-rose"],
  ] : [];

  return (
    <div>
      <div className="pg-head"><div><h2>Finance</h2><p>Profit, expenses and where the money came from.</p></div><ExportMenu onExport={onExport} disabled={!d} /></div>
      <div className="filters">
        <div className="chips">
          <button className={`chip ${!useCustom && days === 1 ? "on" : ""}`} onClick={() => pick(1)}>Today</button>
          {[7, 30, 90].map((n) => <button key={n} className={`chip ${!useCustom && days === n ? "on" : ""}`} onClick={() => pick(n)}>Last {n} days</button>)}
        </div>
        <input className="inp" type="date" max={iso(new Date())} value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} />
        <span className="muted">to</span>
        <input className="inp" type="date" max={iso(new Date())} value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} />
      </div>
      {error && <div className="err">{error}</div>}
      {!d && !error && <div className="grid4">{[1, 2, 3, 4].map((i) => <div key={i} className="card skeleton" style={{ height: 90 }} />)}</div>}
      {d && (
        <>
          <div className="grid4 stagger">
            {kpis.map(([l, v, c]) => <div key={l} className={`card kpi ${c}`}><div className="stat-label">{l}</div><div className="stat-value" style={{ fontSize: "1.35rem" }}>{money(v, cur)}</div></div>)}
          </div>
          <p className="muted" style={{ marginTop: -8, marginBottom: 20 }}>Today {money(d.today_cents, cur)} · Last 7 days {money(d.week_cents, cur)} · Last 30 days {money(d.month_cents, cur)} · All time {money(d.all_time_cents, cur)}</p>

          <div className="two" style={{ marginBottom: 24 }}>
            <div className="card">
              <h3 style={{ marginBottom: 12 }}>Profit by day</h3>
              <div style={{ overflowX: "auto", maxHeight: 340 }}>
                <table className="tbl" style={{ border: 0 }}>
                  <thead><tr><th>Date</th><th>Orders</th><th>Revenue</th><th>Cost</th><th>Expenses</th><th>Profit</th></tr></thead>
                  <tbody>{[...d.daily].reverse().map((r) => <tr key={r.date}><td>{r.date}</td><td>{r.orders}</td><td>{money(r.revenue_cents, cur)}</td><td>{money(r.cogs_cents, cur)}</td><td>{money(r.expenses_cents, cur)}</td><td style={{ fontWeight: 700, color: r.profit_cents >= 0 ? "var(--success)" : "var(--danger)" }}>{money(r.profit_cents, cur)}</td></tr>)}</tbody>
                </table>
              </div>
            </div>
            <div className="card">
              <h3 style={{ marginBottom: 12 }}>By payment method</h3>
              {d.by_method.length === 0 && <p className="muted">Nothing yet.</p>}
              {d.by_method.map((m) => <div key={m.method} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}><span className={`badge ${m.method}`} style={{ animation: "none" }}>{m.method} ({m.count})</span><strong>{money(m.total_cents, cur)}</strong></div>)}
              <h3 style={{ margin: "20px 0 12px" }}>Expenses by category</h3>
              {d.expenses_by_category.length === 0 && <p className="muted">No expenses recorded.</p>}
              <div style={{ display: "grid", gap: 10 }}>{d.expenses_by_category.map((c) => <div key={c.category}><div style={{ display: "flex", justifyContent: "space-between" }}><span>{c.category}</span><strong>{money(c.total_cents, cur)}</strong></div><div className="hbar"><span style={{ width: `${(c.total_cents / maxCat) * 100}%` }} /></div></div>)}</div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 12 }}>Expenses</h3>
            <form onSubmit={addExpense} className="filters" style={{ alignItems: "flex-end" }}>
              <input className="inp" style={{ flex: "2 1 180px" }} placeholder="What was it for?" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <input className="inp" style={{ width: 130 }} type="number" min="0" step="0.01" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              <input className="inp" list="exp-cats" style={{ width: 170 }} placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              <datalist id="exp-cats">{CATS.map((c) => <option key={c} value={c} />)}</datalist>
              <input className="inp" type="date" value={form.spent_on} onChange={(e) => setForm({ ...form, spent_on: e.target.value })} />
              <button className="btn">Add expense</button>
            </form>
            {expenses.length === 0 ? <p className="muted">No expenses in this period.</p> : (
              <table className="tbl"><thead><tr><th>Date</th><th>What</th><th>Category</th><th>Amount</th><th></th></tr></thead>
                <tbody>{expenses.map((x) => <tr key={x.id}><td>{x.spent_on}</td><td>{x.title}</td><td>{x.category}</td><td>{money(x.amount_cents, cur)}</td><td><button className="btn-o" onClick={() => delExpense(x.id)}>Delete</button></td></tr>)}</tbody></table>
            )}
          </div>

          <h3 style={{ marginBottom: 12 }}>Recent payments</h3>
          {d.recent_payments.length === 0 ? <div className="card empty">No payments yet.</div> : (
            <table className="tbl"><thead><tr><th>Order</th><th>Date</th><th>Method</th><th>Amount</th><th>Order status</th></tr></thead>
              <tbody>{d.recent_payments.map((p) => <tr key={p.id}><td>{p.order_number}</td><td>{shortDate(p.created_at)}</td><td><span className={`badge ${p.method}`}>{p.method}</span></td><td>{money(p.amount_cents, cur)}</td><td><span className={`badge ${p.order_status}`}>{p.order_status}</span></td></tr>)}</tbody></table>
          )}
        </>
      )}
    </div>
  );
}
