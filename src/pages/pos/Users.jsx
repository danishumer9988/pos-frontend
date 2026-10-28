import { useEffect, useState } from "react";
import { apiFetch } from "../../auth/api";
import { useAuth } from "../../auth/AuthProvider";
import { errorText } from "../../utils/money";
import "../../styles/pos.css";

const PERM_LABEL = {
  dashboard: ["Home dashboard", "Sales summary and recent orders"],
  checkout: ["Checkout", "Take orders and payments"],
  floor_plan: ["Floor plan", "See tables and their status"],
  orders: ["Orders", "View orders, take payment, cancel"],
  refunds: ["Refunds", "Refund paid orders"],
  inventory: ["Inventory", "Products, categories and stock"],
  customers: ["Customers", "View and manage customers"],
  finance: ["Finance", "Profit, expenses and payments"],
  analytics: ["Analytics", "Sales reports"],
};
const ROLES = [
  { id: "manager", title: "Manager", icon: "🧑‍💼", text: "Runs the shop day to day. Usually sees reports and stock." },
  { id: "cashier", title: "Cashier", icon: "🧾", text: "Takes orders and payments at the counter." },
];
const STEPS = ["User type", "Details", "Access", "Verify email"];
const EMPTY = { role: "cashier", full_name: "", email: "", phone: "", password: "", permissions: [] };

