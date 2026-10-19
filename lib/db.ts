import { getKv } from "./kv";

export type OrderStatus = "paid" | "refunded" | "refund_held";

export type Order = {
  id: string;
  mode: "live" | "demo";
  email: string;
  slug: string;
  amountCents: number;
  currency: string;
  paymentIntentId: string | null;
  subscriptionId: string | null;
  status: OrderStatus;
  createdAt: string;
  emailedLink: boolean;
};

export type RefundOutcome =
  | { kind: "refunded"; refundId: string; amountCents: number }
  | { kind: "held"; reason: string }
  | { kind: "rejected"; reason: string };

export type Ticket = {
  id: string;
  email: string;
  topic: string;
  message: string;
  intent: string;
  reply: string;
  answeredBy: "ai" | "rules";
  createdAt: string;
  refund?: RefundOutcome;
};

export type AgentName = "pricing" | "product" | "marketing" | "report";

export type AgentRun = {
  id: string;
  agent: AgentName;
  startedAt: string;
  finishedAt: string;
  status: "ok" | "skipped" | "error";
  summary: string;
};

export type MarketingPost = {
  id: string;
  at: string;
  slug: string;
  post: string;
  emailBlurb: string;
  delivered: "webhook" | "stored";
};

export type RevenueReport = {
  id: string;
  at: string;
  last24hCents: number;
  last7dCents: number;
  orders24h: number;
  refunds7d: number;
  refundsHeld: number;
  aiCallsToday: number;
  text: string;
};

const LIST_MAX = 500;
const kv = () => getKv();
const orderKey = (id: string) => `order:${id}`;

export const newId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export async function createOrderOnce(order: Order) {
  const created = await kv().set(orderKey(order.id), order, { nx: true });
  if (created) await kv().push("orders", order.id, LIST_MAX);
  return created;
}

export async function getOrder(id: string) {
  return kv().get<Order>(orderKey(id));
}

export async function saveOrder(order: Order) {
  await kv().set(orderKey(order.id), order);
}

export async function recentOrders(count = LIST_MAX) {
  const ids = await kv().range<string>("orders", count);
  const rows = await kv().mget<Order>(ids.map(orderKey));
  return rows.filter((row): row is Order => row !== null);
}

export async function findOrderByPaymentIntent(paymentIntentId: string) {
  return (await recentOrders()).find((o) => o.paymentIntentId === paymentIntentId) || null;
}

export async function saveTicket(ticket: Ticket) {
  await kv().push("tickets", ticket, LIST_MAX);
}

export async function recentTickets(count = 50) {
  return kv().range<Ticket>("tickets", count);
}

export async function saveRun(run: AgentRun) {
  await kv().push("agent-runs", run, LIST_MAX);
}

export async function recentRuns(count = 30) {
  return kv().range<AgentRun>("agent-runs", count);
}

export async function claimDailyRun(agent: AgentName, day: string) {
  return kv().set(`run-lock:${agent}:${day}`, true, { nx: true, ex: 60 * 60 * 26 });
}

export async function savePost(post: MarketingPost) {
  await kv().push("marketing-posts", post, 100);
}

export async function recentPosts(count = 10) {
  return kv().range<MarketingPost>("marketing-posts", count);
}

export async function saveReport(report: RevenueReport) {
  await kv().push("reports", report, 100);
}

export async function recentReports(count = 7) {
  return kv().range<RevenueReport>("reports", count);
}
