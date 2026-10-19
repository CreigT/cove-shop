import { describe, expect, it } from "vitest";
import { clampPrice, nextPrice, planPrices } from "@/lib/agents/pricing";
import { seedCatalog, type Product } from "@/lib/products";
import type { Order } from "@/lib/db";

const guard = { minCents: 500, maxCents: 4900, stepPct: 10 };
const now = Date.parse("2026-10-18T12:00:00Z");
const product = (priceCents: number, priceSince = "2026-01-01T00:00:00Z"): Product => ({
  ...seedCatalog[0],
  priceCents,
  priceSince,
});
const sale = (slug: string, daysAgo: number): Order => ({
  id: `cs_${Math.random()}`, mode: "live", email: "a@b.co", slug, amountCents: 900, currency: "usd",
  paymentIntentId: null, subscriptionId: null, status: "paid", emailedLink: true,
  createdAt: new Date(now - daysAgo * 86_400_000).toISOString(),
});

describe("pricing guardrails", () => {
  it("clamps any price into the band", () => {
    expect(clampPrice(100, guard)).toBe(500);
    expect(clampPrice(99_999, guard)).toBe(4900);
    expect(clampPrice(1234, guard)).toBe(1234);
  });

  it("raises by at most one step on strong demand and never above max", () => {
    const up = nextPrice(product(2900), 6, guard, now)!;
    expect(up.toCents).toBeGreaterThan(2900);
    expect(up.toCents).toBeLessThanOrEqual(Math.round(2900 * 1.1));
    expect(up.toCents).toBe(3099);
    expect(nextPrice(product(4900), 50, guard, now)).toBeNull();
  });

  it("lowers stale products by one step and never below min", () => {
    const down = nextPrice(product(900), 0, guard, now)!;
    expect(down.toCents).toBeLessThan(900);
    expect(down.toCents).toBeGreaterThanOrEqual(Math.round(900 * 0.9));
    expect(nextPrice(product(2900), 0, guard, now)!.toCents).toBe(2699);
    expect(nextPrice(product(500), 0, guard, now)).toBeNull();
  });

  it("leaves recently repriced or moderately selling products alone", () => {
    expect(nextPrice(product(900, "2026-10-15T00:00:00Z"), 0, guard, now)).toBeNull();
    expect(nextPrice(product(900), 2, guard, now)).toBeNull();
  });

  it("only counts paid sales from the last 7 days and skips subscriptions", () => {
    const orders = [...Array(5)].map(() => sale("starter-pack", 2)).concat([...Array(9)].map(() => sale("business-kit", 20)));
    const changes = planPrices(seedCatalog, orders, guard, now);
    expect(changes.find((c) => c.slug === "starter-pack")?.toCents).toBeGreaterThan(900);
    expect(changes.find((c) => c.slug === "business-kit")?.toCents).toBeLessThan(2900);
    expect(changes.some((c) => c.slug === "member-pass")).toBe(false);
    for (const c of changes) {
      expect(c.toCents).toBeGreaterThanOrEqual(guard.minCents);
      expect(c.toCents).toBeLessThanOrEqual(guard.maxCents);
    }
  });
});
