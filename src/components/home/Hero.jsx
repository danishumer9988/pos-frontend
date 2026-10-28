import { Link } from "react-router-dom";
import { TRIAL_NOTE } from "../../data/content";
import { useLandingState } from "../../auth/useLandingState";

export default function Hero() {
  const { loading, signedIn, pending, name, dashboardPath } = useLandingState();
  return (
    <section className="lp-hero">
      <div>
        <h1>The till that keeps up with your lunch rush.</h1>
        <p className="lp-lead">
          One simple POS for cafés, bakeries, fast-food counters and food trucks.
          Set up your menu today and take your first sale in minutes.
        </p>
        {loading ? null : signedIn ? (
          <>
            <div className="lp-cta-row">
              <Link to={dashboardPath} className="lp-btn lp-btn-primary">Go to dashboard</Link>
            </div>
            <p className="lp-note">Welcome back{name ? `, ${name}` : ""}. Your POS is ready.</p>
          </>
        ) : pending ? (
          <>
            <p role="status" className="lp-note" style={{ fontSize: "1.05rem", padding: "14px 16px", border: "1px solid currentColor", borderRadius: 12 }}>
              ⏳ Your request is under review. We will email you the moment your POS is approved and ready.
            </p>
            <div className="lp-cta-row">
              <a href="/login" className="lp-btn lp-btn-primary">Log in</a>
            </div>
          </>
        ) : (
          <>
            <div className="lp-cta-row">
              <a href="/signup" className="lp-btn lp-btn-primary">Start free trial</a>
              <a href="#demo" className="lp-btn lp-btn-ghost">Book a demo</a>
            </div>
            <p className="lp-note">{TRIAL_NOTE}</p>
          </>
        )}
      </div>

      <div className="lp-receipt-wrap">
        <div className="lp-receipt" role="img" aria-label="Example receipt from a café sale">
          <div className="lp-receipt-head"><strong>Corner Café</strong><span>Order #042</span></div>
          <ul>
            <li><span>2 × Latte (large)</span><span>9.00</span></li>
            <li><span>1 × Oat milk</span><span>0.50</span></li>
            <li><span>1 × Blueberry muffin</span><span>3.25</span></li>
            <li><span>1 × Iced tea</span><span>3.00</span></li>
          </ul>
          <div className="lp-receipt-total"><span>Total</span><span>15.75</span></div>
          <div className="lp-receipt-foot">Paid · Cash · Takeaway</div>
        </div>
      </div>
    </section>
  );
}
