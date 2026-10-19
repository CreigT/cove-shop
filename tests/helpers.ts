import { resetMemoryKv } from "@/lib/kv";

const KEYS = [
  "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "RESEND_API_KEY", "AI_API_KEY", "KILL_SWITCH",
  "CRON_SECRET", "ADMIN_TOKEN", "OWNER_EMAIL", "REFUND_AUTO_CAP", "KV_REST_API_URL",
  "KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "NEXT_PUBLIC_DEMO_MODE",
  "MARKETING_WEBHOOK_URL", "PRICE_MIN", "PRICE_MAX",
];

export function freshEnv(env: Record<string, string> = {}) {
  for (const key of KEYS) delete process.env[key];
  Object.assign(process.env, env);
  resetMemoryKv();
}
