import { useState } from "react";
import { TYPES } from "../../data/content";
import { apiFetch } from "../../auth/api";
import { useLandingState } from "../../auth/useLandingState";

export default function DemoForm() {
  const { signedIn } = useLandingState();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (signedIn) return null; // already a customer: no demo booking

  async function onSubmit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await apiFetch("/api/demo-requests", {
        method: "POST",
        body: JSON.stringify({ name: f.get("name"), phone: f.get("phone"), business_type: f.get("businessType") }),
      });
      setSent(true);
    } catch (err) {
      setError(err.status === 429 ? "Too many requests. Please try again later." : "Could not send your request. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="lp-section lp-demo" id="demo" aria-labelledby="demo-h">
      <div>
        <h2 id="demo-h">Want to see it first?</h2>
        <p>Leave your details and we will contact you to show you the product.</p>
      </div>
      {sent ? (
        <p className="lp-success" role="status">Thanks. We received your request and will contact you soon.</p>
      ) : (
        <form className="lp-form" onSubmit={onSubmit}>
          <label>Your name<input name="name" type="text" required autoComplete="name" /></label>
          <label>Phone number<input name="phone" type="tel" required autoComplete="tel" /></label>
          <label>
            Business type
            <select name="businessType" required defaultValue="">
              <option value="" disabled>Choose one</option>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
          <button type="submit" disabled={busy} className="lp-btn lp-btn-primary">{busy ? "Sending..." : "Request a demo"}</button>
        </form>
      )}
    </section>
  );
}

