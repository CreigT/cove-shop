import { NextResponse } from "next/server";
import { requestRefund } from "@/lib/refunds";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { email, orderId, reason } = (await request.json().catch(() => ({}))) as {
    email?: string;
    orderId?: string;
    reason?: string;
  };
  if (!email || !orderId || !reason) {
    return NextResponse.json({ error: "Email, order ID, and reason are required." }, { status: 400 });
  }
  const outcome = await requestRefund({ email: email.trim(), orderId: orderId.trim(), reason: reason.slice(0, 1000) });
  return NextResponse.json({ ok: outcome.kind !== "rejected", outcome });
}
