import { useState } from "react";
import { Link } from "react-router-dom";
import { BRAND, TRIAL_NOTE } from "../../data/content";

const css = `
@import url("https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Figtree:wght@400;500;600;700&display=swap");

body { margin: 0; }
.au {
  --ice: #e9edf0; --ink: #1e1023; --muted: #5e4c64; --aub: #2a1530; --aub-deep: #190c1e;
  --gold: #f2a300; --gold-dark: #d18d00; --border: #8c7d92; --error: #b3261e;
  font-family: "Figtree", system-ui, sans-serif; color: var(--ink); background: var(--ice);
  min-height: 100vh; line-height: 1.5; display: grid; grid-template-columns: 0.9fr 1.1fr;
}
.au * { box-sizing: border-box; }
.au a { color: inherit; }
.au h1, .au h2 { font-family: "Bricolage Grotesque", sans-serif; line-height: 1.1; margin: 0; letter-spacing: -0.025em; }
.au :is(a, button, input):focus-visible { outline: 3px solid var(--aub); outline-offset: 2px; }
.au-side :is(a, button):focus-visible { outline-color: var(--gold); }

.au-side { background: linear-gradient(165deg, #331b3a 0%, #190c1e 100%); color: var(--ice); padding: 40px; display: flex; flex-direction: column; gap: 32px; }
.au-brand { font: 800 1.35rem "Bricolage Grotesque", sans-serif; letter-spacing: -0.03em; text-decoration: none; color: #fff; }
.au-side h2 { font-size: clamp(1.8rem, 3vw, 2.4rem); max-width: 14ch; color: #fff; }
.au-steps { list-style: none; counter-reset: s; margin: 0; padding: 0; display: grid; gap: 16px; }
.au-steps li { counter-increment: s; display: flex; align-items: center; gap: 14px; }
.au-steps li::before { content: counter(s); flex: none; width: 32px; height: 32px; border-radius: 50%; background: var(--gold); color: var(--aub-deep); display: grid; place-items: center; font-weight: 700; }
.au-trial { margin-top: auto; color: rgba(233, 237, 240, 0.75); }

.au-main { display: grid; place-items: center; padding: 40px 24px; }
.au-box { width: 100%; max-width: 400px; }
.au-box h1 { font-size: 2rem; color: var(--aub-deep); margin-bottom: 8px; }
.au-sub { color: var(--muted); margin: 0 0 24px; }
.au-form { display: grid; gap: 18px; }

.au-field { display: grid; gap: 6px; }
.au-field label { font-weight: 500; color: var(--aub-deep); }
.au-input-wrap { position: relative; }
.au-input { width: 100%; font: 400 1rem "Figtree", sans-serif; padding: 12px; border: 1.5px solid var(--border); border-radius: 10px; background: #fff; color: var(--ink); }
.au-input:focus { outline: none; border-color: var(--aub); box-shadow: 0 0 0 3px rgba(242, 163, 0, 0.35); }
.au-input[aria-invalid="true"] { border-color: var(--error); }
.au-toggle { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); background: none; border: 0; padding: 6px 10px; font: 600 0.9rem "Figtree", sans-serif; color: var(--aub); cursor: pointer; }
.au-hint { color: var(--muted); font-size: 0.9rem; }
.au-error { color: var(--error); font-size: 0.9rem; font-weight: 500; margin: 0; }
.au-check { display: flex; gap: 10px; align-items: flex-start; }
.au-check input { margin-top: 4px; width: 18px; height: 18px; accent-color: var(--aub); }
.au-server-error { background: #fdecea; border-left: 4px solid var(--error); padding: 12px; margin: 0; }

.au-btn { font: 600 1rem "Figtree", sans-serif; padding: 13px 20px; border-radius: 10px; border: 2px solid transparent; background: var(--gold); color: var(--aub-deep); cursor: pointer; box-shadow: 0 3px 0 var(--gold-dark); }
.au-btn:hover:not(:disabled) { background: #ffb31a; }
.au-btn:active:not(:disabled) { transform: translateY(2px); box-shadow: 0 1px 0 var(--gold-dark); }
.au-btn:disabled { opacity: 0.6; cursor: wait; }
.au-btn-ghost { background: transparent; border-color: var(--aub); color: var(--aub); box-shadow: none; }
.au-btn-ghost:hover:not(:disabled) { background: var(--aub); color: var(--ice); }
.au-foot { margin-top: 20px; color: var(--muted); }

@media (max-width: 800px) {
  .au { grid-template-columns: 1fr; }
  .au-side { padding: 24px; gap: 16px; }
  .au-side h2, .au-steps, .au-trial { display: none; }
}
@media (prefers-reduced-motion: reduce) { .au * { transition: none !important; } }
`;

export function Field({ label, name, type = "text", value, onChange, error, hint, autoComplete }) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const describedBy = [hint && `${name}-hint`, error && `${name}-error`].filter(Boolean).join(" ") || undefined;

  return (
    <div className="au-field">
      <label htmlFor={name}>{label}</label>
      <div className="au-input-wrap">
        <input
          id={name} name={name} className="au-input"
          type={isPassword && show ? "text" : type}
          value={value} onChange={onChange} autoComplete={autoComplete}
          aria-invalid={!!error} aria-describedby={describedBy}
        />
        {isPassword && (
          <button type="button" className="au-toggle" onClick={() => setShow((s) => !s)}>
            {show ? "Hide" : "Show"}
          </button>
        )}
      </div>
      {hint && <span className="au-hint" id={`${name}-hint`}>{hint}</span>}
      {error && <p className="au-error" id={`${name}-error`}>{error}</p>}
    </div>
  );
}

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="au">
      <style>{css}</style>
      <aside className="au-side">
        <Link to="/" className="au-brand">{BRAND}</Link>
        <h2>Set up your shop in a few minutes</h2>
        <ol className="au-steps">
          <li>Create your account</li>
          <li>Verify your email</li>
          <li>Tell us about your shop</li>
        </ol>
        <p className="au-trial">{TRIAL_NOTE}</p>
      </aside>
      <main className="au-main">
        <div className="au-box">
          <h1>{title}</h1>
          {subtitle && <p className="au-sub">{subtitle}</p>}
          {children}
          {footer && <p className="au-foot">{footer}</p>}
        </div>
      </main>
    </div>
  );
}
