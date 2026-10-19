import { aiBudget } from "../ai";
import { guardrails, today } from "../config";
import {
  claimDailyRun,
  newId,
  recentOrders,
  recentTickets,
  saveReport,
  savePost,
  saveRun,
  type AgentName,
  type AgentRun,
} from "../db";
import { sendEmail } from "../email";
import { logEvent } from "../events";
import { addAgentProduct, dollars, getCatalog, markLaunched, setPrices } from "../products";
import { store } from "../config";
import { planPrices } from "./pricing";
import { draftProduct } from "./product";
import { deliverPost, pickFeatured, writePost } from "./marketing";
import { buildReport } from "./report";

type AgentJob = { title: string; run: () => Promise<string> };

export const agents: Record<AgentName, AgentJob> = {
  pricing: {
    title: "Pricing Agent",
    async run() {
      const g = guardrails();
      await markLaunched();
      const changes = planPrices(await getCatalog(), await recentOrders(), {
        minCents: g.priceMinCents,
        maxCents: g.priceMaxCents,
        stepPct: g.priceStepPct,
      });
      if (!changes.length) return "No price changes. Every price is inside the band.";
      await setPrices(Object.fromEntries(changes.map((c) => [c.slug, c.toCents])));
      return changes.map((c) => `${c.slug} ${dollars(c.fromCents)} to ${dollars(c.toCents)} (${c.reason})`).join("; ");
    },
  },
  product: {
    title: "Product Agent",
    async run() {
      const catalog = await getCatalog({ includeDrafts: true });
      if (catalog.filter((p) => p.origin === "agent").length >= guardrails().maxAgentProducts) {
        return "Catalog is at MAX_AGENT_PRODUCTS, nothing added.";
      }
      const drafted = await draftProduct(catalog);
      if (!drafted) return "No new idea left in the fallback bank and no AI key.";
      await addAgentProduct(drafted.product);
      return `${drafted.product.status === "live" ? "Published" : "Drafted"} ${drafted.product.name} at ${dollars(drafted.product.priceCents)} (${drafted.source}).`;
    },
  },
  marketing: {
    title: "Marketing Agent",
    async run() {
      const featured = pickFeatured(await getCatalog(), await recentOrders(100));
      const post = await deliverPost(await writePost(featured));
      await savePost(post);
      return `${post.delivered === "webhook" ? "Posted" : "Stored"} copy for ${featured.name}: "${post.post.slice(0, 120)}"`;
    },
  },
  report: {
    title: "Revenue Report",
    async run() {
      const report = buildReport(await recentOrders(), await recentTickets(200), (await aiBudget()).calls);
      await saveReport(report);
      const owner = process.env.OWNER_EMAIL;
      const mail = owner
        ? await sendEmail({ to: owner, subject: `${store.name} daily report: ${dollars(report.last24hCents)}`, text: report.text })
        : { sent: false as const, reason: "OWNER_EMAIL not set" };
      return `${dollars(report.last24hCents)} last 24h, ${dollars(report.last7dCents)} last 7d. Email ${mail.sent ? "sent" : `skipped (${mail.reason})`}.`;
    },
  },
};

export const isAgentName = (value: string): value is AgentName => value in agents;

export async function runAgent(name: AgentName, options: { force?: boolean } = {}): Promise<AgentRun> {
  const startedAt = new Date().toISOString();
  const finish = async (status: AgentRun["status"], summary: string) => {
    const run: AgentRun = { id: newId("run"), agent: name, startedAt, finishedAt: new Date().toISOString(), status, summary };
    await saveRun(run);
    await logEvent(`agent:${name}`, `${status} · ${summary}`);
    return run;
  };

  if (guardrails().killSwitch) return finish("skipped", "KILL_SWITCH is on. Agent halted.");
  if (!options.force && !(await claimDailyRun(name, today()))) {
    return finish("skipped", "Already ran today.");
  }
  try {
    return await finish("ok", await agents[name].run());
  } catch (error) {
    return finish("error", String(error).slice(0, 300));
  }
}
