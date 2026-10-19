import { chat, parseJsonObject } from "../ai";
import { store } from "../config";
import { newId, type MarketingPost, type Order } from "../db";
import { formatPrice, type Product } from "../products";

export function pickFeatured(catalog: Product[], orders: Order[]) {
  const counts = new Map<string, number>();
  for (const order of orders) counts.set(order.slug, (counts.get(order.slug) || 0) + 1);
  const newest = [...catalog].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
  const best = [...catalog].sort((a, b) => (counts.get(b.slug) || 0) - (counts.get(a.slug) || 0))[0];
  return new Date().getUTCDate() % 2 === 0 ? best : newest;
}

export async function writePost(product: Product): Promise<Omit<MarketingPost, "delivered">> {
  const link = `${store.url}/product/${product.slug}`;
  const aiText = await chat(
    [
      { role: "system", content: "You write honest, plain marketing copy. No hype words, no fake scarcity, no emojis. Reply with one JSON object." },
      {
        role: "user",
        content: `Product: ${product.name} (${formatPrice(product)}). ${product.description}
JSON keys: post (under 240 chars, ends with the link ${link}), emailBlurb (2-3 sentences).`,
      },
    ],
    { maxTokens: 300, json: true }
  );
  const ai = parseJsonObject<{ post?: string; emailBlurb?: string }>(aiText);
  const post =
    ai?.post && ai.post.length <= 280
      ? ai.post
      : `${product.name}: ${product.blurb} ${formatPrice(product)}, instant download. ${link}`;
  return {
    id: newId("post"),
    at: new Date().toISOString(),
    slug: product.slug,
    post,
    emailBlurb: ai?.emailBlurb || `${product.description} It is ${formatPrice(product)} and opens right after checkout.`,
  };
}

export async function deliverPost(post: Omit<MarketingPost, "delivered">): Promise<MarketingPost> {
  const target = process.env.MARKETING_WEBHOOK_URL;
  if (!target) return { ...post, delivered: "stored" };
  try {
    const res = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: post.post, content: post.post, emailBlurb: post.emailBlurb, slug: post.slug }),
    });
    return { ...post, delivered: res.ok ? "webhook" : "stored" };
  } catch {
    return { ...post, delivered: "stored" };
  }
}
