import { chat, parseJsonObject } from "../ai";
import { guardrails } from "../config";
import type { Product } from "../products";
import { clampPrice } from "./pricing";

type Draft = {
  name: string;
  blurb: string;
  description: string;
  includes: string[];
  items: { title: string; body: string }[];
  priceDollars: number;
};

const ideaBank: Draft[] = [
  {
    name: "Cold Email Kit",
    blurb: "Ten short emails that get replies.",
    description: "Ten plain cold emails for small service businesses, with subject lines and a follow-up schedule.",
    includes: ["10 cold email templates", "Subject line list", "3-touch follow-up schedule"],
    items: [
      { title: "The two-line opener", body: "Name the business. Name one thing you noticed. Ask one yes-or-no question. Stop there." },
      { title: "Follow-up schedule", body: "Day 3: one line, same thread. Day 7: share one useful link. Day 14: ask if you should close the file." },
    ],
    priceDollars: 12,
  },
  {
    name: "Pricing Page Teardown",
    blurb: "Fix the page that decides the sale.",
    description: "A checklist and examples for a pricing page a stranger can read in ten seconds.",
    includes: ["12-point pricing checklist", "Three tier layouts", "Refund line examples"],
    items: [
      { title: "Ten-second test", body: "Can a stranger say what it costs, what they get, and how to cancel in ten seconds? If not, cut words." },
      { title: "Three tiers", body: "Small, standard, and all-in. Mark one as the default. Keep the gap between tiers near 2x." },
    ],
    priceDollars: 15,
  },
  {
    name: "30-Day Content Calendar",
    blurb: "One post a day for a month, already written.",
    description: "Thirty short post prompts for a one-person digital business, sorted by week.",
    includes: ["30 post prompts", "Weekly theme plan", "Repurposing guide"],
    items: [
      { title: "Week one themes", body: "Day 1 what you sell. Day 2 who it is for. Day 3 a mistake you fixed. Day 4 a customer question. Day 5 a behind-the-scenes photo." },
      { title: "Repurpose rule", body: "Every long post becomes three short ones and one email. Never write from zero twice." },
    ],
    priceDollars: 9,
  },
];

const slugify = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);

function validDraft(value: Partial<Draft> | null): value is Draft {
  return Boolean(
    value &&
      typeof value.name === "string" &&
      value.name.length > 2 &&
      typeof value.blurb === "string" &&
      typeof value.description === "string" &&
      Array.isArray(value.includes) &&
      Array.isArray(value.items) &&
      value.items.every((i) => typeof i?.title === "string" && typeof i?.body === "string") &&
      value.items.length > 0
  );
}

export async function draftProduct(catalog: Product[]): Promise<{ product: Product; source: "ai" | "rules" } | null> {
  const g = guardrails();
  const taken = new Set(catalog.map((p) => p.slug));
  const band = { minCents: g.priceMinCents, maxCents: g.priceMaxCents, stepPct: g.priceStepPct };

  const aiText = await chat(
    [
      {
        role: "system",
        content:
          "You design small digital products (checklists, templates, guides) for solo founders. Reply with one JSON object only.",
      },
      {
        role: "user",
        content: `Existing products: ${catalog.map((p) => p.name).join(", ")}.
Propose one new product that is different from these. Price between $${g.priceMinCents / 100} and $${g.priceMaxCents / 100}.
JSON keys: name, blurb (under 60 chars), description (under 200 chars), includes (3-5 strings), items (3-5 objects with title and body; body is the actual useful content, 40-90 words), priceDollars (number).`,
      },
    ],
    { maxTokens: 900, json: true }
  );
  const aiDraft = parseJsonObject<Partial<Draft>>(aiText);
  const fromAi = validDraft(aiDraft) && !taken.has(slugify(aiDraft.name)) ? aiDraft : null;
  const draft = fromAi || ideaBank.find((idea) => !taken.has(slugify(idea.name)));
  if (!draft) return null;

  return {
    source: fromAi ? "ai" : "rules",
    product: {
      slug: slugify(draft.name),
      name: draft.name.slice(0, 60),
      priceCents: clampPrice(Number(draft.priceDollars) * 100 || g.priceMinCents, band),
      interval: "one_time",
      blurb: draft.blurb.slice(0, 80),
      description: draft.description.slice(0, 300),
      includes: draft.includes.slice(0, 6).map((s) => String(s).slice(0, 100)),
      items: draft.items.slice(0, 6).map((i) => ({ title: i.title.slice(0, 80), body: i.body.slice(0, 900) })),
      badge: "New",
      origin: "agent",
      status: g.autopublish ? "live" : "draft",
      createdAt: new Date().toISOString(),
      priceSince: new Date().toISOString(),
    },
  };
}
