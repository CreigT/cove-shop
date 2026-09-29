import { NextResponse } from "next/server";
import { getProduct } from "@/lib/products";
import { getStripe } from "@/lib/stripe";
import { store, isDemoMode } from "@/lib/config";
import { encodeAccess, slugsForPurchase, ACCESS_COOKIE } from "@/lib/access";
import { logEvent } from "@/lib/events";

export async function POST(request: Request) {
  const { slug, email } = (await request.json()) as {
    slug?: string;
    email?: string;
  };
  if (!slug || !email) {
    return NextResponse.json(
      { error: "Email and product are required." },
      { status: 400 }
    );
  }

  const product = getProduct(slug);
  if (!product) {
    return NextResponse.json({ error: "Unknown product." }, { status: 404 });
  }

  logEvent("checkout", `${email} started ${slug}`);

  if (isDemoMode()) {
    const token = encodeAccess({
      email,
      slugs: slugsForPurchase(slug),
      exp: Date.now() + 1000 * 60 * 60 * 24 * 365,
    });
    const url = new URL("/success", store.url);
    url.searchParams.set("demo", "1");
    url.searchParams.set("slug", slug);
    const response = NextResponse.json({ url: url.toString() });
    response.cookies.set(ACCESS_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: store.url.startsWith("https"),
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
  }

  const configuredPrice = product.stripePriceEnv
    ? process.env[product.stripePriceEnv]
    : undefined;

  const session = await stripe.checkout.sessions.create({
    mode: product.interval === "month" ? "subscription" : "payment",
    customer_email: email,
    success_url: `${store.url}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${store.url}/product/${product.slug}`,
    metadata: { slug, email },
    line_items: configuredPrice
      ? [{ price: configuredPrice, quantity: 1 }]
      : [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: product.price * 100,
              recurring:
                product.interval === "month" ? { interval: "month" } : undefined,
              product_data: { name: `${store.name} ${product.name}` },
            },
          },
        ],
  });

  return NextResponse.json({ url: session.url });
}
