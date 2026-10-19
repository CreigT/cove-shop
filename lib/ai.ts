import { getKv } from "./kv";
import { guardrails, today } from "./config";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type AiBudget = { calls: number; tokens: number; callCap: number; tokenCap: number };

export function aiConfigured() {
  return Boolean(process.env.AI_API_KEY);
}

export async function aiBudget(): Promise<AiBudget> {
  const kv = getKv();
  const day = today();
  const [calls, tokens] = await kv.mget<number>([`ai:calls:${day}`, `ai:tokens:${day}`]);
  const g = guardrails();
  return { calls: Number(calls || 0), tokens: Number(tokens || 0), callCap: g.aiDailyCallCap, tokenCap: g.aiDailyTokenCap };
}

export async function chat(
  messages: ChatMessage[],
  options: { maxTokens?: number; json?: boolean } = {}
): Promise<string | null> {
  const key = process.env.AI_API_KEY;
  if (!key || guardrails().killSwitch) return null;

  const kv = getKv();
  const day = today();
  const budget = await aiBudget();
  if (budget.tokens >= budget.tokenCap) return null;
  const calls = await kv.incr(`ai:calls:${day}`, 1, 60 * 60 * 48);
  if (calls > budget.callCap) return null;

  const baseUrl = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "gpt-4o-mini",
        messages,
        max_tokens: options.maxTokens ?? 300,
        temperature: 0.6,
        ...(options.json ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { total_tokens?: number };
    };
    await kv.incr(`ai:tokens:${day}`, data.usage?.total_tokens || options.maxTokens || 300, 60 * 60 * 48);
    const text = data.choices?.[0]?.message?.content?.trim();
    return res.ok && text ? text : null;
  } catch (error) {
    console.error("ai call failed", error);
    return null;
  }
}

export function parseJsonObject<T>(text: string | null): T | null {
  if (!text) return null;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
