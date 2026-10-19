import { beforeEach, describe, expect, it, vi } from "vitest";
import { freshEnv } from "./helpers";
import type { Order } from "@/lib/db";

const refundsCreate = vi.fn(async () => ({ id: "re_1" }));
vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({ refunds: { create: refundsCreate }, subscriptions: { cancel: vi.fn(async () => ({})) } }),
}));

const { planRefund, requestRefund } = await import("@/lib/refunds");
const { createOrderOnce, getOrder } = await import("@/lib/db");

const order = (overrides: Partial<Order> = {}): Order => ({
  id: "cs_1",
  mode: "live",
  email: "buyer@example.com",
  slug: "business-kit",
  amountCents: 2900,
  currency: "usd",
  paymentIntentId: "pi_1",
  subscriptionId: null,
  status: "paid",
  createdAt: new Date().toISOString(),
  emailedLink: true,
  ...overrides,
});

const policy = { capCents: 2900, windowDays: 14, killSwitch: false };

describe("refund policy", () => {
  it("auto-refunds at or under the cap", () => {
    expect(planRefund(order({ amountCents: 900 }), "buyer@example.com", policy)).toEqual({ kind: "auto", amountCents: 900 });
    expect(planRefund(order({ amountCents: 2900 }), "BUYER@example.com", policy).kind).toBe("auto");
  });

  it("holds anything over the cap for the owner", () => {
    expect(planRefund(order({ amountCents: 2901 }), "buyer@example.com", policy).kind).toBe("hold");
  });

  it("holds requests outside the window and while the kill switch is on", () => {
    const old = new Date(Date.now() - 15 * 86_400_000).toISOString();
    expect(planRefund(order({ createdAt: old }), "buyer@example.com", policy).kind).toBe("hold");
    expect(planRefund(order(), "buyer@example.com", { ...policy, killSwitch: true }).kind).toBe("hold");
  });

  it("rejects a wrong email, a missing order, or a repeat refund", () => {
    expect(planRefund(order(), "other@example.com", policy).kind).toBe("reject");
    expect(planRefund(null, "buyer@example.com", policy).kind).toBe("reject");
    expect(planRefund(order({ status: "refunded" }), "buyer@example.com", policy).kind).toBe("reject");
  });
});

describe("refund execution", () => {
  beforeEach(() => {
    freshEnv({ STRIPE_SECRET_KEY: "sk_test_dummy" });
    refundsCreate.mockClear();
  });

  it("refunds a $29 order through Stripe with an idempotency key", async () => {
    await createOrderOnce(order());
    const outcome = await requestRefund({ orderId: "cs_1", email: "buyer@example.com", reason: "not for me" });
    expect(outcome).toEqual({ kind: "refunded", refundId: "re_1", amountCents: 2900 });
    expect(refundsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ payment_intent: "pi_1" }),
      { idempotencyKey: "refund-cs_1" }
    );
    expect((await getOrder("cs_1"))?.status).toBe("refunded");
  });

  it("holds a $49 order and never calls Stripe", async () => {
    await createOrderOnce(order({ amountCents: 4900 }));
    const outcome = await requestRefund({ orderId: "cs_1", email: "buyer@example.com", reason: "changed mind" });
    expect(outcome.kind).toBe("held");
    expect(refundsCreate).not.toHaveBeenCalled();
    expect((await getOrder("cs_1"))?.status).toBe("refund_held");
  });

  it("respects a custom REFUND_AUTO_CAP", async () => {
    freshEnv({ STRIPE_SECRET_KEY: "sk_test_dummy", REFUND_AUTO_CAP: "10" });
    await createOrderOnce(order({ amountCents: 1900 }));
    expect((await requestRefund({ orderId: "cs_1", email: "buyer@example.com", reason: "x" })).kind).toBe("held");
  });
});
