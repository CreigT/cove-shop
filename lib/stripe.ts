import Stripe from "stripe";

const API_VERSION = "2024-06-20" as const;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: API_VERSION });
}

export function webhookVerifier() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || "sk_unset_for_signature_checks", {
    apiVersion: API_VERSION,
  }).webhooks;
}
