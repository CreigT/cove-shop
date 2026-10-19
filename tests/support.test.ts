import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { freshEnv } from "./helpers";
import { POST as ticket } from "@/app/api/ticket/route";
import { createOrderOnce, recentTickets } from "@/lib/db";

const send = (body: object, ip = "1.1.1.1") =>
  ticket(new Request("http://localhost/api/ticket", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  }));

describe("support ticket agent", () => {
  beforeEach(() => freshEnv());

  it("answers with rules when no AI key is set", async () => {
    const res = await send({ email: "a@b.co", topic: "delivery", message: "where is my download link?" });
    const data = await res.json();
    expect(data.answeredBy).toBe("rules");
    expect(data.reply).toMatch(/library/);
    expect(await recentTickets()).toHaveLength(1);
  });

  it("auto-refunds a small demo order from a ticket with an order ID", async () => {
    await createOrderOnce({
      id: "demo_1", mode: "demo", email: "a@b.co", slug: "starter-pack", amountCents: 900, currency: "usd",
      paymentIntentId: null, subscriptionId: null, status: "paid", createdAt: new Date().toISOString(), emailedLink: false,
    });
    const data = await (await send({ email: "a@b.co", topic: "refund", message: "please refund", orderId: "demo_1" })).json();
    expect(data.refund.kind).toBe("refunded");
    expect(data.reply).toMatch(/refund of \$9 is done/);
  });

  it("rate-limits one IP", async () => {
    let last = 200;
    for (let i = 0; i < 8; i++) last = (await send({ email: "a@b.co", message: "hi" }, "9.9.9.9")).status;
    expect(last).toBe(429);
  });
});

describe("AI path", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("uses the configured OpenAI-compatible endpoint and returns the AI reply", async () => {
    freshEnv({ AI_API_KEY: "gsk_test", AI_BASE_URL: "https://api.groq.com/openai/v1", AI_MODEL: "llama-3.1-8b-instant" });
    const urls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
      urls.push(url);
      expect(JSON.parse(String(init.body)).model).toBe("llama-3.1-8b-instant");
      return new Response(JSON.stringify({ choices: [{ message: { content: "Here is your link." } }], usage: { total_tokens: 50 } }));
    }));
    const data = await (await send({ email: "a@b.co", topic: "delivery", message: "link?" })).json();
    expect(urls[0]).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(data).toMatchObject({ answeredBy: "ai", reply: "Here is your link." });
  });

  it("falls back to rules when the AI call fails", async () => {
    freshEnv({ AI_API_KEY: "sk_test" });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("boom", { status: 500 })));
    const data = await (await send({ email: "a@b.co", topic: "billing", message: "charged twice" })).json();
    expect(data.answeredBy).toBe("rules");
  });
});
