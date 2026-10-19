import { NextResponse } from "next/server";
import { guardrails, isDemoMode, store } from "@/lib/config";
import { getKv } from "@/lib/kv";
import { aiConfigured } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    store: store.name,
    demo: isDemoMode(),
    storage: getKv().kind,
    ai: aiConfigured(),
    email: Boolean(process.env.RESEND_API_KEY),
    killSwitch: guardrails().killSwitch,
    time: new Date().toISOString(),
  });
}
