import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider.jsx";
import { NAV_GROUPS } from "../components/pos/navItems";

export function Splash() {
  return (
    <p role="status" style={{ padding: 48, textAlign: "center", fontFamily: "system-ui", color: "#5e4c64" }}>
      Loading...
    </p>
  );
}

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

export function RequireVerifiedEmail({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!user.email_verified) return <Navigate to="/verify-otp" replace />;
  return children;
}

export function RequireOnboarding({ children }) {
  const { user, business, loading } = useAuth();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.email_verified) return <Navigate to="/verify-otp" replace />;
  if (!business?.onboarding_completed_at) return <Navigate to="/onboarding" replace />;
  return children;
}

export function RequireNoBusiness({ children }) {
  const { user, business, loading } = useAuth();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.email_verified) return <Navigate to="/verify-otp" replace />;
  if (business?.onboarding_completed_at) return <Navigate to="/dashboard" replace />;
  return children;
}

export function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export function PermGate({ perm, children }) {
  const { can } = useAuth();
  if (can(perm)) return children;
  // send them to the first page they are allowed to use
  const first = NAV_GROUPS.flatMap((g) => g.items).find((i) => can(i.perm));
  return <Navigate to={first ? first.path : "/dashboard/help"} replace />;
}
