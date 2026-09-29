import { NextResponse } from "next/server";
import { logEvent } from "@/lib/events";

type Review = { name: string; stars: number; text: string; at: string };

const reviews: Review[] = [
  {
    name: "Maya",
    stars: 5,
    text: "Paid $9, opened the library on the same page. That is all I wanted.",
    at: new Date().toISOString(),
  },
  {
    name: "Chris",
    stars: 4,
    text: "The $29 kit is enough to launch. I did not need a $499 course.",
    at: new Date().toISOString(),
  },
];

export async function GET() {
  return NextResponse.json({ reviews });
}

export async function POST(request: Request) {
  const { name, stars, text } = (await request.json()) as {
    name?: string;
    stars?: number;
    text?: string;
  };
  if (!name || !text) {
    return NextResponse.json({ error: "Name and note are required." }, { status: 400 });
  }
  const review: Review = {
    name: String(name).slice(0, 40),
    stars: Math.min(5, Math.max(1, Number(stars) || 5)),
    text: String(text).slice(0, 280),
    at: new Date().toISOString(),
  };
  reviews.unshift(review);
  logEvent("review", `${review.name} left ${review.stars} stars`);
  return NextResponse.json({ ok: true, reviews });
}
