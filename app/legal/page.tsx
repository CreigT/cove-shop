import { store } from "@/lib/config";

export default function LegalPage() {
  return (
    <div className="wrap section">
      <h1>Legal</h1>
      <p className="lede">
        {store.name} is owned by {store.owner}. Support: {store.support}.
      </p>
      <article className="card">
        <h3>What you buy</h3>
        <p>Digital files and written kits delivered in the library on this site.</p>
      </article>
      <article className="card" style={{ marginTop: 12 }}>
        <h3>Refunds</h3>
        <p>
          Ask within 14 days. Requests are logged. Refunds of live charges need
          owner approval. Agents cannot send money on their own.
        </p>
      </article>
      <article className="card" style={{ marginTop: 12 }}>
        <h3>Data</h3>
        <p>
          We store the email you type, a signed access cookie, and help notes.
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
