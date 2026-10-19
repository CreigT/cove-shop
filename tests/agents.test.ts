import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { freshEnv } from "./helpers";
import { GET } from "@/app/api/cron/[agent]/route";
import { runAgent } from "@/lib/agents";
import { recentRuns, recentPosts, recentReports } from "@/lib/db";
import { getCatalog } from "@/lib/products";
import { chat } from "@/lib/ai";

const call = (agent: string, token?: string, query = "") =>
  GET(
    new Request(`http://localhost/api/cron/${agent}${query}`, {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    }),
    { params: { agent } }
  );

describe("cron auth", () => {
  beforeEach(() => freshEnv());

  it("refuses every call when CRON_SECRET is unset", async () => {
    expect((await call("report", "anything")).status).toBe(503);
  });

  it("rejects a missing or wrong secret and accepts the right one", async () => {
    freshEnv({ CRON_SECRET: "s3cret" });
    expect((await call("report")).status).toBe(401);
    expect((await call("report", "wrong")).status).toBe(401);
    const ok = await call("report", "s3cret");
    expect(ok.status).toBe(200);
    expect((await ok.json()).status).toBe("ok");
    expect(await recentReports()).toHaveLength(1);
  });

  it("runs each agent once a day unless forced", async () => {
    freshEnv({ CRON_SECRET: "s3cret" });
    expect((await (await call("marketing", "s3cret")).json()).status).toBe("ok");
    expect((await (await call("marketing", "s3cret")).json()).summary).toMatch(/Already ran today/);
    expect((await (await call("marketing", "s3cret", "?force=1")).json()).status).toBe("ok");
    expect(await recentPosts()).toHaveLength(2);
    expect((await recentPosts())[0].post).toContain("Sponsored by CREIGNIFICENT LLC");
    expect((await recentReports())).toHaveLength(0);
  });

  it("404s an unknown agent", async () => {
    freshEnv({ CRON_SECRET: "s3cret" });
    expect((await call("nope", "s3cret")).status).toBe(404);
  });
});

describe("kill switch", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("halts every scheduled agent without side effects", async () => {
    freshEnv({ KILL_SWITCH: "true" });
    const before = await getCatalog({ includeDrafts: true });
    for (const name of ["pricing", "product", "marketing", "report"] as const) {
      const run = await runAgent(name, { force: true });
      expect(run.status).toBe("skipped");
      expect(run.summary).toMatch(/KILL_SWITCH/);
    }
    expect(await getCatalog({ includeDrafts: true })).toEqual(before);
    expect(await recentPosts()).toHaveLength(0);
    expect(await recentReports()).toHaveLength(0);
    expect(await recentRuns()).toHaveLength(4);
  });

  it("blocks AI calls even with a key", async () => {
    freshEnv({ KILL_SWITCH: "1", AI_API_KEY: "sk-test" });
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(await chat([{ role: "user", content: "hi" }])).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("agents without keys", () => {
  beforeEach(() => freshEnv());

  it("product agent publishes a fallback product inside the price band", async () => {
    const run = await runAgent("product");
    expect(run.status).toBe("ok");
    const added = (await getCatalog()).filter((p) => p.origin === "agent");
    expect(added).toHaveLength(1);
    expect(added[0].priceCents).toBeGreaterThanOrEqual(500);
    expect(added[0].priceCents).toBeLessThanOrEqual(4900);
    expect(added[0].items.length).toBeGreaterThan(0);
  });

  it("AI daily call cap stops calls after the limit", async () => {
    freshEnv({ AI_API_KEY: "sk-test", AI_DAILY_CALL_CAP: "2" });
    const fetchSpy = vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }], usage: { total_tokens: 10 } })));
    vi.stubGlobal("fetch", fetchSpy);
    expect(await chat([{ role: "user", content: "1" }])).toBe("ok");
    expect(await chat([{ role: "user", content: "2" }])).toBe("ok");
    expect(await chat([{ role: "user", content: "3" }])).toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
    delete process.env.AI_DAILY_CALL_CAP;
  });
});

describe("pricing agent on a fresh store", () => {
  beforeEach(() => freshEnv());

  it("does not cut prices on launch day, and keeps every price in the band", async () => {
    const before = (await getCatalog()).map((p) => p.priceCents);
    const run = await runAgent("pricing");
    expect(run.summary).toMatch(/No price changes/);
    expect((await getCatalog()).map((p) => p.priceCents)).toEqual(before);
  });
});

describe("product agent with AI", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("clamps an AI-proposed price into the band", async () => {
    freshEnv({ AI_API_KEY: "sk-test" });
    const draft = {
      name: "Refund Policy Pack",
      blurb: "Plain refund rules.",
      description: "Templates for refund pages.",
      includes: ["3 templates"],
      items: [{ title: "Short policy", body: "Refunds within 14 days." }],
      priceDollars: 499,
    };
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(draft) } }] }))));
    const run = await runAgent("product");
    expect(run.summary).toMatch(/Refund Policy Pack at \$49 \(ai\)/);
  });
});
