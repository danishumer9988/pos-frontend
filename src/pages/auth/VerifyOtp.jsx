import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/auth/AuthLayout";
import { apiFetch } from "../../auth/api";
import { useAuth } from "../../auth/AuthProvider";

const RESEND_COOLDOWN = 60;

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, applyAuth } = useAuth();
  const email =
    location.state?.email ||
    sessionStorage.getItem("pending_email") ||
    user?.email ||
    "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (user?.email_verified) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (!email) navigate("/signup", { replace: true });
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit code.");
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      });
      sessionStorage.removeItem("pending_email");
      if (!data.token) {
        // Email verified, but an admin still has to approve the account
        navigate("/pending", { replace: true, state: { status: data.status || "pending_approval" } });
        return;
      }
      applyAuth(data);
      navigate(data.business?.onboarding_completed_at ? "/dashboard" : "/onboarding", {
        replace: true,
      });
    } catch (err) {
      if (err.data?.error === "too_many_attempts")
        setError("Too many attempts. Request a new code.");
      else if (err.data?.error === "invalid_or_expired")
        setError("That code is incorrect or expired.");
      else if (err.data?.error === "already_verified") navigate("/login", { replace: true });
      else setError("Could not verify. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    setError("");
    setInfo("");
    setResending(true);
    try {
      await apiFetch("/api/auth/resend-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setInfo("A new code has been sent.");
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      if (err.data?.error === "cooldown") setError("Please wait a moment before requesting again.");
      else if (err.data?.error === "rate_limited") setError("Too many codes requested. Try again later.");
      else setError("Could not resend. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={`We sent a 6-digit code to ${email}. It expires in 5 minutes.`}
      footer={<>Wrong email? <Link to="/signup">Start over</Link></>}
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
            aria-invalid={!!error}
            style={{
              letterSpacing: "0.4em",
              fontFamily: "ui-monospace, monospace",
              fontSize: "1.25rem",
              textAlign: "center",
            }}
          />
        </div>
        <button type="submit" className="au-btn" disabled={loading || otp.length !== 6}>
          {loading ? "Verifying..." : "Verify"}
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
