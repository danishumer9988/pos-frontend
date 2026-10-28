import { useEffect, useState } from "react";
import { apiFetch } from "../../auth/api";
import { errorText } from "../../utils/money";

const css = `
.cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px; }
.cat-card { background: var(--surface); border: 1px solid var(--border); padding: 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; }
.cat-actions { display: flex; gap: 8px; }
.cat-btn { background: none; border: 1px solid var(--border); padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.9rem; }
.cat-btn:hover { background: var(--bg); }
`;

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { fetchCats(); }, []);

  async function fetchCats() {
    try { setCategories(await apiFetch("/api/me/categories")); } catch (e) { setError(errorText(e)); }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    try {
      if (editingId) {
        await apiFetch(`/api/me/categories/${editingId}`, { method: "PATCH", body: JSON.stringify({ name }) });
      } else {
        await apiFetch("/api/me/categories", { method: "POST", body: JSON.stringify({ name }) });
      }
    } catch (err) { setError(errorText(err)); return; }
    setName(""); setEditingId(null); fetchCats();
  }

  async function handleDelete(id) {
    if (!confirm("Delete this category?")) return;
    try { await apiFetch(`/api/me/categories/${id}`, { method: "DELETE" }); } catch (err) { setError(errorText(err)); return; }
    fetchCats();
  }

  return (
    <div>
      <style>{css}</style>
      {error && <div style={{ background: "#fee2e2", color: "#991b1b", padding: 10, borderRadius: 8, marginBottom: 16 }}>{error}</div>}
      <form onSubmit={handleSave} style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        <input
          placeholder="Category Name (e.g. Drinks)"
          value={name} onChange={(e) => setName(e.target.value)}
          style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", flex: 1, maxWidth: "300px" }}
        />
        <button type="submit" style={{ background: "var(--primary)", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>
          {editingId ? "Update" : "Add Category"}
        </button>
        {editingId && <button type="button" onClick={() => { setEditingId(null); setName(""); }} style={{ background: "none", border: "none", cursor: "pointer" }}>Cancel</button>}
      </form>

      <div className="cat-grid">
        {categories.map(c => (
          <div key={c.id} className="cat-card">
            <strong>{c.name}</strong>
            <div className="cat-actions">
              <button className="cat-btn" onClick={() => { setEditingId(c.id); setName(c.name); }}>Edit</button>
              <button className="cat-btn" onClick={() => handleDelete(c.id)}>Delete</button>
            </div>
          </div>
        ))}
        {categories.length === 0 && <p style={{ color: "var(--text-muted)" }}>No categories yet.</p>}
      </div>
    </div>
  );
}