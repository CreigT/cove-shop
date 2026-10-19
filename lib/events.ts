import { getKv } from "./kv";

export type StoreEvent = {
  id: string;
  at: string;
  kind: string;
  detail: string;
};

export async function logEvent(kind: string, detail: string) {
  const event: StoreEvent = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    kind,
    detail,
  };
  console.log(JSON.stringify({ layer: "cove", ...event }));
  try {
    await getKv().push("events", event, 200);
  } catch (error) {
    console.error("event log failed", error);
  }
  return event;
}

export async function listEvents(count = 30) {
  return getKv().range<StoreEvent>("events", count);
}
