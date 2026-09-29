import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { encodeAccess, slugsForPurchase, ACCESS_COOKIE } from "@/lib/access";
import { store } from "@/lib/config";
import { logEvent } from "@/lib/events";

export async function POST(request: Request) {
  const { sessionId } = (await request.json()) as { sessionId?: string };
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session." }, { status: 400 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid" && session.status !== "complete") {
    return NextResponse.json({ error: "Payment not complete." }, { status: 402 });
  }

  const email = session.customer_email || session.metadata?.email || "buyer@unknown";
  const slug = session.metadata?.slug || "starter-pack";
  const token = encodeAccess({
    email,
    slugs: slugsForPurchase(slug),
    exp: Date.now() + 1000 * 60 * 60 * 24 * 365,
  });

  logEvent("claim", `${email} unlocked ${slug}`);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCESS_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: store.url.startsWith("https"),
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
