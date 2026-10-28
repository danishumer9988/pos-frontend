import { BRAND } from "../../data/content";

export default function Footer() {
  return (
    <footer className="lp-footer">
      <span>© {new Date().getFullYear()} {BRAND}</span>
      <span><a href="/privacy">Privacy</a> · <a href="/terms">Terms</a></span>
    </footer>
  );
}

