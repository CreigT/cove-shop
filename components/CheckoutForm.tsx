"use client";

import { useState } from "react";

export function CheckoutForm({ slug }: { slug: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, email }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || "Checkout failed.");
        setBusy(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Try again.");
      setBusy(false);
    }
  }

  return (
    <form className="stack" onSubmit={onSubmit}>
      <label htmlFor="email">Email for delivery</label>
      <input
        id="email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
      />
      <button className="btn" type="submit" disabled={busy}>
        {busy ? "Working…" : "Continue to paywall"}
      </button>
      {error ? <p className="muted">{error}</p> : null}
    </form>
  );
}
