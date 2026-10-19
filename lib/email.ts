import { logEvent } from "./events";
import { maskEmail } from "./config";

export type EmailResult = { sent: true; id: string } | { sent: false; reason: string };

export async function sendEmail(message: {
  to: string;
  subject: string;
  text: string;
}): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    await logEvent("email-skipped", `${maskEmail(message.to)} · ${message.subject} (RESEND_API_KEY not set)`);
    return { sent: false, reason: "email not configured" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Cove <onboarding@resend.dev>",
        to: [message.to],
        subject: message.subject,
        text: message.text,
      }),
    });
    const data = (await res.json()) as { id?: string; message?: string };
    if (!res.ok || !data.id) throw new Error(data.message || `status ${res.status}`);
    await logEvent("email", `${maskEmail(message.to)} · ${message.subject}`);
    return { sent: true, id: data.id };
  } catch (error) {
    await logEvent("email-failed", `${maskEmail(message.to)} · ${String(error)}`);
    return { sent: false, reason: String(error) };
  }
}
