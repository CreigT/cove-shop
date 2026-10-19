import { guardrails, store } from "@/lib/config";
import { dollars } from "@/lib/products";

export default function LegalPage() {
  const g = guardrails();
  return (
    <div className="wrap section">
      <h1>Legal</h1>
      <p className="lede">
        {store.name} is owned by {store.owner}. Support: {store.support}.
      </p>
      <article className="card">
        <h3>What you buy</h3>
        <p>Digital files and written kits delivered by email link and in the library on this site. Some products are written by the store’s AI agents.</p>
      </article>
      <article className="card" style={{ marginTop: 12 }}>
        <h3>Refunds</h3>
        <p>
          Ask within {g.refundWindowDays} days with your order ID. Orders up to{" "}
          {dollars(g.refundAutoCapCents)} are refunded automatically to the original
          card. Larger or late requests wait for owner review.
        </p>
      </article>
      <article className="card" style={{ marginTop: 12 }}>
        <h3>Data</h3>
        <p>
          We store the email you type, your order record, a signed access cookie, and help notes. Help notes may be answered by an AI model.
          We do not sell lists.
        </p>
      </article>
      <article className="card" style={{ marginTop: 12 }}>
        <h3>Payments</h3>
        <p>
          Cards are processed by Stripe when keys are set. Empty keys mean demo
          mode. Demo mode never charges a card.
        </p>
      </article>
    </div>
  );
}
