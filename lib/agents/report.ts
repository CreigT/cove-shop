import type { Order, RevenueReport, Ticket } from "../db";
import { newId } from "../db";
import { dollars } from "../products";
import { store } from "../config";

const DAY = 86_400_000;

export function buildReport(
  orders: Order[],
  tickets: Ticket[],
  aiCallsToday: number,
  now = Date.now()
): RevenueReport {
  const live = orders.filter((o) => o.mode === "live");
  const within = (o: { createdAt: string }, days: number) => now - Date.parse(o.createdAt) <= days * DAY;
  const kept = live.filter((o) => o.status !== "refunded");
  const last24h = kept.filter((o) => within(o, 1));
  const last7d = kept.filter((o) => within(o, 7));
  const refunds7d = live.filter((o) => o.status === "refunded" && within(o, 7)).length;
  const held = live.filter((o) => o.status === "refund_held").length;
  const demo24h = orders.filter((o) => o.mode === "demo" && within(o, 1)).length;
  const sum = (list: Order[]) => list.reduce((total, o) => total + o.amountCents, 0);
  const report: RevenueReport = {
    id: newId("rpt"),
    at: new Date(now).toISOString(),
    last24hCents: sum(last24h),
    last7dCents: sum(last7d),
    orders24h: last24h.length,
    refunds7d,
    refundsHeld: held,
    aiCallsToday,
    text: "",
  };
  report.text = [
    `${store.name} daily report`,
    `Revenue last 24h: ${dollars(report.last24hCents)} from ${report.orders24h} orders.`,
    `Revenue last 7 days: ${dollars(report.last7dCents)}.`,
    `Refunds last 7 days: ${refunds7d}. Refunds waiting for you: ${held}.`,
    `Support tickets last 24h: ${tickets.filter((t) => within(t, 1)).length}.`,
    `AI calls today: ${aiCallsToday}.`,
    demo24h ? `Demo orders last 24h (no money): ${demo24h}.` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return report;
}
