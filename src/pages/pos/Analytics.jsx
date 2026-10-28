import { useEffect, useState } from "react";
import { apiFetch } from "../../auth/api";
import { useAuth } from "../../auth/AuthProvider";
import { money, errorText } from "../../utils/money";
import { exportRows } from "../../utils/exporters";
import ExportMenu from "../../components/pos/ExportMenu";
import "../../styles/pos.css";

export function RevenueBars({ series, cur }) {
  const max = Math.max(1, ...series.map((s) => s.revenue_cents));
  return (
    <>
      <div className="bars">
        {series.map((s, i) => (
          <div key={s.date} className={`bar ${s.revenue_cents === max && max > 1 ? "peak" : ""}`} style={{ height: `${(s.revenue_cents / max) * 100}%`, animationDelay: `${i * 35}ms` }}
            title={`${s.date}: ${money(s.revenue_cents, cur)} · ${s.orders} orders`} />
        ))}
      </div>
      <div className="bar-labels">{series.map((s) => <span key={s.date}>{series.length > 14 ? s.date.slice(8) : new Date(s.date + "T00:00").toLocaleDateString(undefined, { weekday: "short" })}</span>)}</div>
    </>
  );
}

const COLORS = { dine_in: "#8b5cf6", takeaway: "#f97316", delivery: "#06b6d4" };
const NAMES = { dine_in: "Dine-in", takeaway: "Takeaway", delivery: "Delivery" };
const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

function Delta({ pct }) {
  if (pct === null || pct === undefined) return <div className="delta muted">no earlier data</div>;
  return <div className={`delta ${pct >= 0 ? "up" : "down"}`}>{pct >= 0 ? "▲" : "▼"} {Math.abs(pct)}% vs previous period</div>;
}

