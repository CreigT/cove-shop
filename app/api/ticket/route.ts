import { NextResponse } from "next/server";
import { answerTicket } from "@/lib/agents/support";
import { requestRefund } from "@/lib/refunds";
import { newId, saveTicket, type Ticket } from "@/lib/db";
import { guardrails, maskEmail, store } from "@/lib/config";
import { getKv } from "@/lib/kv";
import { logEvent } from "@/lib/events";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    topic?: string;
    message?: string;
    orderId?: string;
  };
  const email = String(body.email || "").trim();
  const message = String(body.message || "").trim().slice(0, 2000);
  const topic = String(body.topic || "other").slice(0, 40);
  const orderId = String(body.orderId || "").trim();
  if (!email || !message) {
    return NextResponse.json({ error: "Email and message are required." }, { status: 400 });
  }

  const ip = (request.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  const hour = new Date().toISOString().slice(0, 13);
  const count = await getKv().incr(`rate:ticket:${ip}:${hour}`, 1, 3600);
  if (count > guardrails().ticketsPerHourPerIp) {
    return NextResponse.json({ error: "Too many notes this hour. Try again later." }, { status: 429 });
  }

  const wantsRefund = topic === "refund" || /refund|money back/i.test(message);
  const refund = wantsRefund && orderId ? await requestRefund({ orderId, email, reason: message }) : undefined;
  const answer = await answerTicket({ topic, message, refund });

  const ticket: Ticket = {
    id: newId("tkt"),
    email,
    topic,
    message,
    intent: answer.intent,
    reply: answer.reply,
    answeredBy: answer.answeredBy,
    createdAt: new Date().toISOString(),
    refund,
  };
  await saveTicket(ticket);
  await logEvent("ticket", `${maskEmail(email)} · ${answer.intent} · answered by ${answer.answeredBy}`);
  await sendEmail({ to: email, subject: `Re: your ${store.name} note`, text: answer.reply });

  return NextResponse.json({ ok: true, ticketId: ticket.id, reply: answer.reply, answeredBy: answer.answeredBy, refund });
}
