import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout, { Field } from "../../components/auth/AuthLayout";
import { apiFetch } from "../../auth/api";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "", email: "", password: "", confirm_password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  function update(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function validate() {
    const found = {};
    if (!form.full_name.trim()) found.full_name = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) found.email = "Enter a valid email.";
    if (form.password.length < 8) found.password = "Use at least 8 characters.";
    if (form.password !== form.confirm_password)
      found.confirm_password = "Passwords do not match.";
    return found;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setServerError("");
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      await apiFetch("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          password: form.password,
          confirm_password: form.confirm_password,
        }),
      });
      sessionStorage.setItem("pending_email", form.email.trim());
      navigate("/verify-otp", { state: { email: form.email.trim() } });
    } catch (err) {
      const code = err.data?.error;
      if (code === "email_taken") setServerError("That email is already registered. Try logging in.");
      else if (code === "email_delivery_failed")
        setServerError("We couldn't send the verification email. Please try again in a moment.");
      else if (err.message === "Failed to fetch")
        setServerError("Can't reach the server. Start the backend (python manage.py runserver 8000) and restart 'npm run dev' so it reads frontend/.env.");
      else if (code === "invalid_input")
        setServerError("Please enter your name, a valid email, and a password of at least 8 characters.");
      else if (code === "password_mismatch") setServerError("Passwords do not match.");
      else if (err.status >= 500)
        setServerError("The server crashed (HTTP " + err.status + "). Did you run 'python manage.py migrate'? Check the backend terminal for the error.");
      else setServerError("Signup failed (" + (code || "HTTP " + err.status) + ").");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start your free trial. You'll verify your email next."
      footer={<>Already have an account? <Link to="/login">Log in</Link></>}
    >
      <form className="au-form" onSubmit={onSubmit} noValidate>
        {serverError && <p className="au-server-error" role="alert">{serverError}</p>}
        <Field label="Full name" name="full_name" autoComplete="name"
          value={form.full_name} onChange={update} error={errors.full_name} />
        <Field label="Email" name="email" type="email" autoComplete="email"
          value={form.email} onChange={update} error={errors.email} />
        <Field label="Password" name="password" type="password" autoComplete="new-password"
          value={form.password} onChange={update} error={errors.password}
          hint="At least 8 characters." />
        <Field label="Confirm password" name="confirm_password" type="password"
          autoComplete="new-password" value={form.confirm_password}
          onChange={update} error={errors.confirm_password} />
        <button type="submit" className="au-btn" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
