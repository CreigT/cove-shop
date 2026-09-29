export type StoreEvent = {
  id: string;
  at: string;
  kind: string;
  detail: string;
};

const events: StoreEvent[] = [
  {
    id: "boot",
    at: new Date().toISOString(),
    kind: "system",
    detail: "Cove agents online. Demo mode until Stripe keys exist.",
  },
];

export function logEvent(kind: string, detail: string) {
  events.unshift({
    id: `${Date.now()}`,
    at: new Date().toISOString(),
    kind,
    detail,
  });
  if (events.length > 50) events.pop();
  return events[0];
}

export function listEvents() {
  return events;
}
