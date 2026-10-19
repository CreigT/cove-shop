import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { encodeAccess, slugsForPurchase, accessCookie, ACCESS_MAX_AGE } from "@/lib/access";
import { maskEmail } from "@/lib/config";
import { logEvent } from "@/lib/events";
import { getCatalog } from "@/lib/products";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { sessionId } = (await request.json().catch(() => ({}))) as { sessionId?: string };
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session." }, { status: 400 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId).catch(() => null);
  if (!session || session.payment_status !== "paid") {
    return NextResponse.json({ error: "Payment not complete." }, { status: 402 });
  }

  const email = session.customer_details?.email || session.customer_email || session.metadata?.email || "buyer@unknown";
  const slug = session.metadata?.slug || "starter-pack";
  const catalog = await getCatalog();
  const token = encodeAccess({
    email,
    slugs: slugsForPurchase(slug, catalog.map((p) => p.slug)),
    exp: Date.now() + ACCESS_MAX_AGE * 1000,
  });

  await logEvent("claim", `${maskEmail(email)} unlocked ${slug}`);
  const response = NextResponse.json({ ok: true, orderId: session.id });
  response.cookies.set(accessCookie(token));
  return response;
}
