"use client";

import { useEffect, useState } from "react";

type Review = { name: string; stars: number; text: string; at: string };

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/review")
      .then((r) => r.json())
      .then((data) => setReviews(data.reviews || []))
      .catch(() => setReviews([]));
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        stars: Number(form.get("stars")),
        text: form.get("text"),
      }),
    });
    const data = await res.json();
    if (data.ok) {
      setReviews(data.reviews);
      setStatus("Thank you. The note is on the wall.");
      event.currentTarget.reset();
    } else {
      setStatus(data.error || "Try again.");
    }
  }

  return (
    <div className="wrap section">
      <h1>Reviews</h1>
      <p className="lede">Plain words from buyers. No star farms.</p>
      <div className="grid">
        {reviews.map((review, index) => (
          <article className="card" key={`${review.at}-${index}`}>
            <div className="badge">{"★".repeat(review.stars)}</div>
            <h3>{review.name}</h3>
            <p>{review.text}</p>
          </article>
        ))}
      </div>
      <h2 style={{ marginTop: 36 }}>Leave a short note</h2>
      <form className="stack" onSubmit={onSubmit}>
        <input name="name" required placeholder="First name" />
        <select name="stars" defaultValue="5">
          <option value="5">5 stars</option>
          <option value="4">4 stars</option>
          <option value="3">3 stars</option>
          <option value="2">2 stars</option>
          <option value="1">1 star</option>
        </select>
        <textarea name="text" required rows={4} maxLength={280} placeholder="What was useful?" />
        <button className="btn" type="submit">
          Post review
        </button>
      </form>
      {status ? <p className="notice" style={{ marginTop: 16 }}>{status}</p> : null}
    </div>
  );
}
