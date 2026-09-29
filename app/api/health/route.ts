import { NextResponse } from "next/server";
import { isDemoMode, store } from "@/lib/config";

export async function GET() {
  return NextResponse.json({
    ok: true,
    store: store.name,
    demo: isDemoMode(),
    time: new Date().toISOString(),
  });
}
