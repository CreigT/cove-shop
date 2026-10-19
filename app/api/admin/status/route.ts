import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/auth";
import { ownerStatus } from "@/lib/status";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = adminAuth(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  return NextResponse.json(await ownerStatus());
}
