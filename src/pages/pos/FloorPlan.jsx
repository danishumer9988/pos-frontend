import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../../auth/api";
import { useAuth } from "../../auth/AuthProvider";
import { money, errorText } from "../../utils/money";
import "../../styles/pos.css";

const css = `
.fp-bar { display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-bottom:16px; }
.fp-tabs { display:flex; gap:6px; border-bottom:1px solid var(--border); flex:1; min-width:220px; }
.fp-tab { padding:10px 16px; border:0; background:none; font:inherit; font-weight:600; color:var(--text-muted); cursor:pointer; border-bottom:3px solid transparent; transition:all .2s; }
.fp-tab:hover { color:var(--primary); }
.fp-tab.on { color:var(--text); border-bottom-color:var(--primary); }
.fp-canvas-wrap { overflow:auto; border-radius:14px; border:1px solid var(--border); background:#f3f4f6; }
.fp-canvas { position:relative; }
.fp-canvas.edit { background-image:radial-gradient(#cbd5e1 1px, transparent 1px); background-size:16px 16px; }
.fp-table { position:absolute; display:flex; flex-direction:column; align-items:center; justify-content:center; font-weight:700; font-size:.85rem; user-select:none; border:0; font-family:inherit; transition:transform .2s var(--ease), box-shadow .2s, background .3s; }
.fp-table small { font-weight:500; opacity:.85; font-size:.72rem; }
.fp-table.rect { border-radius:10px; } .fp-table.round { border-radius:50%; }
.fp-table.free { background:#fff; color:#0f172a; box-shadow:0 1px 3px rgba(0,0,0,.12); }
.fp-table.free:hover { transform:translateY(-3px) scale(1.04); box-shadow:0 8px 18px rgba(16,185,129,.35); outline:2px solid var(--success); cursor:pointer; }
.fp-table.occ { background:var(--grad); color:#fff; box-shadow:0 4px 14px rgba(249,115,22,.4); animation:pulseRing 2.4s infinite; cursor:pointer; }
.fp-table.occ:hover { transform:translateY(-2px); }
.fp-table.editing { cursor:grab; outline:2px dashed #6366f1; touch-action:none; }
.fp-table.editing:active { cursor:grabbing; box-shadow:0 12px 24px rgba(99,102,241,.35); z-index:5; }
.fp-legend { display:flex; gap:16px; margin-top:12px; color:var(--text-muted); font-size:.85rem; flex-wrap:wrap; }
.fp-legend i { display:inline-block; width:12px; height:12px; border-radius:4px; margin-right:6px; vertical-align:-1px; }
.fp-banner { background:linear-gradient(90deg,#ede9fe,#fff7ed); border:1px solid #ddd6fe; padding:12px 16px; border-radius:12px; margin-bottom:14px; font-weight:600; animation:pop .3s var(--ease) both; }
`;

const GRID = 8;
const snap = (v) => Math.max(0, Math.round(v / GRID) * GRID);
const DRAFT_KEY = "pos_draft";

