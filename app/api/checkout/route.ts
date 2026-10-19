import { NextResponse } from "next/server";
import { getCatalog, seedCatalog } from "@/lib/products";
import { getStripe } from "@/lib/stripe";
import { store, isDemoMode, guardrails, maskEmail } from "@/lib/config";
import { encodeAccess, slugsForPurchase, accessCookie, ACCESS_MAX_AGE } from "@/lib/access";
import { logEvent } from "@/lib/events";
import { fulfillOrder } from "@/lib/fulfillment";
import { newId } from "@/lib/db";

export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const { slug, email } = (await request.json().catch(() => ({}))) as {
    slug?: string;
    email?: string;
  };
  if (!slug || !email || !EMAIL.test(email)) {
    return NextResponse.json({ error: "A valid email and product are required." }, { status: 400 });
  }

  const catalog = await getCatalog();
  const product = catalog.find((p) => p.slug === slug);
  if (!product) {
    return NextResponse.json({ error: "Unknown product." }, { status: 404 });
  }
  if (product.priceCents > guardrails().priceMaxCents) {
    await logEvent("price-cap", `${slug} is above PRICE_MAX, checkout blocked`);
    return NextResponse.json({ error: "This item is paused for review." }, { status: 403 });
  }

  await logEvent("checkout", `${maskEmail(email)} started ${slug}`);

  if (isDemoMode()) {
    const orderId = newId("demo");
    await fulfillOrder({
      id: orderId,
      mode: "demo",
      email,
      slug,
      amountCents: product.priceCents,
      currency: "usd",
      paymentIntentId: null,
      subscriptionId: null,
      status: "paid",
      createdAt: new Date().toISOString(),
      emailedLink: false,
    });
    const token = encodeAccess({
      email,
      slugs: slugsForPurchase(slug, catalog.map((p) => p.slug)),
      exp: Date.now() + ACCESS_MAX_AGE * 1000,
    });
    const url = new URL("/success", store.url);
    url.searchParams.set("demo", "1");
    url.searchParams.set("slug", slug);
    url.searchParams.set("order", orderId);
    const response = NextResponse.json({ url: url.toString() });
    response.cookies.set(accessCookie(token));
    return response;
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
  }

  const seed = seedCatalog.find((p) => p.slug === slug);
  const configuredPrice =
    product.stripePriceEnv && seed?.priceCents === product.priceCents
      ? process.env[product.stripePriceEnv]
      : undefined;

  const session = await stripe.checkout.sessions.create({
    mode: product.interval === "month" ? "subscription" : "payment",
    customer_email: email,
    success_url: `${store.url}/success?session_id={CHECKOUT_SESSION_ID}&slug=${slug}`,
    cancel_url: `${store.url}/product/${product.slug}`,
    metadata: { slug, email },
    line_items: configuredPrice
      ? [{ price: configuredPrice, quantity: 1 }]
      : [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: product.priceCents,
              recurring: product.interval === "month" ? { interval: "month" } : undefined,
              product_data: { name: `${store.name} ${product.name}` },
            },
          },
        ],
  });

  return NextResponse.json({ url: session.url });
}
