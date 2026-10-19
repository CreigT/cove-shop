import type { Order } from "../db";
import type { Product } from "../products";

export type PriceGuard = { minCents: number; maxCents: number; stepPct: number };

export type PriceChange = { slug: string; fromCents: number; toCents: number; reason: string };

const DAY = 86_400_000;

export function clampPrice(cents: number, guard: PriceGuard) {
  return Math.min(guard.maxCents, Math.max(guard.minCents, Math.round(cents)));
}

function charmWithinStep(current: number, target: number) {
  if (target > current) {
    const charm = Math.floor(target / 100) * 100 - 1;
    return charm > current ? charm : Math.round(target);
  }
  const charm = Math.ceil(target / 100) * 100 - 1;
  return charm < current - 50 ? charm : Math.round(target);
}

export function nextPrice(
  product: Product,
  salesLast7d: number,
  guard: PriceGuard,
  now = Date.now()
): PriceChange | null {
  const step = guard.stepPct / 100;
  const ageDays = (now - Date.parse(product.priceSince)) / DAY;
  let target = product.priceCents;
  let reason = "";
  if (salesLast7d >= 5) {
    target = product.priceCents * (1 + step);
    reason = `${salesLast7d} sales in 7 days, demand is strong`;
  } else if (salesLast7d === 0 && ageDays >= 7) {
    target = product.priceCents * (1 - step);
    reason = "no sales in 7 days at this price";
  }
  const bounded = clampPrice(reason ? charmWithinStep(product.priceCents, target) : target, guard);
  if (bounded === product.priceCents) return null;
  return {
    slug: product.slug,
    fromCents: product.priceCents,
    toCents: bounded,
    reason: reason || "moved inside the price band",
  };
}

export function planPrices(catalog: Product[], orders: Order[], guard: PriceGuard, now = Date.now()) {
  const recent = orders.filter((o) => o.status === "paid" && now - Date.parse(o.createdAt) <= 7 * DAY);
  return catalog
    .filter((p) => p.interval === "one_time")
    .map((p) => nextPrice(p, recent.filter((o) => o.slug === p.slug).length, guard, now))
    .filter((change): change is PriceChange => change !== null);
}
