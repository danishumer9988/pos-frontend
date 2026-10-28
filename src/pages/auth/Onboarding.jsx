import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../auth/api";
import { useAuth } from "../../auth/AuthProvider";

const SUPER_CATEGORIES = [
  { id: "food-hospitality", label: "Food & Hospitality", active: true },
];

const BUSINESS_TYPES = [
  { id: "restaurant-cafe", superCategoryId: "food-hospitality", label: "Restaurant & Café" },
  { id: "fast-food", superCategoryId: "food-hospitality", label: "Fast Food Outlet" },
  { id: "bakery", superCategoryId: "food-hospitality", label: "Bakery & Confectionery" },
  { id: "juice-beverage", superCategoryId: "food-hospitality", label: "Juice, Smoothie & Beverage Shop" },
  { id: "ice-cream", superCategoryId: "food-hospitality", label: "Ice Cream & Dessert Shop" },
  { id: "catering", superCategoryId: "food-hospitality", label: "Catering Service" },
  { id: "food-truck", superCategoryId: "food-hospitality", label: "Food Truck & Takeaway Outlet" },
];

const COUNTRIES = [
  { code: "PK", label: "Pakistan", currency: "PKR" },
  { code: "US", label: "United States", currency: "USD" },
  { code: "GB", label: "United Kingdom", currency: "GBP" },
  { code: "AE", label: "United Arab Emirates", currency: "AED" },
  { code: "SA", label: "Saudi Arabia", currency: "SAR" },
  { code: "IN", label: "India", currency: "INR" },
];

const CURRENCIES = [
  { code: "PKR", label: "PKR — Pakistani Rupee" },
  { code: "USD", label: "USD — US Dollar" },
  { code: "GBP", label: "GBP — Pound Sterling" },
  { code: "AED", label: "AED — UAE Dirham" },
  { code: "SAR", label: "SAR — Saudi Riyal" },
  { code: "INR", label: "INR — Indian Rupee" },
];

const STYLES = `
@import url("https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Figtree:wght@400;500;600;700&display=swap");
body { margin: 0; }
.ob { --ice:#e9edf0; --ink:#1e1023; --muted:#5e4c64; --aub:#2a1530; --aub-deep:#190c1e;
  --gold:#f2a300; --gold-dark:#d18d00; --border:#8c7d92; --error:#b3261e;
  font-family:"Figtree",system-ui,sans-serif; color:var(--ink); background:var(--ice);
  min-height:100vh; padding:40px 24px; line-height:1.5; }
.ob * { box-sizing:border-box; }
.ob-card { max-width:640px; margin:0 auto; background:#fff; border-radius:16px;
  box-shadow:0 14px 40px -12px rgba(25,12,30,0.2); padding:32px; }
.ob h1 { font-family:"Bricolage Grotesque",sans-serif; font-weight:800;
  font-size:clamp(1.6rem,3vw,2rem); margin:0 0 8px; color:var(--aub-deep); letter-spacing:-0.02em; }
.ob-sub { margin:0 0 24px; color:var(--muted); }
.ob-steps { display:flex; gap:8px; margin:0 0 28px; }
.ob-dot { flex:1; height:4px; background:var(--border); border-radius:2px; }
.ob-dot.active { background:var(--gold); }
.ob-h2 { margin:0 0 12px; font-size:1.15rem; color:var(--aub-deep); }
.ob-options { display:grid; gap:10px; margin:0 0 24px; }
.ob-opt { text-align:left; padding:16px; border:1.5px solid var(--border); border-radius:10px;
  background:#fff; font:500 1rem "Figtree",sans-serif; cursor:pointer; color:var(--ink); }
.ob-opt:hover:not(:disabled) { border-color:var(--aub); }
.ob-opt.selected { border-color:var(--aub); background:rgba(242,163,0,0.08);
  box-shadow:0 0 0 2px rgba(242,163,0,0.3); }
.ob-opt:disabled { opacity:0.55; cursor:not-allowed; }
.ob-form { display:grid; gap:16px; }
.ob-field { display:grid; gap:6px; }
.ob-field label { font-weight:500; color:var(--aub-deep); }
.ob-field input, .ob-field select { width:100%; font:400 1rem "Figtree",sans-serif;
  padding:12px; border:1.5px solid var(--border); border-radius:10px;
  background:#fff; color:var(--ink); }
.ob-field input:focus, .ob-field select:focus { outline:none; border-color:var(--aub);
  box-shadow:0 0 0 3px rgba(242,163,0,0.3); }
.ob-error { background:#fdecea; border-left:4px solid var(--error); color:var(--error);
  padding:12px; border-radius:6px; margin:0 0 16px; }
.ob-actions { display:flex; gap:12px; justify-content:space-between; margin-top:24px; }
.ob-btn { font:600 1rem "Figtree",sans-serif; padding:13px 20px; border-radius:10px;
  border:2px solid transparent; background:var(--gold); color:var(--aub-deep);
  cursor:pointer; box-shadow:0 3px 0 var(--gold-dark); }
.ob-btn:hover:not(:disabled) { background:#ffb31a; }
.ob-btn:active:not(:disabled) { transform:translateY(2px); box-shadow:0 1px 0 var(--gold-dark); }
.ob-btn:disabled { opacity:0.6; cursor:wait; }
.ob-btn-ghost { background:transparent; border-color:var(--aub); color:var(--aub); box-shadow:none; }
.ob-btn-ghost:hover:not(:disabled) { background:var(--aub); color:var(--ice); }
@media (max-width:600px) { .ob { padding:20px 12px; } .ob-card { padding:24px 20px; } }
`;