function PermPicker({ all, value, onChange }) {
  const toggle = (p) => onChange(value.includes(p) ? value.filter((x) => x !== p) : [...value, p]);
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button type="button" className="chip" onClick={() => onChange([...all])}>Select all</button>
        <button type="button" className="chip" onClick={() => onChange([])}>None</button>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {all.map((p) => (
          <label key={p} className="card" style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 14px", cursor: "pointer", borderColor: value.includes(p) ? "var(--primary)" : undefined, background: value.includes(p) ? "#fff7ed" : undefined }}>
            <input type="checkbox" checked={value.includes(p)} onChange={() => toggle(p)} />
            <span><strong>{PERM_LABEL[p]?.[0] || p}</strong><br /><span className="muted" style={{ fontSize: ".82rem" }}>{PERM_LABEL[p]?.[1]}</span></span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function Users() {
  const { user } = useAuth();
  const [data, setData] = useState({ staff: [], all_permissions: [], role_defaults: {} });
  const [wiz, setWiz] = useState(null);        // { step, form, created, code, info }
  const [editing, setEditing] = useState(null); // { id, name, role, permissions }
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const reload = () => setTick((t) => t + 1);

  useEffect(() => {
    let alive = true;
    apiFetch("/api/me/staff").then((r) => { if (alive) setData(r); }).catch((e) => { if (alive) setError(errorText(e)); });
    return () => { alive = false; };
  }, [tick]);

  const start = () => setWiz({ step: 0, form: { ...EMPTY, permissions: [...(data.role_defaults.cashier || [])] }, created: null, code: "", info: "", err: "" });
  const setForm = (x) => setWiz((w) => ({ ...w, err: "", form: { ...w.form, ...x } }));
  const pickRole = (role) => setWiz((w) => ({ ...w, step: 1, form: { ...w.form, role, permissions: [...(data.role_defaults[role] || [])] } }));

  function nextFromDetails(e) {
    e.preventDefault();
    const f = wiz.form;
    if (!f.full_name.trim() || !/^\S+@\S+\.\S+$/.test(f.email)) return setWiz({ ...wiz, err: "Enter a name and a valid email address." });
    if (f.password.length < 8) return setWiz({ ...wiz, err: "Password must be at least 8 characters." });
    setWiz({ ...wiz, step: 2, err: "" });
  }

  async function createStaff() {
    if (wiz.form.permissions.length === 0) return setWiz({ ...wiz, err: "Choose at least one page this user can use." });
    try {
      const created = await apiFetch("/api/me/staff", { method: "POST", body: JSON.stringify(wiz.form) });
      setWiz({ ...wiz, step: 3, created, err: "", info: created.code_sent ? `We sent a 6-digit code to ${created.email}.` : "The email could not be sent. Use “Resend code”." });
      reload();
    } catch (e) { setWiz({ ...wiz, err: e.data?.error === "email_taken" ? "That email is already registered." : errorText(e) }); }
  }

  async function verify(e) {
    e.preventDefault();
    try {
      await apiFetch(`/api/me/staff/${wiz.created.id}/verify`, { method: "POST", body: JSON.stringify({ otp: wiz.code.trim() }) });
      setWiz({ ...wiz, step: 4, err: "" }); reload();
    } catch (err) { setWiz({ ...wiz, err: errorText(err) }); }
  }
  async function resend() {
    try {
      await apiFetch(`/api/me/staff/${wiz.created.id}/verify`, { method: "POST", body: JSON.stringify({ resend: true }) });
      setWiz({ ...wiz, info: `A new code was sent to ${wiz.created.email}.`, err: "" });
    } catch (err) { setWiz({ ...wiz, err: errorText(err) }); }
  }
  const openVerify = (s) => setWiz({ step: 3, form: EMPTY, created: s, code: "", info: `Enter the 6-digit code sent to ${s.email}.`, err: "" });

  async function patch(id, body) {
    try { await apiFetch(`/api/me/staff/${id}`, { method: "PATCH", body: JSON.stringify(body) }); setError(""); reload(); return true; }
    catch (e) { setError(errorText(e)); return false; }
  }
  async function remove(s) {
    if (!confirm(`Delete ${s.full_name}? They will lose access immediately.`)) return;
    try { await apiFetch(`/api/me/staff/${s.id}`, { method: "DELETE" }); reload(); } catch (e) { setError(errorText(e)); }
  }
  function resetPassword(s) {
    const pw = prompt(`New password for ${s.full_name} (min 8 characters):`);
    if (pw) patch(s.id, { password: pw });
  }
  async function saveAccess(e) {
    e.preventDefault();
    if (await patch(editing.id, { role: editing.role, permissions: editing.permissions })) setEditing(null);
  }

  return (
    <div>
      <div className="pg-head">
        <div><h2>Users</h2><p>Add staff and choose exactly which pages each person can use.</p></div>
        <button className="btn" onClick={start}>+ Add user</button>
      </div>
      {error && <div className="err">{error}</div>}
      <div style={{ overflowX: "auto" }}>
        <table className="tbl">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Can use</th><th>Status</th><th></th></tr></thead>
          <tbody>
            <tr><td>{user?.full_name}</td><td>{user?.email}</td><td><span className="badge paid" style={{ animation: "none" }}>Owner (you)</span></td><td className="muted">Everything</td><td>Active</td><td></td></tr>
            {data.staff.map((s) => (
              <tr key={s.id}>
                <td>{s.full_name}{s.phone && <div className="muted" style={{ fontSize: ".8rem" }}>{s.phone}</div>}</td><td>{s.email}</td>
                <td style={{ textTransform: "capitalize" }}>{s.role}</td>
                <td style={{ maxWidth: 260 }}><div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{s.permissions.map((p) => <span key={p} className="badge open" style={{ animation: "none", background: "#f1f5f9", color: "#334155", fontWeight: 500 }}>{PERM_LABEL[p]?.[0] || p}</span>)}</div></td>
                <td>{!s.email_verified ? <span className="badge open">Email not verified</span> : <span className={`badge ${s.is_active ? "paid" : "cancelled"}`}>{s.is_active ? "Active" : "Disabled"}</span>}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  {!s.email_verified && <button className="btn" style={{ marginRight: 8, padding: "8px 14px" }} onClick={() => openVerify(s)}>Verify</button>}
                  <button className="btn-o" style={{ marginRight: 8 }} onClick={() => setEditing({ id: s.id, name: s.full_name, role: s.role, permissions: [...s.permissions] })}>Edit access</button>
                  <button className="btn-o" style={{ marginRight: 8 }} onClick={() => patch(s.id, { is_active: !s.is_active })}>{s.is_active ? "Disable" : "Enable"}</button>
                  <button className="btn-o" style={{ marginRight: 8 }} onClick={() => resetPassword(s)}>Password</button>
                  <button className="btn-o" onClick={() => remove(s)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.staff.length === 0 && <p className="muted" style={{ marginTop: 16 }}>No staff yet. Add a cashier so they can sell without seeing your finances.</p>}

      {wiz && (
        <div className="modal-bg">
          <div className="modal" style={{ maxWidth: 540 }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
              {STEPS.map((s, i) => (
                <div key={s} style={{ flex: 1, textAlign: "center", fontSize: ".72rem", fontWeight: 700, color: i <= wiz.step ? "var(--primary)" : "var(--text-muted)" }}>
                  <div style={{ height: 5, borderRadius: 4, marginBottom: 6, background: i <= wiz.step ? "var(--grad)" : "#e2e8f0", transition: "background .4s" }} />{s}
                </div>
              ))}
            </div>
            {wiz.err && <div className="err">{wiz.err}</div>}

            {wiz.step === 0 && (
              <div className="stagger" style={{ display: "grid", gap: 10 }}>
                <h3>Choose the user type</h3>
                {ROLES.map((r) => (
                  <button key={r.id} className="card" onClick={() => pickRole(r.id)} style={{ textAlign: "left", cursor: "pointer", display: "flex", gap: 14, alignItems: "center", font: "inherit" }}>
                    <span style={{ fontSize: 30 }}>{r.icon}</span><span><strong>{r.title}</strong><br /><span className="muted">{r.text}</span></span>
                  </button>
                ))}
                <button className="btn-o" onClick={() => setWiz(null)}>Cancel</button>
              </div>
            )}

            {wiz.step === 1 && (
              <form onSubmit={nextFromDetails} style={{ display: "grid", gap: 12 }}>
                <h3>{wiz.form.role === "manager" ? "Manager" : "Cashier"} details</h3>
                <label>Full name<input className="inp" required value={wiz.form.full_name} onChange={(e) => setForm({ full_name: e.target.value })} /></label>
                <label>Email (a verification code is sent here)<input className="inp" required type="email" value={wiz.form.email} onChange={(e) => setForm({ email: e.target.value })} /></label>
                <label>Phone<input className="inp" type="tel" value={wiz.form.phone} onChange={(e) => setForm({ phone: e.target.value })} /></label>
                <label>Password they will log in with<input className="inp" required minLength={8} value={wiz.form.password} onChange={(e) => setForm({ password: e.target.value })} placeholder="At least 8 characters" /></label>
                <div style={{ display: "flex", gap: 8 }}><button type="button" className="btn-o" onClick={() => setWiz({ ...wiz, step: 0 })}>Back</button><button className="btn">Next: access</button></div>
              </form>
            )}

            {wiz.step === 2 && (
              <div style={{ display: "grid", gap: 12 }}>
                <h3>What can {wiz.form.full_name.split(" ")[0] || "this user"} use?</h3>
                <p className="muted" style={{ margin: 0 }}>Pre-filled for a {wiz.form.role}. Tick or untick any page.</p>
                <PermPicker all={data.all_permissions} value={wiz.form.permissions} onChange={(permissions) => setForm({ permissions })} />
                <div style={{ display: "flex", gap: 8 }}><button className="btn-o" onClick={() => setWiz({ ...wiz, step: 1 })}>Back</button><button className="btn" onClick={createStaff}>Create &amp; send code</button></div>
              </div>
            )}

            {wiz.step === 3 && (
              <form onSubmit={verify} style={{ display: "grid", gap: 12 }}>
                <h3>Verify email</h3>
                <p style={{ margin: 0 }}>{wiz.info}</p>
                <input className="inp" inputMode="numeric" maxLength={6} placeholder="6-digit code" value={wiz.code} onChange={(e) => setWiz({ ...wiz, code: e.target.value.replace(/\D/g, ""), err: "" })} style={{ fontSize: "1.4rem", letterSpacing: ".4em", textAlign: "center" }} />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" className="btn-o" onClick={resend}>Resend code</button>
                  <button type="button" className="btn-o" onClick={() => setWiz(null)}>Verify later</button>
                  <button className="btn" disabled={wiz.code.length !== 6}>Verify</button>
                </div>
              </form>
            )}

            {wiz.step === 4 && (
              <div style={{ textAlign: "center", display: "grid", gap: 10 }}>
                <div style={{ fontSize: 54 }}>✅</div>
                <h3>{wiz.created.full_name} is ready</h3>
                <p className="muted" style={{ margin: 0 }}>They can now log in with {wiz.created.email}.</p>
                <button className="btn" onClick={() => setWiz(null)}>Done</button>
              </div>
            )}
          </div>
        </div>
      )}

      {editing && (
        <div className="modal-bg">
          <form className="modal" onSubmit={saveAccess} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
            <h3>Access for {editing.name}</h3>
            <label>Role label<select className="inp" value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })}><option value="manager">Manager</option><option value="cashier">Cashier</option></select></label>
            <PermPicker all={data.all_permissions} value={editing.permissions} onChange={(permissions) => setEditing({ ...editing, permissions })} />
            <div style={{ display: "flex", gap: 8 }}><button type="button" className="btn-o" onClick={() => setEditing(null)}>Cancel</button><button className="btn">Save access</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
