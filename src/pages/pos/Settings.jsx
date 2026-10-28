import { useState } from "react";
import { apiFetch } from "../../auth/api";
import { useAuth } from "../../auth/AuthProvider";
import { errorText } from "../../utils/money";
import "../../styles/pos.css";

export default function Settings() {
  const { business, setBusiness } = useAuth();
  const [f, setF] = useState({ name: business?.name || "", phone: business?.phone || "", email: business?.email || "", address: business?.address || "", currency: business?.currency || "PKR", tax: String((business?.tax_rate_bps || 0) / 100), receipt_footer: business?.receipt_footer || "" });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function save(e) {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      setBusiness(await apiFetch("/api/business/profile", { method: "PATCH", body: JSON.stringify({ ...f, tax_rate_bps: Math.round((parseFloat(f.tax) || 0) * 100) }) }));
      setMsg({ ok: true, t: "Saved." });
    } catch (err) { setMsg({ ok: false, t: errorText(err) }); } finally { setBusy(false); }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="pg-head"><div><h2>Settings</h2><p>Your business details.</p></div></div>
      {msg && <div className={msg.ok ? "ok" : "err"}>{msg.t}</div>}
      <form className="card" onSubmit={save} style={{ display: "grid", gap: 12 }}>
        <label>Business name<input className="inp" required value={f.name} onChange={set("name")} /></label>
        <label>Phone<input className="inp" value={f.phone} onChange={set("phone")} /></label>
        <label>Email<input className="inp" type="email" value={f.email} onChange={set("email")} /></label>
        <label>Address<input className="inp" value={f.address} onChange={set("address")} /></label>
        <label>Currency (3-letter code)<input className="inp" maxLength={3} value={f.currency} onChange={set("currency")} /></label>
        <label>Sales tax % (added to every sale, 0 = none)<input className="inp" type="number" min="0" max="100" step="0.01" value={f.tax} onChange={set("tax")} /></label>
        <label>Receipt footer message<input className="inp" maxLength={200} value={f.receipt_footer} onChange={set("receipt_footer")} /></label>
        <div><button className="btn" disabled={busy}>{busy ? "Saving..." : "Save changes"}</button></div>
      </form>
    </div>
  );
}
