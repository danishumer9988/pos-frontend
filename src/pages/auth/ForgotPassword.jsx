import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout, { Field } from "../../components/auth/AuthLayout";
import { apiFetch } from "../../auth/api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      navigate("/reset-password", { state: { email: email.trim() } });
    } catch (err) {
      const code = err.data?.error;
      if (code === "rate_limited")
        setError("Too many attempts. Please try again later.");
      else if (code === "cooldown")
        setError("Please wait a moment before trying again.");
      else if (code === "email_delivery_failed")
        setError("We couldn't send the reset email. Please try again.");
      else setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a 6-digit code to reset it."
      footer={<>Remembered it? <Link to="/login">Log in</Link></>}
    >
      <form className="au-form" onSubmit={onSubmit} noValidate>
        {error && <p className="au-server-error" role="alert">{error}</p>}
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" className="au-btn" disabled={loading}>
          {loading ? "Sending..." : "Send reset code"}
        </button>
      </form>
    </AuthLayout>
  );
}
