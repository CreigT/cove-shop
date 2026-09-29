import { NextResponse } from "next/server";
import { logEvent } from "@/lib/events";

export async function POST(request: Request) {
  const { email, topic, message } = (await request.json()) as {
    email?: string;
    topic?: string;
    message?: string;
  };
  if (!email || !message) {
    return NextResponse.json({ error: "Email and message are required." }, { status: 400 });
  }
  logEvent("ticket", `${email} · ${topic || "help"} · ${String(message).slice(0, 80)}`);
  return NextResponse.json({ ok: true });
}
