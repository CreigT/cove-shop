import { afterEach, describe, expect, it, vi } from "vitest";
import { freshEnv } from "./helpers";
import { getKv } from "@/lib/kv";

describe("storage selection", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("falls back to memory with no env and honors NX", async () => {
    freshEnv();
    const kv = getKv();
    expect(kv.kind).toBe("memory");
    expect(await kv.set("k", { a: 1 }, { nx: true })).toBe(true);
    expect(await kv.set("k", { a: 2 }, { nx: true })).toBe(false);
    expect(await kv.get("k")).toEqual({ a: 1 });
  });

  it("sends Redis REST commands when Vercel KV or Upstash env is set", async () => {
    freshEnv({ UPSTASH_REDIS_REST_URL: "https://example.upstash.io", UPSTASH_REDIS_REST_TOKEN: "tok" });
    const bodies: unknown[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init: RequestInit) => {
      bodies.push(JSON.parse(String(init.body)));
      expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
      return new Response(JSON.stringify({ result: "OK" }));
    }));
    const kv = getKv();
    expect(kv.kind).toBe("redis");
    expect(await kv.set("order:1", { id: 1 }, { nx: true, ex: 60 })).toBe(true);
    expect(bodies[0]).toEqual(["SET", "order:1", '{"id":1}', "NX", "EX", 60]);
  });
});
