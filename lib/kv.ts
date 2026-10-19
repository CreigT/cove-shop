type SetOptions = { ex?: number; nx?: boolean };

export type Kv = {
  kind: "redis" | "memory";
  get<T>(key: string): Promise<T | null>;
  mget<T>(keys: string[]): Promise<(T | null)[]>;
  set(key: string, value: unknown, options?: SetOptions): Promise<boolean>;
  push(key: string, value: unknown, max: number): Promise<void>;
  range<T>(key: string, count: number): Promise<T[]>;
  incr(key: string, by: number, ttlSeconds: number): Promise<number>;
};

function redisConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

function parse<T>(raw: unknown): T | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "string") return raw as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as unknown as T;
  }
}

function redisKv(url: string, token: string): Kv {
  async function command<T>(...args: (string | number)[]): Promise<T> {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(args),
      cache: "no-store",
    });
    const data = (await res.json()) as { result?: T; error?: string };
    if (!res.ok || data.error) throw new Error(`redis ${args[0]}: ${data.error || res.status}`);
    return data.result as T;
  }

  return {
    kind: "redis",
    async get(key) {
      return parse(await command<string | null>("GET", key));
    },
    async mget(keys) {
      if (!keys.length) return [];
      const rows = await command<(string | null)[]>("MGET", ...keys);
      return rows.map((row) => parse(row));
    },
    async set(key, value, options = {}) {
      const args: (string | number)[] = ["SET", key, JSON.stringify(value)];
      if (options.nx) args.push("NX");
      if (options.ex) args.push("EX", options.ex);
      return (await command<string | null>(...args)) === "OK";
    },
    async push(key, value, max) {
      await command("LPUSH", key, JSON.stringify(value));
      await command("LTRIM", key, 0, max - 1);
    },
    async range(key, count) {
      const rows = await command<string[]>("LRANGE", key, 0, count - 1);
      return rows.map((row) => parse(row)).filter((row) => row !== null) as never[];
    },
    async incr(key, by, ttlSeconds) {
      const value = await command<number>("INCRBY", key, by);
      if (value === by) await command("EXPIRE", key, ttlSeconds);
      return value;
    },
  };
}

type MemoryState = {
  values: Map<string, { value: unknown; expires: number }>;
  lists: Map<string, unknown[]>;
};

const globalMemory = globalThis as unknown as { __coveMemory?: MemoryState };

function memoryState(): MemoryState {
  if (!globalMemory.__coveMemory) {
    globalMemory.__coveMemory = { values: new Map(), lists: new Map() };
  }
  return globalMemory.__coveMemory;
}

export function resetMemoryKv() {
  globalMemory.__coveMemory = undefined;
}

function memoryKv(): Kv {
  const read = (key: string) => {
    const hit = memoryState().values.get(key);
    if (!hit) return null;
    if (hit.expires && hit.expires < Date.now()) {
      memoryState().values.delete(key);
      return null;
    }
    return hit.value;
  };
  const clone = <T>(value: unknown) =>
    value === null ? null : (JSON.parse(JSON.stringify(value)) as T);

  return {
    kind: "memory",
    async get(key) {
      return clone(read(key));
    },
    async mget(keys) {
      return keys.map((key) => clone(read(key)));
    },
    async set(key, value, options = {}) {
      if (options.nx && read(key) !== null) return false;
      memoryState().values.set(key, {
        value: clone(value),
        expires: options.ex ? Date.now() + options.ex * 1000 : 0,
      });
      return true;
    },
    async push(key, value, max) {
      const list = memoryState().lists.get(key) || [];
      list.unshift(clone(value));
      memoryState().lists.set(key, list.slice(0, max));
    },
    async range(key, count) {
      return (memoryState().lists.get(key) || []).slice(0, count).map((v) => clone(v)) as never[];
    },
    async incr(key, by, ttlSeconds) {
      const next = Number(read(key) || 0) + by;
      const existing = memoryState().values.get(key);
      memoryState().values.set(key, {
        value: next,
        expires: existing?.expires || Date.now() + ttlSeconds * 1000,
      });
      return next;
    },
  };
}

export function getKv(): Kv {
  const config = redisConfig();
  return config ? redisKv(config.url, config.token) : memoryKv();
}
