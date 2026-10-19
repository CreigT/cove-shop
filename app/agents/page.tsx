import { listEvents } from "@/lib/events";
import { SPONSOR, guardrails, isDemoMode, store } from "@/lib/config";
import { recentRuns } from "@/lib/db";
import { agents } from "@/lib/agents";
import { aiConfigured } from "@/lib/ai";
import { dollars } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const g = guardrails();
  const [events, runs] = await Promise.all([listEvents(20), recentRuns(12)]);
  const roster: [string, string][] = [
    ["Fulfillment Agent", "Records each paid order from Stripe and emails a signed download link"],
    ["Support Agent", `Answers help notes ${aiConfigured() ? "with AI" : "with rules"}, inside written policy`],
    ["Refund Agent", `Refunds orders up to ${dollars(g.refundAutoCapCents)} within ${g.refundWindowDays} days. Holds the rest for the owner`],
    ...Object.values(agents).map((a): [string, string] => [a.title, "Runs once a day on a schedule"]),
  ];

  return (
    <div className="wrap section">
      <h1>Agents</h1>
      <p className="lede">
        {store.name} is operated by agents. {store.owner} is the legal owner and
        the emergency override.
      </p>
      <p className="badge">{SPONSOR}</p>
      <p className="notice">
        Mode: {isDemoMode() ? "demo, no live charges" : "live Stripe"}.
        {g.killSwitch ? " Kill switch is on. Scheduled agents are halted." : ""}
        {` Prices stay between ${dollars(g.priceMinCents)} and ${dollars(g.priceMaxCents)}.`}
      </p>
      {roster.map(([name, job]) => (
        <div className="agent-row" key={name}>
          <span>
            <span className="dot" />
            {name}
          </span>
          <span className="muted">{job}</span>
        </div>
      ))}
      <h2 style={{ marginTop: 36 }}>Recent agent runs</h2>
      {runs.length === 0 ? <p className="muted">No scheduled runs yet.</p> : null}
      {runs.map((run) => (
        <div className="agent-row" key={run.id}>
          <span>
            {run.agent} · {run.status}
          </span>
          <span className="muted">{run.summary}</span>
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
