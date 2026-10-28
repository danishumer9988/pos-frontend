import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import Sidebar from "./Sidebar";
import "../../styles/theme.css";
import "../../styles/polish.css";

const css = `
.pos { display: flex; min-height: 100vh; background: var(--bg); }
.pos-body { flex: 1; min-width: 0; margin-left: 0; display: flex; flex-direction: column; transition: margin .3s cubic-bezier(.2,.8,.2,1); }
.pos-body.pushed { margin-left: 260px; }
.pos-top { height: 72px; background: var(--surface); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; padding: 0 32px; position: sticky; top: 0; z-index: 10; }
.pos-shop { font-weight: 700; font-size: 1.1rem; color: var(--text); }
.pos-user { display: flex; align-items: center; gap: 16px; }
.pos-user-email { color: var(--text-muted); font-size: 0.9rem; }
.pos-btn-out { background: #fff; border: 1px solid var(--border); color: var(--text); padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s; }
.pos-btn-out:hover { background: #f1f5f9; }
.pos-main { padding: 32px; flex: 1; }
.pos-menu-toggle { display: inline-flex; align-items: center; justify-content: center; width: 42px; height: 42px; border: 1px solid var(--border); background: #fff; border-radius: 10px; cursor: pointer; color: var(--text); transition: all .2s; }
.pos-menu-toggle:hover { border-color: var(--primary); color: var(--primary); transform: translateY(-1px); }
.pos-menu-toggle svg { transition: transform .3s cubic-bezier(.2,.8,.2,1); }
.pos-menu-toggle[aria-expanded="true"] svg { transform: rotate(90deg); }
.pos-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.35); z-index: 55; animation: fadeIn .2s ease both; }

@media (max-width: 640px) {
  .pos-top { padding: 0 16px; }
  .pos-main { padding: 16px; }
  .pos-user-email { display: none; }
}
`;

export default function PosLayout() {
  const { user, business, role, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // The menu is pushed beside the page normally. On the Checkout page (which has its own category
  // sidebar) and on small screens it slides over the top instead, and starts closed.
  const isCheckout = location.pathname.startsWith("/dashboard/checkout");
  const [wide, setWide] = useState(() => window.innerWidth > 1024);
  const [pref, setPref] = useState({ pushOpen: true, overlayAt: "" });
  useEffect(() => {
    const onResize = () => setWide(window.innerWidth > 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const overlay = isCheckout || !wide;
  const open = overlay ? pref.overlayAt === location.pathname : pref.pushOpen;
  const toggle = () => setPref((p) => (overlay ? { ...p, overlayAt: p.overlayAt === location.pathname ? "" : location.pathname } : { ...p, pushOpen: !p.pushOpen }));
  const closeOverlay = () => setPref((p) => ({ ...p, overlayAt: "" }));

  async function logout() {
    await signOut();
    navigate("/", { replace: true });
  }

  return (
    <div className="pos">
      <style>{css}</style>

      {/* Sidebar Component */}
      <Sidebar isOpen={open} overlay={overlay} onNavigate={() => overlay && closeOverlay()} />
      {overlay && open && <div className="pos-backdrop" onClick={closeOverlay} />}

      <div className={`pos-body ${open && !overlay ? "pushed" : ""}`}>
        <header className="pos-top">
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button className="pos-menu-toggle" onClick={toggle} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M3 5h14M3 10h14M3 15h14" />
              </svg>
            </button>
            <span className="pos-shop">{business?.name}</span>
          </div>
          <div className="pos-user">
            <span className="pos-user-email">{user?.email} · {role}</span>
            <button className="pos-btn-out" onClick={logout}>Log out</button>
          </div>
        </header>

        <main className="pos-main">
          <div key={location.pathname} className="page-enter"><Outlet /></div>
        </main>
      </div>
    </div>
  );
}