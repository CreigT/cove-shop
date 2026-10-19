"use client";

import { useState } from "react";

type Outcome =
  | { kind: "refunded"; amountCents: number }
  | { kind: "held"; reason: string }
  | { kind: "rejected"; reason: string };

function describe(outcome?: Outcome, error?: string) {
  if (!outcome) return error || "Try again.";
  if (outcome.kind === "refunded") {
    return `Refunded $${(outcome.amountCents / 100).toFixed(2)}. It reaches your card in 5 to 10 days.`;
  }
  if (outcome.kind === "held") return `Sent to the owner for review. ${outcome.reason}`;
  return outcome.reason;
}

export default function RefundPage() {
  const [status, setStatus] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/refund", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        orderId: form.get("orderId"),
        reason: form.get("reason"),
      }),
    });
    const data = await res.json();
    setStatus(describe(data.outcome, data.error));
  }

  return (
    <div className="wrap section">
      <h1>Refunds</h1>
      <p className="lede">
        Ask within the refund window with the order ID from your receipt email.
        Small orders are refunded on the spot by the refund agent.
      </p>
      <p className="notice">
        Larger or late requests go to the owner. Refunds always return to the original card.
      </p>
      <form className="stack" onSubmit={onSubmit} style={{ marginTop: 20 }}>
        <input name="email" type="email" required placeholder="Purchase email" />
        <input name="orderId" required placeholder="Order ID (from your receipt email)" />
        <textarea name="reason" required rows={5} placeholder="Why do you want a refund?" />
        <button className="btn" type="submit">
          Request refund
        </button>
      </form>
      {status ? <p className="notice" style={{ marginTop: 16 }}>{status}</p> : null}
    </div>
  );
}
