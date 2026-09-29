export type Product = {
  slug: string;
  name: string;
  price: number;
  interval: "one_time" | "month";
  blurb: string;
  description: string;
  includes: string[];
  badge?: string;
  popular?: boolean;
  stripePriceEnv?: string;
};

export const products: Product[] = [
  {
    slug: "starter-pack",
    name: "Starter Pack",
    price: 9,
    interval: "one_time",
    badge: "Start here",
    blurb: "A small kit you can use today.",
    description:
      "Twenty prompts, a pricing sheet, and a one-page launch list. One payment. No subscription.",
    includes: [
      "20 product and landing-page prompts",
      "Simple pricing worksheet",
      "One-page launch checklist",
      "Lifetime access to this pack",
    ],
    stripePriceEnv: "STRIPE_PRICE_STARTER",
  },
  {
    slug: "business-kit",
    name: "Business Kit",
    price: 29,
    interval: "one_time",
    badge: "Best value",
    popular: true,
    blurb: "Pages, emails, and a paywall you can copy.",
    description:
      "Everything in the Starter Pack, plus copy you can paste into a live store this week.",
    includes: [
      "Everything in the Starter Pack",
      "Landing page copy blocks",
      "Launch and refund email scripts",
      "Paywall and pricing guide",
      "Daily agent task list",
    ],
    stripePriceEnv: "STRIPE_PRICE_KIT",
  },
  {
    slug: "member-pass",
    name: "Member Pass",
    price: 19,
    interval: "month",
    badge: "Cancel anytime",
    blurb: "New drops and a short agent report each month.",
    description:
      "A quiet membership. New ideas, updated prompts, and a one-page report. Cancel from your receipt.",
    includes: [
      "Everything in the Business Kit",
      "Monthly product idea drop",
      "Updated prompt library",
      "Short operations report",
      "Member library updates",
    ],
    stripePriceEnv: "STRIPE_PRICE_MEMBER",
  },
  {
    slug: "care-pass",
    name: "Priority Care",
    price: 9,
    interval: "one_time",
    badge: "Same-day reply",
    blurb: "A human-readable queue bump when you need help.",
    description:
      "One payment. Your next help or refund note is marked priority. Agents still cannot move money without the owner.",
    includes: [
      "Priority place in the help queue",
      "Same-day written reply on business days",
      "Refund request reviewed within 24 hours",
      "Does not auto-refund or auto-charge extras",
    ],
    stripePriceEnv: "STRIPE_PRICE_CARE",
  },
];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function formatPrice(product: Product) {
  const dollars = `$${product.price}`;
  return product.interval === "month" ? `${dollars}/mo` : dollars;
}

export function shopProducts() {
  return products.filter((p) => p.slug !== "care-pass");
}
