import { timingSafeEqual } from "crypto";

export const store = {
  name: process.env.NEXT_PUBLIC_STORE_NAME || "Cove",
  tagline:
    process.env.NEXT_PUBLIC_STORE_TAGLINE ||
    "A calm digital shop. Agents keep the lights on.",
  url:
    process.env.NEXT_PUBLIC_STORE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
  support: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@example.com",
  owner: process.env.NEXT_PUBLIC_OWNER_NAME || "CREIGNIFICENT LLC",
  secret: process.env.STORE_SECRET || "dev-only-change-me",
};

export const SPONSOR = "Sponsored by CREIGNIFICENT LLC";

export function isDemoMode() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "false") return false;
  return !process.env.STRIPE_SECRET_KEY;
}

function num(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && process.env[name] !== "" && process.env[name] !== undefined
    ? value
    : fallback;
}

function flag(name: string) {
  return ["1", "true", "on", "yes"].includes((process.env[name] || "").toLowerCase());
}

export function guardrails() {
  return {
    killSwitch: flag("KILL_SWITCH"),
    refundAutoCapCents: Math.round(num("REFUND_AUTO_CAP", 29) * 100),
    refundWindowDays: num("REFUND_WINDOW_DAYS", 14),
    priceMinCents: Math.round(num("PRICE_MIN", 5) * 100),
    priceMaxCents: Math.round(num("PRICE_MAX", 49) * 100),
    priceStepPct: num("PRICE_STEP_PCT", 10),
    aiDailyCallCap: num("AI_DAILY_CALL_CAP", 200),
    aiDailyTokenCap: num("AI_DAILY_TOKEN_CAP", 200_000),
    maxAgentProducts: num("MAX_AGENT_PRODUCTS", 12),
    autopublish: process.env.AGENT_AUTOPUBLISH !== "false",
    downloadTtlHours: num("DOWNLOAD_LINK_TTL_HOURS", 72),
    ticketsPerHourPerIp: num("TICKET_RATE_LIMIT", 6),
  };
}

export function safeEqual(a: string | null | undefined, b: string | null | undefined) {
  if (!a || !b) return false;
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function bearer(request: Request) {
  const header = request.headers.get("authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

export function today(at = new Date()) {
  return at.toISOString().slice(0, 10);
}

export function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!domain) return "someone";
  return `${user.slice(0, 1)}***@${domain}`;
}
