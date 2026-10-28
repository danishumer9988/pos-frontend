/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch, getToken, setToken, clearToken } from "./api.js";
import { clearPending } from "./pending.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, business: null, loading: Boolean(getToken()) });

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setState({ user: null, business: null, loading: false });
      return;
    }
    try {
      const data = await apiFetch("/api/auth/me");
      setState({ user: data.user, business: data.business ?? null, loading: false });
    } catch {
      clearToken();
      setState({ user: null, business: null, loading: false });
    }
  }, []);

  useEffect(() => {
    if (!getToken()) return undefined; // initial state already says "not loading"
    let alive = true;
    apiFetch("/api/auth/me")
      .then((data) => { if (alive) setState({ user: data.user, business: data.business ?? null, loading: false }); })
      .catch(() => { clearToken(); if (alive) setState({ user: null, business: null, loading: false }); });
    return () => { alive = false; };
  }, []);

  const applyAuth = useCallback(({ token, user, business }) => {
    setToken(token);
    clearPending();
    setState({ user, business: business ?? null, loading: false });
  }, []);

  const setBusiness = useCallback((business) => {
    setState((s) => ({ ...s, business: { ...(s.business || {}), ...business } }));
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Best-effort — clear local state regardless
    }
    clearToken();
    setState({ user: null, business: null, loading: false });
  }, []);

  const value = useMemo(() => {
    const permissions = state.business?.permissions || [];
    // can("finance") or can(["checkout", "orders"]) - true if the user holds any of them
    const can = (wanted) => [].concat(wanted).some((p) => permissions.includes(p));
    return { ...state, role: state.business?.role || "owner", permissions, can, refresh, applyAuth, setBusiness, signOut };
  }, [state, refresh, applyAuth, setBusiness, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}