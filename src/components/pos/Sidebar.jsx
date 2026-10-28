import { NavLink } from "react-router-dom";
import { BRAND } from "../../data/content";
import { NAV_GROUPS } from "./navItems";
import { useAuth } from "../../auth/AuthProvider";

const css = `
.sidebar { width: 260px; background: var(--sidebar-bg); border-right: 1px solid var(--border); display: flex; flex-direction: column; position: fixed; top: 0; bottom: 0; left: 0; z-index: 20; padding: 24px 16px; overflow-y: auto; }
.sb-brand { font-size: 1.5rem; font-weight: 800; color: var(--text); padding: 0 12px 24px; display: flex; align-items: center; gap: 8px; letter-spacing: -0.5px; }
.sb-brand::after { content: ''; width: 8px; height: 8px; background: var(--primary); border-radius: 50%; }
.sb-group { margin-bottom: 24px; }
.sb-group-title { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); padding: 0 12px; margin-bottom: 8px; font-weight: 600; }
.sb-link { display: flex; align-items: center; padding: 10px 12px; color: var(--text-muted); border-radius: 8px; font-size: 0.95rem; font-weight: 500; margin-bottom: 4px; transition: all 0.2s; }
.sb-link:hover { background: #f1f5f9; color: var(--text); }
.sb-link.active { background: #fff7ed; color: var(--primary); font-weight: 600; }
.sidebar { transform: translateX(-100%); transition: transform .3s cubic-bezier(.2,.8,.2,1), box-shadow .3s; }
.sidebar.open { transform: translateX(0); }
.sidebar.overlay { z-index: 60; }
.sidebar.overlay.open { box-shadow: 12px 0 40px rgba(15,23,42,.25); }
`;

export default function Sidebar({ isOpen, overlay, onNavigate }) {
  const { can } = useAuth();
  const groups = NAV_GROUPS
    .map((g) => ({ ...g, items: g.items.filter((i) => can(i.perm)) }))
    .filter((g) => g.items.length > 0);
  return (
    <aside className={`sidebar ${isOpen ? "open" : ""} ${overlay ? "overlay" : ""}`} aria-hidden={!isOpen}>
      <style>{css}</style>
      <div className="sb-brand">{BRAND}</div>
      <nav>
        {groups.map((group) => (
          <div className="sb-group" key={group.title}>
            <div className="sb-group-title">{group.title}</div>
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/dashboard"}
                className={({ isActive }) => `sb-link ${isActive ? "active" : ""}`}
                onClick={onNavigate}
              >
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}