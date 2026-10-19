import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Stripe from "stripe";
import { freshEnv } from "./helpers";
import { POST } from "@/app/api/webhook/route";
import { GET as download } from "@/app/api/download/route";
import { getOrder, recentOrders } from "@/lib/db";
import { listEvents } from "@/lib/events";

const SECRET = "whsec_test_secret";
const stripe = new Stripe("sk_test_dummy");

function signedRequest(event: object, secret = SECRET) {
  const payload = JSON.stringify(event);
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret });
  return new Request("http://localhost/api/webhook", {
    method: "POST",
    headers: { "stripe-signature": header, "content-type": "application/json" },
    body: payload,
  });
}

const completed = (overrides: object = {}) => ({
  id: "evt_1",
  object: "event",
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_test_123",
      object: "checkout.session",
      payment_status: "paid",
      amount_total: 900,
      currency: "usd",
      payment_intent: "pi_123",
      subscription: null,
      invoice: null,
      created: Math.floor(Date.now() / 1000),
      customer_email: "buyer@example.com",
      customer_details: { email: "buyer@example.com" },
      metadata: { slug: "starter-pack", email: "buyer@example.com" },
      ...overrides,
    },
  },
});

describe("stripe webhook", () => {
  beforeEach(() => freshEnv({ STRIPE_WEBHOOK_SECRET: SECRET }));
  afterEach(() => vi.unstubAllGlobals());

  it("acknowledges without verifying when no webhook secret is configured", async () => {
    freshEnv();
    const res = await POST(new Request("http://localhost/api/webhook", { method: "POST", body: "{}" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true, demo: true });
  });

  it("rejects a missing or forged signature", async () => {
    const unsigned = await POST(new Request("http://localhost/api/webhook", { method: "POST", body: "{}" }));
    expect(unsigned.status).toBe(400);
    const forged = await POST(signedRequest(completed(), "whsec_wrong"));
    expect(forged.status).toBe(400);
    expect(await recentOrders()).toHaveLength(0);
  });

  it("rejects a body altered after signing", async () => {
    const req = signedRequest(completed());
    const tampered = new Request(req.url, {
      method: "POST",
      headers: req.headers,
      body: JSON.stringify(completed({ amount_total: 1 })),
    });
    expect((await POST(tampered)).status).toBe(400);
  });

  it("records the order once and skips email cleanly when Resend is not configured", async () => {
    expect((await POST(signedRequest(completed()))).status).toBe(200);
    expect((await POST(signedRequest(completed()))).status).toBe(200);
    const orders = await recentOrders();
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({ id: "cs_test_123", amountCents: 900, paymentIntentId: "pi_123", status: "paid", emailedLink: false });
    expect((await listEvents()).some((e) => e.kind === "email-skipped")).toBe(true);
  });

  it("emails a signed download link that unlocks the library", async () => {
    freshEnv({ STRIPE_WEBHOOK_SECRET: SECRET, RESEND_API_KEY: "re_test" });
    const sent: { to: string[]; text: string }[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init: RequestInit) => {
      sent.push(JSON.parse(String(init.body)));
      return new Response(JSON.stringify({ id: "email_1" }), { status: 200 });
    }));

    await POST(signedRequest(completed()));
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toEqual(["buyer@example.com"]);
    expect(sent[0].text).toContain("Sponsored by CREIGNIFICENT LLC");
    const link = sent[0].text.match(/(http\S+\/api\/download\?token=\S+)/)?.[1];
    expect(link).toBeTruthy();
    expect((await getOrder("cs_test_123"))?.emailedLink).toBe(true);

    const res = await download(new Request(link!.replace(/^https?:\/\/[^/]+/, "http://localhost")));
    expect(res.status).toBe(307);
    expect(res.headers.get("set-cookie")).toContain("cove_access=");
    const file = await download(new Request(link!.replace(/^https?:\/\/[^/]+/, "http://localhost") + "&file=1"));
    expect(file.status).toBe(200);
    expect(await file.text()).toContain("Starter Pack");

    await POST(signedRequest(completed()));
    expect(sent).toHaveLength(1);
  });

  it("does not fulfill an unpaid session", async () => {
    await POST(signedRequest(completed({ payment_status: "unpaid" })));
    expect(await recentOrders()).toHaveLength(0);
  });

  it("marks the order refunded on charge.refunded and closes its download link", async () => {
    await POST(signedRequest(completed()));
    await POST(signedRequest({
      id: "evt_2",
      object: "event",
      type: "charge.refunded",
      data: { object: { id: "ch_1", object: "charge", payment_intent: "pi_123", refunded: true } },
    }));
    expect((await getOrder("cs_test_123"))?.status).toBe("refunded");
  });

  it("rejects a tampered or expired download token", async () => {
    const res = await download(new Request("http://localhost/api/download?token=abc.def"));
    expect(res.status).toBe(410);
  });
});
