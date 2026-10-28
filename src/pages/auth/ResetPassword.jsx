import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout, { Field } from "../../components/auth/AuthLayout";
import { apiFetch } from "../../auth/api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!email) navigate("/forgot-password", { replace: true });
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setErrors({});

    const found = {};
    if (!/^\d{6}$/.test(otp)) found.otp = "Enter the 6-digit code.";
    if (password.length < 8) found.password = "Use at least 8 characters.";
    if (password !== confirm) found.confirm = "Passwords do not match.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          email,
          otp,
          new_password: password,
          confirm_password: confirm,
        }),
      });
      navigate("/login", { replace: true, state: { resetOk: true } });
    } catch (err) {
      const code = err.data?.error;
      if (code === "too_many_attempts")
        setError("Too many attempts. Request a new code.");
      else if (code === "invalid_or_expired")
        setError("That code is incorrect or expired.");
      else setError("Could not reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    setError("");
    setInfo("");
    setResending(true);
    try {
      await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setInfo("A new code has been sent.");
      setCooldown(60);
    } catch (err) {
      const code = err.data?.error;
      if (code === "cooldown") setError("Please wait a moment before requesting again.");
      else if (code === "rate_limited") setError("Too many requests. Try again later.");
      else setError("Could not resend. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthLayout
      title="Set a new password"
      subtitle={`Enter the 6-digit code sent to ${email} and choose a new password.`}
      footer={<>Wrong email? <Link to="/forgot-password">Start over</Link></>}
    >
      <form className="au-form" onSubmit={onSubmit} noValidate>
        {error && <p className="au-server-error" role="alert">{error}</p>}
        {info && <p className="au-hint" role="status">{info}</p>}

        <div className="au-field">
          <label htmlFor="otp">Verification code</label>
          <input
            id="otp"
            name="otp"
            className="au-input"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            autoComplete="one-time-code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            style={{
              letterSpacing: "0.4em",
              fontFamily: "ui-monospace, monospace",
              fontSize: "1.25rem",
              textAlign: "center",
            }}
          />
          {errors.otp && <p className="au-error">{errors.otp}</p>}
        </div>

        <Field
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          hint="At least 8 characters."
        />

        <Field
          label="Confirm new password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
        />

        <button type="submit" className="au-btn" disabled={loading}>
          {loading ? "Resetting..." : "Reset password"}
        </button>

        <button
          type="button"
          className="au-btn au-btn-ghost"
          onClick={onResend}
          disabled={resending || cooldown > 0}
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? "Sending..." : "Resend code"}
        </button>
      </form>
    </AuthLayout>
  );
}