export default function Analytics() {
  const { business } = useAuth();
  const cur = business?.currency || "PKR";
  const [days, setDays] = useState(7);
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [d, setD] = useState(null);
  const [error, setError] = useState("");

  const useCustom = custom.from && custom.to;
  useEffect(() => {
    let alive = true;
    const qs = useCustom ? `date_from=${custom.from}&date_to=${custom.to}` : `days=${days}`;
    apiFetch(`/api/me/analytics?${qs}`).then((r) => { if (alive) { setD(r); setError(""); } }).catch((e) => { if (alive) setError(errorText(e)); });
    return () => { alive = false; };
  }, [days, custom, useCustom]);

  const pick = (n) => { setCustom({ from: "", to: "" }); setDays(n); };
  const today = iso(new Date());

  async function onExport(format) {
    const m = (c) => c / 100;
    await exportRows({
      format, title: "Daily sales", filename: "analytics", rows: d.series,
      columns: [{ label: "Date", key: "date" }, { label: "Orders", key: "orders" }, { label: "Revenue", value: (r) => m(r.revenue_cents) }],
      extraSheets: [
        { name: "Top products", rows: d.top_products, columns: [{ label: "Product", key: "name" }, { label: "Qty", key: "quantity" }, { label: "Revenue", value: (r) => m(r.revenue_cents) }, { label: "Profit", value: (r) => m(r.profit_cents) }] },
        { name: "By hour", rows: d.by_hour, columns: [{ label: "Hour", key: "hour" }, { label: "Orders", key: "orders" }, { label: "Revenue", value: (r) => m(r.revenue_cents) }] },
        { name: "By type", rows: d.by_type, columns: [{ label: "Type", value: (r) => NAMES[r.order_type] }, { label: "Orders", key: "orders" }, { label: "Revenue", value: (r) => m(r.revenue_cents) }] },
      ],
      json: d,
      footer: [`Revenue: ${money(d.revenue_cents, cur)}`, `Orders: ${d.orders}`, `Gross profit: ${money(d.gross_profit_cents, cur)} (${d.margin_pct}%)`],
    });
  }

  const typeTotal = d ? d.by_type.reduce((s, t) => s + t.revenue_cents, 0) : 0;
  let acc = 0;
  const donut = d && typeTotal ? `conic-gradient(${d.by_type.map((t) => { const from = acc; acc += (t.revenue_cents / typeTotal) * 100; return `${COLORS[t.order_type]} ${from}% ${acc}%`; }).join(",")})` : "#e2e8f0";
  const peak = d ? d.by_hour.reduce((a, b) => (b.revenue_cents > a.revenue_cents ? b : a), d.by_hour[0]) : null;
  const maxHour = d ? Math.max(1, ...d.by_hour.map((h) => h.revenue_cents)) : 1;
  const maxCat = d ? Math.max(1, ...d.by_category.map((c) => c.revenue_cents)) : 1;
  const fmtHour = (h) => `${h % 12 || 12}${h < 12 ? "am" : "pm"}`;

  return (
    <div>
      <div className="pg-head">
        <div><h2>Analytics</h2><p>Sales, profit and busy times for paid orders.</p></div>
        <ExportMenu onExport={onExport} disabled={!d} />
      </div>
      <div className="filters">
        <div className="chips">{[7, 30, 90].map((n) => <button key={n} className={`chip ${!useCustom && days === n ? "on" : ""}`} onClick={() => pick(n)}>Last {n} days</button>)}</div>
        <input className="inp" type="date" max={today} value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} />
        <span className="muted">to</span>
        <input className="inp" type="date" max={today} value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} />
      </div>
      {error && <div className="err">{error}</div>}
      {!d && !error && <div className="grid4">{[1, 2, 3, 4].map((i) => <div key={i} className="card skeleton" style={{ height: 96 }} />)}</div>}
      {d && (
        <>
          <div className="grid4 stagger">
            <div className="card kpi"><div className="stat-label">Revenue</div><div className="stat-value">{money(d.revenue_cents, cur)}</div><Delta pct={d.revenue_change_pct} /></div>
            <div className="card kpi k-blue"><div className="stat-label">Paid orders</div><div className="stat-value">{d.orders}</div><Delta pct={d.orders_change_pct} /></div>
            <div className="card kpi k-green"><div className="stat-label">Gross profit</div><div className="stat-value">{money(d.gross_profit_cents, cur)}</div><div className="delta muted">{d.margin_pct}% margin</div></div>
            <div className="card kpi k-rose"><div className="stat-label">Average order</div><div className="stat-value">{money(d.average_order_cents, cur)}</div><div className="delta muted">{money(d.discount_cents, cur)} discounts given</div></div>
          </div>

          <div className="two" style={{ marginBottom: 24 }}>
            <div className="card"><h3 style={{ marginBottom: 8 }}>Revenue per day</h3><RevenueBars series={d.series} cur={cur} /></div>
            <div className="card">
              <h3 style={{ marginBottom: 14 }}>Order types</h3>
              {typeTotal === 0 ? <p className="muted">No sales in this period.</p> : (
                <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
                  <div className="donut" style={{ background: donut }} />
                  <div className="legend">
                    {d.by_type.map((t) => <div key={t.order_type}><i style={{ background: COLORS[t.order_type] }} />{NAMES[t.order_type]} <strong>{Math.round((t.revenue_cents / typeTotal) * 100)}%</strong><div className="muted" style={{ fontSize: ".8rem" }}>{t.orders} orders · {money(t.revenue_cents, cur)}</div></div>)}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <h3>Busiest hours</h3>
              {peak && peak.revenue_cents > 0 && <span className="badge paid" style={{ animation: "none" }}>Peak: {fmtHour(peak.hour)} · {peak.orders} orders</span>}
            </div>
            <div className="bars" style={{ height: 150, gap: 5 }}>
              {d.by_hour.map((h) => <div key={h.hour} className={`bar ${peak && h.hour === peak.hour && h.revenue_cents > 0 ? "peak" : ""}`} style={{ height: `${(h.revenue_cents / maxHour) * 100}%`, animationDelay: `${h.hour * 25}ms` }} title={`${fmtHour(h.hour)}: ${money(h.revenue_cents, cur)} · ${h.orders} orders`} />)}
            </div>
            <div className="bar-labels" style={{ gap: 5 }}>{d.by_hour.map((h) => <span key={h.hour} style={{ fontSize: ".65rem" }}>{h.hour % 3 === 0 ? fmtHour(h.hour) : ""}</span>)}</div>
          </div>

          <div className="two" style={{ marginBottom: 24 }}>
            <div className="card">
              <h3 style={{ marginBottom: 12 }}>Top products</h3>
              {d.top_products.length === 0 ? <p className="muted">No sales in this period.</p> : (
                <table className="tbl" style={{ border: 0 }}>
                  <thead><tr><th>Product</th><th>Sold</th><th>Revenue</th><th>Profit</th></tr></thead>
                  <tbody>{d.top_products.map((p) => <tr key={p.product_id}><td>{p.name}</td><td>{p.quantity}</td><td>{money(p.revenue_cents, cur)}</td><td style={{ color: p.profit_cents >= 0 ? "var(--success)" : "var(--danger)", fontWeight: 700 }}>{money(p.profit_cents, cur)}</td></tr>)}</tbody>
                </table>
              )}
            </div>
            <div className="card">
              <h3 style={{ marginBottom: 12 }}>By category</h3>
              {d.by_category.length === 0 && <p className="muted">Nothing yet.</p>}
              <div style={{ display: "grid", gap: 12 }}>
                {d.by_category.map((c) => <div key={c.name}><div style={{ display: "flex", justifyContent: "space-between" }}><span>{c.name}</span><strong>{money(c.revenue_cents, cur)}</strong></div><div className="hbar"><span style={{ width: `${(c.revenue_cents / maxCat) * 100}%` }} /></div></div>)}
              </div>
            </div>
          </div>

          <div className="two">
            <div className="card">
              <h3 style={{ marginBottom: 12 }}>Top customers</h3>
              {d.top_customers.length === 0 ? <p className="muted">Add a phone number at checkout to build your customer list.</p> : d.top_customers.map((c, i) => (
                <div key={c.customer_id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}><span>{["🥇", "🥈", "🥉"][i] || `${i + 1}.`} {c.name} <span className="muted">· {c.orders} orders</span></span><strong>{money(c.spent_cents, cur)}</strong></div>
              ))}
            </div>
            <div className="card">
              <h3 style={{ marginBottom: 12 }}>Staff performance</h3>
              {d.by_cashier.length === 0 && <p className="muted">No sales yet.</p>}
              {d.by_cashier.map((c) => <div key={c.name} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}><span>{c.name} <span className="muted">· {c.orders}</span></span><strong>{money(c.revenue_cents, cur)}</strong></div>)}
              <h3 style={{ margin: "18px 0 8px" }}>Payment methods</h3>
              {d.by_method.map((m) => <div key={m.method} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span className={`badge ${m.method}`} style={{ animation: "none" }}>{m.method}</span><span>{money(m.total_cents, cur)} <span className="muted">({m.count})</span></span></div>)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