export default function Onboarding() {
  const navigate = useNavigate();
  const { business, setBusiness } = useAuth();

  const [step, setStep] = useState(1);
  const [superId, setSuperId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [details, setDetails] = useState({
    name: "", country: "PK", currency: "PKR", phone: "", email: "", address: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (business?.onboarding_completed_at) navigate("/dashboard", { replace: true });
  }, [business, navigate]);

  const types = useMemo(
    () => BUSINESS_TYPES.filter((t) => t.superCategoryId === superId),
    [superId],
  );

  function update(field, value) {
    setDetails((d) => ({ ...d, [field]: value }));
  }

  function onCountryChange(code) {
    const c = COUNTRIES.find((x) => x.code === code);
    setDetails((d) => ({ ...d, country: code, currency: c?.currency || d.currency }));
  }

  async function finish() {
    setError("");
    if (!details.name.trim()) {
      setError("Business name is required.");
      return;
    }
    setLoading(true);
    try {
      const created = await apiFetch("/api/business/onboarding", {
        method: "POST",
        body: JSON.stringify({
          super_category_id: superId,
          business_type_id: typeId,
          name: details.name.trim(),
          country: details.country,
          currency: details.currency,
          phone: details.phone.trim() || null,
          email: details.email.trim() || null,
          address: details.address.trim() || null,
        }),
      });
      setBusiness(created);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (err.data?.error === "business_exists") {
        navigate("/dashboard", { replace: true });
      } else {
        setError(err.data?.message || "Could not save. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ob">
      <style>{STYLES}</style>
      <div className="ob-card">
        <h1>Set up your business</h1>
        <p className="ob-sub">Just a few details to get your dashboard ready.</p>
        <div className="ob-steps">
          <div className={`ob-dot ${step >= 1 ? "active" : ""}`} />
          <div className={`ob-dot ${step >= 2 ? "active" : ""}`} />
          <div className={`ob-dot ${step >= 3 ? "active" : ""}`} />
        </div>

        {error && <p className="ob-error" role="alert">{error}</p>}

        {step === 1 && (
          <>
            <h2 className="ob-h2">Choose your category</h2>
            <div className="ob-options">
              {SUPER_CATEGORIES.map((sc) => (
                <button
                  key={sc.id}
                  type="button"
                  className={`ob-opt ${superId === sc.id ? "selected" : ""}`}
                  onClick={() => { setSuperId(sc.id); setTypeId(""); }}
                  disabled={!sc.active}
                >
                  {sc.label}
                  {!sc.active && (
                    <span style={{ marginLeft: 8, color: "var(--muted)", fontWeight: 400 }}>
                      — Coming soon
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="ob-actions">
              <span />
              <button type="button" className="ob-btn" onClick={() => setStep(2)} disabled={!superId}>
                Continue
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="ob-h2">What kind of business?</h2>
            <div className="ob-options">
              {types.map((bt) => (
                <button
                  key={bt.id}
                  type="button"
                  className={`ob-opt ${typeId === bt.id ? "selected" : ""}`}
                  onClick={() => setTypeId(bt.id)}
                >
                  {bt.label}
                </button>
              ))}
            </div>
            <div className="ob-actions">
              <button type="button" className="ob-btn ob-btn-ghost" onClick={() => setStep(1)}>Back</button>
              <button type="button" className="ob-btn" onClick={() => setStep(3)} disabled={!typeId}>
                Continue
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="ob-h2">Business details</h2>
            <div className="ob-form">
              <div className="ob-field">
                <label htmlFor="bname">Business name *</label>
                <input id="bname" value={details.name} autoComplete="organization"
                  onChange={(e) => update("name", e.target.value)} />
              </div>
              <div className="ob-field">
                <label htmlFor="country">Country *</label>
                <select id="country" value={details.country}
                  onChange={(e) => onCountryChange(e.target.value)}>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="ob-field">
                <label htmlFor="currency">Currency *</label>
                <select id="currency" value={details.currency}
                  onChange={(e) => update("currency", e.target.value)}>
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="ob-field">
                <label htmlFor="bphone">Business phone (optional)</label>
                <input id="bphone" type="tel" autoComplete="tel"
                  value={details.phone} onChange={(e) => update("phone", e.target.value)} />
              </div>
              <div className="ob-field">
                <label htmlFor="bemail">Business email (optional)</label>
                <input id="bemail" type="email" autoComplete="email"
                  value={details.email} onChange={(e) => update("email", e.target.value)} />
              </div>
              <div className="ob-field">
                <label htmlFor="baddr">Address (optional)</label>
                <input id="baddr" autoComplete="street-address"
                  value={details.address} onChange={(e) => update("address", e.target.value)} />
              </div>
            </div>
            <div className="ob-actions">
              <button type="button" className="ob-btn ob-btn-ghost" onClick={() => setStep(2)}>Back</button>
              <button type="button" className="ob-btn" onClick={finish}
                disabled={loading || !details.name.trim()}>
                {loading ? "Saving..." : "Finish setup"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
