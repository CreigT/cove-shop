import { bearer, safeEqual } from "./config";

export type AuthResult = { ok: true } | { ok: false; status: 401 | 503; error: string };

export function checkSecret(provided: string | null, envName: "CRON_SECRET" | "ADMIN_TOKEN"): AuthResult {
  const expected = process.env[envName];
  if (!expected) return { ok: false, status: 503, error: `${envName} is not set.` };
  return safeEqual(provided, expected) ? { ok: true } : { ok: false, status: 401, error: "Unauthorized." };
}

export const cronAuth = (request: Request) => checkSecret(bearer(request), "CRON_SECRET");
export const adminAuth = (request: Request) => checkSecret(bearer(request), "ADMIN_TOKEN");
