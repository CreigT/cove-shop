import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, webhookVerifier } from "@/lib/stripe";
import { logEvent } from "@/lib/events";
import { maskEmail } from "@/lib/config";
import { findOrderByPaymentIntent, saveOrder, type Order } from "@/lib/db";
import { fulfillOrder } from "@/lib/fulfillment";

export const dynamic = "force-dynamic";

const idOf = (value: string | { id: string } | null | undefined) =>
  typeof value === "string" ? value : value?.id || null;

async function paymentIntentFor(session: Stripe.Checkout.Session) {
  const direct = idOf(session.payment_intent);
  if (direct) return direct;
  const invoiceId = idOf(session.invoice);
  const stripe = getStripe();
  if (!invoiceId || !stripe) return null;
  try {
    const invoice = await stripe.invoices.retrieve(invoiceId);
    return idOf(invoice.payment_intent as string | { id: string } | null);
  } catch {
    return null;
  }
}

async function onCheckoutPaid(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    await logEvent("stripe", "checkout completed, payment still pending");
    return;
  }
  const order: Order = {
    id: session.id,
    mode: "live",
    email: session.customer_details?.email || session.customer_email || session.metadata?.email || "",
    slug: session.metadata?.slug || "starter-pack",
    amountCents: session.amount_total ?? 0,
    currency: session.currency || "usd",
    paymentIntentId: await paymentIntentFor(session),
    subscriptionId: idOf(session.subscription),
    status: "paid",
    createdAt: new Date((session.created || Date.now() / 1000) * 1000).toISOString(),
    emailedLink: false,
  };
  const result = await fulfillOrder(order);
  if (!result.created) await logEvent("stripe", "repeat webhook delivery, order already recorded");
}

async function onChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId = idOf(charge.payment_intent);
  if (!paymentIntentId || !charge.refunded) return;
  const order = await findOrderByPaymentIntent(paymentIntentId);
  if (order && order.status !== "refunded") {
    await saveOrder({ ...order, status: "refunded" });
    await logEvent("refund", `${maskEmail(order.email)} marked refunded from Stripe`);
  }
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ received: true, demo: true });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "No signature." }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = webhookVerifier().constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await onCheckoutPaid(event.data.object);
      break;
    case "charge.refunded":
      await onChargeRefunded(event.data.object);
      break;
    default:
      await logEvent("stripe", event.type);
  }
  return NextResponse.json({ received: true });
}
