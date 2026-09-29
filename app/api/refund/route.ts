import { NextResponse } from "next/server";
import { logEvent } from "@/lib/events";

export async function POST(request: Request) {
  const { email, slug, reason } = (await request.json()) as {
    email?: string;
    slug?: string;
    reason?: string;
  };
  if (!email || !reason) {
    return NextResponse.json({ error: "Email and reason are required." }, { status: 400 });
  }
  logEvent(
    "refund-request",
    `${email} asked to refund ${slug || "unknown"} — pending owner`
  );
  return NextResponse.json({ ok: true, moneyMoved: false });
}
