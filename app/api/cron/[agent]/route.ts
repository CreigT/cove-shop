import { NextResponse } from "next/server";
import { cronAuth } from "@/lib/auth";
import { isAgentName, runAgent } from "@/lib/agents";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request, { params }: { params: { agent: string } }) {
  const auth = cronAuth(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!isAgentName(params.agent)) {
    return NextResponse.json({ error: "Unknown agent." }, { status: 404 });
  }
  const force = new URL(request.url).searchParams.get("force") === "1";
  const run = await runAgent(params.agent, { force });
  return NextResponse.json(run, { status: run.status === "error" ? 500 : 200 });
}
