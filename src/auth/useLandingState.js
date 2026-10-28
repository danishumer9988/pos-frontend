import { useAuth } from "./AuthProvider";
import { isPending } from "./pending";

// What the landing page should offer this visitor.
//   signedIn  -> logged in (an account only gets a session once an admin approved it)
//   pending   -> signed up and verified their email, still waiting for approval
//   otherwise -> a new visitor
export function useLandingState() {
  const { user, business, loading } = useAuth();
  const signedIn = Boolean(user);
  return {
    loading,
    signedIn,
    pending: !signedIn && isPending(),
    name: user?.full_name?.split(" ")[0] || "",
    dashboardPath: business?.onboarding_completed_at ? "/dashboard" : "/onboarding",
  };
}
