// Remembers (in this browser only) that this visitor signed up and is waiting for admin approval,
// so the landing page can show "under review" instead of "Start free trial".
const KEY = "pos_pending_review";

export function markPending() { try { localStorage.setItem(KEY, "1"); } catch { /* private mode */ } }
export function clearPending() { try { localStorage.removeItem(KEY); } catch { /* private mode */ } }
export function isPending() { try { return localStorage.getItem(KEY) === "1"; } catch { return false; } }
