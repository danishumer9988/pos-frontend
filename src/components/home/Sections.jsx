import { useLandingState } from "../../auth/useLandingState";
import { TYPES, FEATURES, STEPS, PLANS, TRUST, FAQS, PREVIEW_ITEMS } from "../../data/content";

export function Types() {
  return (
    <section className="lp-section" aria-labelledby="types-h">
      <h2 id="types-h">Made for food and drink businesses</h2>
      <ul className="lp-types">{TYPES.map((t) => <li key={t}>{t}</li>)}</ul>
    </section>
  );
}

export function Features() {
  return (
    <section className="lp-section" id="features" aria-labelledby="feat-h">
      <h2 id="feat-h">What you get</h2>
      <dl className="lp-features">
        {FEATURES.map((f) => (
          <div key={f.title}>
            <dt>{f.title}{f.soon && <span className="lp-soon">Coming soon</span>}</dt>
            <dd>{f.text}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// Mockup only. Replace with a real screenshot once the sales screen exists.
export function Preview() {
  return (
    <section className="lp-section" aria-labelledby="prev-h">
      <h2 id="prev-h">The sales screen</h2>
      <p className="lp-sub">A preview of the screen your cashiers will use. It is still in development.</p>
      <div className="lp-pos" role="img" aria-label="Preview of the sales screen with a product grid and an order list">
        <div className="lp-pos-grid">
          {PREVIEW_ITEMS.map(([n, p]) => (
            <div key={n}><span>{n}</span><span>{p}</span></div>
          ))}
        </div>
        <div className="lp-pos-cart">
          <strong>Order #043</strong>
          <p><span>Latte</span><span>4.50</span></p>
          <p><span>Muffin</span><span>3.25</span></p>
          <p className="lp-pos-total"><span>Total</span><span>7.75</span></p>
          <div className="lp-pos-pay">Take payment</div>
        </div>
      </div>
    </section>
  );
}

export function How() {
  return (
    <section className="lp-section" id="how" aria-labelledby="how-h">
      <h2 id="how-h">From signup to first sale</h2>
      <ol className="lp-steps">
        {STEPS.map((s) => (
          <li key={s.title}><strong>{s.title}</strong><span>{s.text}</span></li>
        ))}
      </ol>
    </section>
  );
}

export function Pricing() {
  const { signedIn, pending } = useLandingState();
  return (
    <section className="lp-section" id="pricing" aria-labelledby="price-h">
      <h2 id="price-h">Simple monthly pricing</h2>
      <div className="lp-plans">
        {PLANS.map((p) => (
          <div key={p.name} className={"lp-plan" + (p.featured ? " lp-plan-featured" : "")}>
            <h3>{p.name}</h3>
            <p className="lp-plan-note">{p.note}</p>
            <p className="lp-price"><span>${p.price}</span> / month</p>
            <ul>{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
            {!signedIn && !pending && (
              <a href="/signup" className={"lp-btn " + (p.featured ? "lp-btn-primary" : "lp-btn-ghost")}>
                Start free trial
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export function Trust() {
  return (
    <section className="lp-section" aria-labelledby="trust-h">
      <h2 id="trust-h">Your shop's money and data</h2>
      <dl className="lp-features">
        {TRUST.map((t) => (
          <div key={t.title}><dt>{t.title}</dt><dd>{t.text}</dd></div>
        ))}
      </dl>
    </section>
  );
}

export function Faq() {
  return (
    <section className="lp-section" id="faq" aria-labelledby="faq-h">
      <h2 id="faq-h">Questions shop owners ask</h2>
      <div className="lp-faq">
        {FAQS.map((f) => (
          <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>
        ))}
      </div>
    </section>
  );
}

