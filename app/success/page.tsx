import { ClaimAccess } from "./claim-access";

export default function SuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string; demo?: string; slug?: string; order?: string };
}) {
  return (
    <div className="wrap section">
      <h1>You are in.</h1>
      <p className="lede">
        {searchParams.demo
          ? "Demo purchase complete. Nothing was charged."
          : "Payment received. Your download link is on its way by email."}
      </p>
      {searchParams.order || searchParams.session_id ? (
        <p className="notice">Order ID: {searchParams.order || searchParams.session_id}. Keep it for help or refunds.</p>
      ) : null}
      <ClaimAccess sessionId={searchParams.session_id} slug={searchParams.slug} />
    </div>
  );
}
