import { createHmac } from "crypto";
import { store } from "./config";
import { products } from "./products";

export type Entitlement = {
  slugs: string[];
  email: string;
  exp: number;
};

function sign(payload: string) {
  return createHmac("sha256", store.secret).update(payload).digest("hex");
}

export function encodeAccess(data: Entitlement) {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeAccess(token?: string | null): Entitlement | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || sign(payload) !== signature) return null;
  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as Entitlement;
    if (data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export function slugsForPurchase(slug: string) {
  if (slug === "member-pass") {
    return products.map((p) => p.slug);
  }
  if (slug === "business-kit") {
    return ["starter-pack", "business-kit"];
  }
  return [slug];
}

export const ACCESS_COOKIE = "cove_access";
