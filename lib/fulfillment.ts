import { encodeDownload, slugsForPurchase } from "./access";
import { guardrails, maskEmail, store } from "./config";
import { createOrderOnce, getOrder, saveOrder, type Order } from "./db";
import { sendEmail } from "./email";
import { logEvent } from "./events";
import { appendSaleRow } from "./sheet";
import { dollars, getCatalog, getProduct } from "./products";

export async function downloadLink(order: Order) {
  const catalog = await getCatalog();
  const token = encodeDownload({
    orderId: order.id,
    email: order.email,
    slugs: slugsForPurchase(order.slug, catalog.map((p) => p.slug)),
    exp: Date.now() + guardrails().downloadTtlHours * 3_600_000,
  });
  return `${store.url}/api/download?token=${encodeURIComponent(token)}`;
}

export async function fulfillOrder(order: Order) {
  const created = await createOrderOnce(order);
  const stored = created ? order : await getOrder(order.id);
  if (!stored || stored.emailedLink) return { created, emailed: false, link: null };

  const product = await getProduct(order.slug, { includeDrafts: true });
  const name = product?.name || order.slug;
  if (created) {
    await logEvent(order.mode === "demo" ? "order-demo" : "order", `${maskEmail(order.email)} bought ${name} for ${dollars(order.amountCents)}`);
    await appendSaleRow([order.createdAt, order.slug, order.amountCents / 100, order.mode, order.id]);
  }

  const link = await downloadLink(order);
  const email = await sendEmail({
    to: order.email,
    subject: `Your ${store.name} ${name} is ready`,
    text: [
      `Thanks for buying ${name}.`,
      ``,
      `Open your files: ${link}`,
      `This link works for ${guardrails().downloadTtlHours} hours. After that, open ${store.url}/library on the browser you bought from, or reply to this email.`,
      ``,
      `Order ID: ${order.id}`,
      `Need a refund? Use ${store.url}/refund with this order ID within ${guardrails().refundWindowDays} days.`,
    ].join("\n"),
  });
  if (email.sent) await saveOrder({ ...stored, emailedLink: true });
  return { created, emailed: email.sent, link };
}
