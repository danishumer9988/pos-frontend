import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout, { Field } from "../../components/auth/AuthLayout";
import { apiFetch } from "../../auth/api";
import { useAuth } from "../../auth/AuthProvider";

export default function Login() {
  const { applyAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [resetOk] = useState(Boolean(location.state?.resetOk));
  const reason = new URLSearchParams(location.search).get("reason");

  function update(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    const found = {};
    if (!form.email.trim()) found.email = "Enter your email.";
    if (!form.password) found.password = "Enter your password.";
    setErrors(found);
    setServerError("");
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: form.email.trim(), password: form.password }),
      });
      applyAuth(data);
      navigate(data.business?.onboarding_completed_at ? "/dashboard" : "/onboarding", {
        replace: true,
      });
    } catch (err) {
      if (err.data?.error === "email_unverified") {
        sessionStorage.setItem("pending_email", form.email.trim());
        navigate("/verify-otp", { state: { email: form.email.trim() } });
        return;
      }
      if (err.data?.error === "pending_approval") {
        navigate("/pending", { state: { status: "pending_approval" } });
        return;
      }
      if (err.data?.error === "rejected") { setServerError("Your request was not approved. Please contact us."); return; }
      if (err.data?.error === "access_expired") { setServerError("Your access period has ended. Please contact the admin to extend it."); return; }
      if (err.status === 429) { setServerError("Too many attempts. Please wait a minute and try again."); return; }
      if (err.message === "Failed to fetch")
        setServerError("Can't reach the server. Start the backend on port 8000 and restart 'npm run dev'.");
      else if (err.status >= 500)
        setServerError("The server crashed (HTTP " + err.status + "). Did you run 'python manage.py migrate'? Check the backend terminal.");
      else setServerError("Email or password is incorrect.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Log in"
      subtitle="Welcome back. Enter your details to open your dashboard."
      footer={
        <>
          New here? <Link to="/signup">Create an account</Link>
          {" · "}
          <Link to="/forgot-password">Forgot password?</Link>
        </>
      }
    >
      <form className="au-form" onSubmit={onSubmit} noValidate>
        {resetOk && (
          <p className="au-hint" role="status">
            Password reset. Please log in with your new password.
          </p>
        )}
        {reason && !serverError && (
          <p className="au-server-error" role="alert">
            {reason === "expired" ? "Your access period has ended. Please contact the admin to extend it." : "You were signed out. Please log in again."}
          </p>
        )}
        {serverError && <p className="au-server-error" role="alert">{serverError}</p>}
        <Field label="Email" name="email" type="email" autoComplete="email"
          value={form.email} onChange={update} error={errors.email} />
        <Field label="Password" name="password" type="password" autoComplete="current-password"
          value={form.password} onChange={update} error={errors.password} />
        <button type="submit" className="au-btn" disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>
    </AuthLayout>
  );
}
