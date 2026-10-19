import { getKv } from "./kv";
import { libraryItems, type LibraryItem } from "./library";

export type Product = {
  slug: string;
  name: string;
  priceCents: number;
  interval: "one_time" | "month";
  blurb: string;
  description: string;
  includes: string[];
  badge?: string;
  popular?: boolean;
  stripePriceEnv?: string;
  origin: "seed" | "agent";
  status: "live" | "draft";
  createdAt: string;
  priceSince: string;
  items: LibraryItem[];
};

type SeedProduct = Omit<Product, "origin" | "status" | "createdAt" | "priceSince" | "items">;

const SEED_CREATED = "2026-01-01T00:00:00.000Z";

const seedProducts: SeedProduct[] = [
  {
    slug: "starter-pack",
    name: "Starter Pack",
    priceCents: 900,
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
    priceCents: 2900,
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
    priceCents: 1900,
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
    priceCents: 900,
    interval: "one_time",
    badge: "Same-day reply",
    blurb: "A human-readable queue bump when you need help.",
    description:
      "One payment. Your next help or refund note is marked priority. Refunds still follow the normal refund rules.",
    includes: [
      "Priority place in the help queue",
      "Same-day written reply on business days",
      "Refund request reviewed within 24 hours",
      "Never auto-charges extras",
    ],
    stripePriceEnv: "STRIPE_PRICE_CARE",
  },
];

export const seedCatalog: Product[] = seedProducts.map((product) => ({
  ...product,
  origin: "seed",
  status: "live",
  createdAt: SEED_CREATED,
  priceSince: SEED_CREATED,
  items: libraryItems[product.slug] || [],
}));

const PRICES_KEY = "catalog:prices";
const LAUNCHED_KEY = "catalog:launched-at";

type PriceOverride = { cents: number; since: string };
const AGENT_PRODUCTS_KEY = "catalog:agent-products";

export async function getCatalog(options: { includeDrafts?: boolean } = {}) {
  const kv = getKv();
  const [prices, agentProducts, launchedAt] = await Promise.all([
    kv.get<Record<string, PriceOverride>>(PRICES_KEY),
    kv.get<Product[]>(AGENT_PRODUCTS_KEY),
    kv.get<string>(LAUNCHED_KEY),
  ]);
  const all = [...seedCatalog, ...(agentProducts || [])].map((product) => {
    const override = prices?.[product.slug];
    const baseline = [product.createdAt, launchedAt || product.createdAt].sort().pop()!;
    return {
      ...product,
      priceCents: override?.cents ?? product.priceCents,
      priceSince: override?.since ?? baseline,
    };
  });
  return options.includeDrafts ? all : all.filter((p) => p.status === "live");
}

export async function getProduct(slug: string, options: { includeDrafts?: boolean } = {}) {
  return (await getCatalog(options)).find((p) => p.slug === slug);
}

export async function markLaunched() {
  await getKv().set(LAUNCHED_KEY, new Date().toISOString(), { nx: true });
}

export async function setPrices(next: Record<string, number>) {
  const kv = getKv();
  const since = new Date().toISOString();
  const current = (await kv.get<Record<string, PriceOverride>>(PRICES_KEY)) || {};
  const updates = Object.fromEntries(Object.entries(next).map(([slug, cents]) => [slug, { cents, since }]));
  await kv.set(PRICES_KEY, { ...current, ...updates });
}

export async function addAgentProduct(product: Product) {
  const kv = getKv();
  const current = (await kv.get<Product[]>(AGENT_PRODUCTS_KEY)) || [];
  if (current.some((p) => p.slug === product.slug)) return false;
  await kv.set(AGENT_PRODUCTS_KEY, [...current, product]);
  return true;
}

export function dollars(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function formatPrice(product: Product) {
  const price = dollars(product.priceCents);
  return product.interval === "month" ? `${price}/mo` : price;
}

export function shopProducts(catalog: Product[]) {
  return catalog.filter((p) => p.slug !== "care-pass");
}
