import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { logEvent } from "@/lib/events";

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ received: true, demo: true });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "No signature." }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(body, signature, secret);
    logEvent("stripe", event.type);
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }
}
