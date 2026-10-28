import { Link } from "react-router-dom";
import { BRAND } from "../../data/content";
import { useLandingState } from "../../auth/useLandingState";

export default function Header() {
  const { loading, signedIn, pending, dashboardPath } = useLandingState();
  return (
    <header className="lp-header">
      <a href="#top" className="lp-brand">{BRAND}</a>
      <nav className="lp-nav" aria-label="Main">
        <a href="#features">Features</a>
        <a href="#pricing">Pricing</a>
        <a href="#faq">FAQ</a>
        {!signedIn && <a href="#demo">Book a demo</a>}
      </nav>
      <div className="lp-header-actions">
        {loading ? null : signedIn ? (
          <Link to={dashboardPath} className="lp-btn lp-btn-primary">Go to dashboard</Link>
        ) : pending ? (
          <>
            <span className="lp-link" style={{ opacity: 0.8 }}>⏳ Request under review</span>
            <a href="/login" className="lp-btn lp-btn-ghost">Log in</a>
          </>
        ) : (
          <>
            <a href="/login" className="lp-link">Log in</a>
            <a href="/signup" className="lp-btn lp-btn-primary">Start free trial</a>
          </>
        )}
      </div>
    </header>
  );
}
