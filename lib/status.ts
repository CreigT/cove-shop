import { aiBudget, aiConfigured } from "./ai";
import { guardrails, isDemoMode } from "./config";
import { recentOrders, recentPosts, recentReports, recentRuns, recentTickets } from "./db";
import { listEvents } from "./events";
import { getKv } from "./kv";
import { getCatalog } from "./products";
import { buildReport } from "./agents/report";

export async function ownerStatus() {
  const [orders, tickets, runs, posts, reports, events, catalog, budget] = await Promise.all([
    recentOrders(),
    recentTickets(20),
    recentRuns(20),
    recentPosts(5),
    recentReports(3),
    listEvents(30),
    getCatalog({ includeDrafts: true }),
    aiBudget(),
  ]);
  return {
    mode: isDemoMode() ? "demo" : "live",
    storage: getKv().kind,
    ai: aiConfigured() ? "configured" : "rules only",
    email: process.env.RESEND_API_KEY ? "configured" : "off",
    guardrails: guardrails(),
    budget,
    revenue: buildReport(orders, tickets, budget.calls),
    orders: orders.slice(0, 20),
    tickets,
    runs,
    posts,
    reports,
    events,
    catalog,
  };
}
