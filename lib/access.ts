import { createHmac } from "crypto";
import { safeEqual, store } from "./config";

export type Entitlement = {
  slugs: string[];
  email: string;
  exp: number;
};

export type DownloadGrant = {
  orderId: string;
  email: string;
  slugs: string[];
  exp: number;
};

function sign(purpose: string, payload: string) {
  return createHmac("sha256", store.secret).update(`${purpose}:${payload}`).digest("hex");
}

function encode(purpose: string, data: object) {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${payload}.${sign(purpose, payload)}`;
}

function decode<T extends { exp: number }>(purpose: string, token?: string | null): T | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !safeEqual(sign(purpose, payload), signature)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as T;
    return data.exp < Date.now() ? null : data;
  } catch {
    return null;
  }
}

export const encodeAccess = (data: Entitlement) => encode("access", data);
export const decodeAccess = (token?: string | null) => decode<Entitlement>("access", token);
export const encodeDownload = (data: DownloadGrant) => encode("download", data);
export const decodeDownload = (token?: string | null) => decode<DownloadGrant>("download", token);

export function slugsForPurchase(slug: string, catalogSlugs: string[]) {
  if (slug === "member-pass") return catalogSlugs;
  if (slug === "business-kit") return ["starter-pack", "business-kit"];
  return [slug];
}

export const ACCESS_COOKIE = "cove_access";
export const ACCESS_MAX_AGE = 60 * 60 * 24 * 365;

export function accessCookie(token: string) {
  return {
    name: ACCESS_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: store.url.startsWith("https"),
    path: "/",
    maxAge: ACCESS_MAX_AGE,
  };
}
