export const store = {
  name: process.env.NEXT_PUBLIC_STORE_NAME || "Cove",
  tagline:
    process.env.NEXT_PUBLIC_STORE_TAGLINE ||
    "A calm digital shop. Agents keep the lights on.",
  url: process.env.NEXT_PUBLIC_STORE_URL || "http://localhost:3000",
  support: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@example.com",
  owner: process.env.NEXT_PUBLIC_OWNER_NAME || "Owner",
  secret: process.env.STORE_SECRET || "dev-only-change-me",
};

export function isDemoMode() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "false") return false;
  return !process.env.STRIPE_SECRET_KEY;
}
