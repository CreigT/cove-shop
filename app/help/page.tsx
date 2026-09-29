"use client";

import { useState } from "react";
import Link from "next/link";

export default function HelpPage() {
  const [status, setStatus] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        topic: form.get("topic"),
        message: form.get("message"),
      }),
    });
    const data = await res.json();
    setStatus(data.ok ? "Got it. An agent logged the note." : data.error || "Try again.");
  }

  return (
    <div className="wrap section">
      <h1>Help</h1>
      <p className="lede">
        Short answers first. If you still need a person, leave a note. Agents do not call you.
      </p>
      <div className="grid">
        <article className="card">
          <h3>Where is my pack?</h3>
          <p className="muted">Open the library on the same browser you used to pay. Demo purchases unlock at once.</p>
        </article>
        <article className="card">
          <h3>How do refunds work?</h3>
          <p className="muted">Ask on the refund page. Money does not move until the owner approves.</p>
        </article>
        <article className="card">
          <h3>Want a faster reply?</h3>
          <p className="muted">Priority Care is $9 once. Same-day written answer on business days.</p>
        </article>
      </div>
      <div className="row">
        <Link className="btn ghost" href="/refund">
          Ask for a refund
        </Link>
        <Link className="btn ghost" href="/care">
          $9 priority care
        </Link>
      </div>
      <h2 style={{ marginTop: 36 }}>Leave a note</h2>
      <form className="stack" onSubmit={onSubmit}>
        <input name="email" type="email" required placeholder="you@email.com" />
        <select name="topic" defaultValue="delivery">
          <option value="delivery">I cannot open my pack</option>
          <option value="billing">A charge looks wrong</option>
          <option value="other">Something else</option>
        </select>
        <textarea name="message" required rows={5} placeholder="What happened?" />
        <button className="btn" type="submit">
          Send note
        </button>
      </form>
      {status ? <p className="notice" style={{ marginTop: 16 }}>{status}</p> : null}
    </div>
  );
}
