import { listEvents } from "@/lib/events";
import { isDemoMode, store } from "@/lib/config";

const agents = [
  ["CEO Agent", "Keeps the shop pointed at simple offers"],
  ["Sales Agent", "Prints prices and starts checkout"],
  ["Customer Support Agent", "Reads help notes the same day"],
  ["Refund Agent", "Logs refunds. Does not move money"],
  ["Reputation Agent", "Watches the review wall"],
  ["CRM Agent", "Remembers the buyer email on this browser"],
  ["Treasury Agent", "Hands Stripe sessions to finance"],
  ["Ethics & Compliance Agent", "Blocks silent charges and dark patterns"],
];

export default function AgentsPage() {
  const events = listEvents();

  return (
    <div className="wrap section">
      <h1>Agents</h1>
      <p className="lede">
        {store.name} is operated by agents. {store.owner} is the legal owner and
        the emergency override.
      </p>
      <p className="notice">
        Mode: {isDemoMode() ? "demo — no live charges" : "live Stripe"}.
      </p>
      {agents.map(([name, job]) => (
        <div className="agent-row" key={name}>
          <span>
            <span className="dot" />
            {name}
          </span>
          <span className="muted">{job}</span>
        </div>
      ))}
      <h2 style={{ marginTop: 36 }}>Recent events</h2>
      {events.map((event) => (
        <div className="agent-row" key={event.id}>
          <span>{event.kind}</span>
          <span className="muted">{event.detail}</span>
        </div>
      ))}
    </div>
  );
}