function elapsed(since, now) {
  const m = Math.max(0, Math.floor((now - new Date(since).getTime()) / 60000));
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

export default function FloorPlan() {
  const { can, business } = useAuth();
  const cur = business?.currency || "PKR";
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const selecting = params.get("select") === "1";
  const canEdit = can("tables_edit");

  const [tables, setTables] = useState([]);
  const [section, setSection] = useState("");
  const [edit, setEdit] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [tick, setTick] = useState(0);
  const drag = useRef(null);
  const reload = () => setTick((t) => t + 1);

  useEffect(() => {
    let alive = true;
    apiFetch("/api/me/tables").then((r) => { if (alive) setTables(r); }).catch((e) => { if (alive) setError(errorText(e)); });
    return () => { alive = false; };
  }, [tick]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);

  const sections = [...new Set(tables.map((t) => t.section))];
  const active = sections.includes(section) ? section : sections[0];
  const shown = tables.filter((t) => t.section === active);
  const width = Math.max(720, ...shown.map((t) => t.x + t.w + 40));
  const height = Math.max(420, ...shown.map((t) => t.y + t.h + 40));

  function pickTable(t) {
    if (t.occupied) {
      if (can("orders") && t.order) navigate(`/dashboard/orders?q=${encodeURIComponent(t.order.order_number)}`);
      else setError(`${t.name} is occupied (${t.order?.order_number}).`);
      return;
    }
    if (!can("checkout")) { setError("You don't have permission to start orders."); return; }
    try {
      const old = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "{}");
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...old, orderType: "dine_in", tableId: t.id, tableName: t.name }));
    } catch { /* ignore */ }
    navigate("/dashboard/checkout");
  }

  // ---- drag & drop (owner only, edit mode) ----
  function down(e, t) {
    if (!edit) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id: t.id, sx: e.clientX, sy: e.clientY, ox: t.x, oy: t.y, moved: false };
  }
  function move(e) {
    const g = drag.current;
    if (!g) return;
    const dx = e.clientX - g.sx, dy = e.clientY - g.sy;
    if (Math.abs(dx) + Math.abs(dy) > 4) g.moved = true;
    if (!g.moved) return;
    setTables((ts) => ts.map((t) => (t.id === g.id ? { ...t, x: snap(g.ox + dx), y: snap(g.oy + dy) } : t)));
    setDirty(true);
  }
  function up(t) {
    const g = drag.current;
    drag.current = null;
    if (g && !g.moved && edit) setForm({ id: t.id, name: t.name, seats: t.seats, shape: t.shape, section: t.section });
  }

  async function saveLayout() {
    try {
      await apiFetch("/api/me/tables/layout", { method: "PUT", body: JSON.stringify({ tables: tables.map(({ id, x, y }) => ({ id, x, y })) }) });
      setDirty(false); setError("");
    } catch (e) { setError(errorText(e)); }
  }
  async function saveForm(e) {
    e.preventDefault();
    try {
      const body = JSON.stringify({ name: form.name, seats: Number(form.seats) || 1, shape: form.shape, section: form.section });
      await apiFetch(form.id ? `/api/me/tables/${form.id}` : "/api/me/tables", { method: form.id ? "PATCH" : "POST", body });
      setSection(form.section || "Dining room"); setForm(null); setError(""); reload();
    } catch (err) { setError(errorText(err)); }
  }
  async function removeTable() {
    if (!confirm(`Delete ${form.name}?`)) return;
    try { await apiFetch(`/api/me/tables/${form.id}`, { method: "DELETE" }); setForm(null); reload(); } catch (err) { setError(errorText(err)); }
  }

  return (
    <div>
      <style>{css}</style>
      <div className="pg-head">
        <div><h2>Floor plan</h2><p>{edit ? "Drag tables to arrange them, click one to edit it." : "Tap a free table to start a dine-in order."}</p></div>
        {canEdit && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {edit && <button className="btn-o" onClick={() => setForm({ id: null, name: `Table ${tables.length + 1}`, seats: 4, shape: "rect", section: active || "Dining room" })}>+ Add table</button>}
            {edit && <button className="btn" disabled={!dirty} onClick={saveLayout}>{dirty ? "Save layout" : "Saved"}</button>}
            <button className="btn-o" onClick={() => { if (edit && dirty && !confirm("Leave without saving the new layout?")) return; if (edit && dirty) reload(); setDirty(false); setEdit(!edit); }}>{edit ? "Done editing" : "Edit layout"}</button>
          </div>
        )}
      </div>
      {selecting && <div className="fp-banner">Choose a table for this order</div>}
      {error && <div className="err">{error}</div>}

      {tables.length === 0 ? (
        <div className="card empty">
          No tables yet.{canEdit ? " Click “Edit layout”, then “+ Add table” to build your floor plan." : " Ask the owner to set up the floor plan."}
          {canEdit && <div style={{ marginTop: 14 }}><button className="btn" onClick={() => { setEdit(true); setForm({ id: null, name: "Table 1", seats: 4, shape: "rect", section: "Dining room" }); }}>+ Add your first table</button></div>}
        </div>
      ) : (
        <>
          <div className="fp-bar"><div className="fp-tabs">{sections.map((s) => <button key={s} className={`fp-tab ${s === active ? "on" : ""}`} onClick={() => setSection(s)}>{s}</button>)}</div></div>
          <div className="fp-canvas-wrap">
            <div className={`fp-canvas ${edit ? "edit" : ""}`} style={{ width, height }} onPointerMove={move}>
              {shown.map((t) => (
                <button key={t.id} className={`fp-table ${t.shape} ${t.occupied ? "occ" : "free"} ${edit ? "editing" : ""}`}
                  style={{ left: t.x, top: t.y, width: t.w, height: t.h }}
                  onPointerDown={(e) => down(e, t)} onPointerUp={() => up(t)} onClick={() => !edit && pickTable(t)}>
                  {t.name}
                  <small>{t.occupied ? `${elapsed(t.order.since, now)} · ${money(t.order.total_cents, cur)}` : `${t.seats} seats`}</small>
                </button>
              ))}
            </div>
          </div>
          <div className="fp-legend">
            <span><i style={{ background: "#fff", border: "1px solid #cbd5e1" }} />Free</span>
            <span><i style={{ background: "var(--grad)" }} />Occupied (open order)</span>
            {edit && <span><i style={{ border: "2px dashed #6366f1" }} />Editable</span>}
          </div>
        </>
      )}

      {form && (
        <div className="modal-bg">
          <form className="modal" onSubmit={saveForm} style={{ display: "grid", gap: 12 }}>
            <h3>{form.id ? "Edit" : "Add"} table</h3>
            <label>Name<input className="inp" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label>Section (e.g. Dining room, Patio)<input className="inp" list="fp-sections" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} /></label>
            <datalist id="fp-sections">{sections.map((s) => <option key={s} value={s} />)}</datalist>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label>Seats<input className="inp" type="number" min="1" max="50" value={form.seats} onChange={(e) => setForm({ ...form, seats: e.target.value })} /></label>
              <label>Shape<select className="inp" value={form.shape} onChange={(e) => setForm({ ...form, shape: e.target.value })}><option value="rect">Rectangle</option><option value="round">Round</option></select></label>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className="btn-o" onClick={() => setForm(null)}>Cancel</button>
              {form.id && <button type="button" className="btn-o" style={{ color: "var(--danger)" }} onClick={removeTable}>Delete</button>}
              <button className="btn">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
