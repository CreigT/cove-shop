import { getStripe } from "./stripe";
import { guardrails, maskEmail, store } from "./config";
import { getOrder, saveOrder, type Order, type RefundOutcome } from "./db";
import { logEvent } from "./events";
import { sendEmail } from "./email";
import { dollars } from "./products";

export type RefundPlan =
  | { kind: "auto"; amountCents: number }
  | { kind: "hold"; reason: string }
  | { kind: "reject"; reason: string };

type RefundPolicy = { capCents: number; windowDays: number; killSwitch: boolean };

export function planRefund(
  order: Order | null,
  email: string,
  policy: RefundPolicy,
  now = Date.now()
): RefundPlan {
  if (!order || order.email.toLowerCase() !== email.toLowerCase()) {
    return { kind: "reject", reason: "No paid order matches that order ID and email." };
  }
  if (order.status === "refunded") return { kind: "reject", reason: "This order was already refunded." };
  if (order.status === "refund_held") return { kind: "hold", reason: "Already waiting for owner review." };
  const ageDays = (now - Date.parse(order.createdAt)) / 86_400_000;
  if (ageDays > policy.windowDays) {
    return { kind: "hold", reason: `Outside the ${policy.windowDays}-day window, so the owner reviews it.` };
  }
  if (order.amountCents > policy.capCents) {
    return { kind: "hold", reason: `Above the ${dollars(policy.capCents)} automatic cap, so the owner reviews it.` };
  }
  if (policy.killSwitch) return { kind: "hold", reason: "Agents are paused, so the owner reviews it." };
  return { kind: "auto", amountCents: order.amountCents };
}

export async function requestRefund(input: {
  orderId: string;
  email: string;
  reason: string;
}): Promise<RefundOutcome> {
  const g = guardrails();
  const order = await getOrder(input.orderId);
  const plan = planRefund(order, input.email, {
    capCents: g.refundAutoCapCents,
    windowDays: g.refundWindowDays,
    killSwitch: g.killSwitch,
  });

  if (plan.kind === "reject") return { kind: "rejected", reason: plan.reason };
  if (!order) return { kind: "rejected", reason: "No order." };

  const hold = async (reason: string): Promise<RefundOutcome> => {
    if (order.status !== "refund_held") await saveOrder({ ...order, status: "refund_held" });
    await logEvent("refund-held", `${maskEmail(order.email)} ${dollars(order.amountCents)} · ${reason}`);
    const owner = process.env.OWNER_EMAIL;
    if (owner) {
      await sendEmail({
        to: owner,
        subject: `${store.name}: refund needs you (${dollars(order.amountCents)})`,
        text: `Order ${order.id} from ${order.email} for ${order.slug}.\nReason held: ${reason}\nBuyer said: ${input.reason}\n\nRefund it from the Stripe dashboard if you agree. The webhook marks it refunded.`,
      });
    }
    return { kind: "held", reason };
  };

  if (plan.kind === "hold") return hold(plan.reason);

  if (order.mode === "demo") {
    await saveOrder({ ...order, status: "refunded" });
    await logEvent("refund", `${maskEmail(order.email)} demo refund ${dollars(order.amountCents)}, no money moved`);
    return { kind: "refunded", refundId: `demo_${order.id}`, amountCents: order.amountCents };
  }

  const stripe = getStripe();
  if (!stripe || !order.paymentIntentId) return hold("Stripe is not reachable for this order.");

  try {
    const refund = await stripe.refunds.create(
      { payment_intent: order.paymentIntentId, metadata: { orderId: order.id, by: "refund-agent" } },
      { idempotencyKey: `refund-${order.id}` }
    );
    if (order.subscriptionId) {
      await stripe.subscriptions.cancel(order.subscriptionId).catch(() => null);
    }
    await saveOrder({ ...order, status: "refunded" });
    await logEvent("refund", `auto-refunded ${dollars(order.amountCents)} to ${maskEmail(order.email)}`);
    return { kind: "refunded", refundId: refund.id, amountCents: order.amountCents };
  } catch (error) {
    return hold(`Stripe refund failed: ${String(error).slice(0, 120)}`);
  }
}
