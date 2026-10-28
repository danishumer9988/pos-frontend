import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import AuthLayout from "../../components/auth/AuthLayout";
import { markPending, clearPending } from "../../auth/pending";

const TEXT = {
  pending_approval: {
    title: "Request sent",
    body: "Your request has been sent to the admin. We will notify you by email as soon as your POS is approved and ready to use.",
  },
  rejected: {
    title: "Request not approved",
    body: "Your request could not be approved. Please contact us if you think this is a mistake.",
  },
  access_expired: {
    title: "Access period ended",
    body: "Your access period has finished. Please contact the admin to extend it.",
  },
};

export default function PendingApproval() {
  const status = useLocation().state?.status || "pending_approval";
  const t = TEXT[status] || TEXT.pending_approval;
  useEffect(() => { if (status === "pending_approval") markPending(); else clearPending(); }, [status]);
  return (
    <AuthLayout title={t.title} subtitle="Your email is verified.">
      <div role="status" style={{ textAlign: "center", padding: "8px 0 20px" }}>
        <div style={{ fontSize: 56, lineHeight: 1 }} aria-hidden="true">{status === "pending_approval" ? "⏳" : "⚠️"}</div>
        <p style={{ margin: "16px 0 0", fontSize: "1.05rem", lineHeight: 1.6 }}>{t.body}</p>
        {status === "pending_approval" && (
          <p style={{ marginTop: 12, opacity: 0.7 }}>You can close this page. You will receive an email with your login link.</p>
        )}
      </div>
      <p style={{ textAlign: "center" }}><Link to="/login">Back to log in</Link></p>
    </AuthLayout>
  );
}
