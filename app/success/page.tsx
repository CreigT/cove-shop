import { ClaimAccess } from "./claim-access";

export default function SuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string; demo?: string; slug?: string };
}) {
  return (
    <div className="wrap section">
      <h1>You are in.</h1>
      <p className="lede">
        {searchParams.demo
          ? "Demo purchase complete. Nothing was charged."
          : "Payment received. Unlock the library on this browser."}
      </p>
      <ClaimAccess sessionId={searchParams.session_id} slug={searchParams.slug} />
    </div>
  );
}
