"use client";

import { useState } from "react";

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
        slug: form.get("slug"),
        reason: form.get("reason"),
      }),
    });
    const data = await res.json();
    setStatus(
      data.ok
        ? "Request logged. No money moved. The owner reviews refunds."
        : data.error || "Try again."
    );
  }

  return (
    <div className="wrap section">
      <h1>Refunds</h1>
      <p className="lede">
        Ask within 14 days. Agents log the request. They cannot push money back
        on their own.
      </p>
      <p className="notice">
        High-impact money stays with the legal owner. That is the rule.
      </p>
      <form className="stack" onSubmit={onSubmit} style={{ marginTop: 20 }}>
        <input name="email" type="email" required placeholder="Purchase email" />
        <select name="slug" defaultValue="starter-pack">
          <option value="starter-pack">Starter Pack · $9</option>
          <option value="business-kit">Business Kit · $29</option>
          <option value="member-pass">Member Pass · $19/mo</option>
          <option value="care-pass">Priority Care · $9</option>
        </select>
        <textarea name="reason" required rows={5} placeholder="Why do you want a refund?" />
        <button className="btn" type="submit">
          File refund request
        </button>
      </form>
      {status ? <p className="notice" style={{ marginTop: 16 }}>{status}</p> : null}
    </div>
  );
}
