import type { Metadata } from "next";
import { checkSecret } from "@/lib/auth";
import { ownerStatus } from "@/lib/status";
import { dollars } from "@/lib/products";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false }, referrer: "no-referrer" };

const when = (iso: string) => iso.replace("T", " ").slice(0, 16) + " UTC";

export default async function AdminPage({ searchParams }: { searchParams: { token?: string } }) {
  const auth = checkSecret(searchParams.token || null, "ADMIN_TOKEN");
  if (!auth.ok) {
    return (
      <div className="wrap section">
        <h1>Owner desk</h1>
        <p className="lede">{auth.status === 503 ? "Set ADMIN_TOKEN to open this page." : "Add ?token=YOUR_ADMIN_TOKEN to the address."}</p>
      </div>
    );
  }

  const s = await ownerStatus();
  return (
    <div className="wrap section">
      <h1>Owner desk</h1>
      <p className="notice">
        Mode {s.mode} · storage {s.storage} · AI {s.ai} · email {s.email} · kill switch{" "}
        {s.guardrails.killSwitch ? "ON" : "off"} · AI calls today {s.budget.calls}/{s.budget.callCap}
      </p>

      <h2 style={{ marginTop: 28 }}>Revenue</h2>
      <pre className="card" style={{ whiteSpace: "pre-wrap" }}>{s.revenue.text}</pre>

      <h2 style={{ marginTop: 28 }}>Agent runs</h2>
      {s.runs.map((run) => (
        <div className="agent-row" key={run.id}>
          <span>{when(run.startedAt)} · {run.agent} · {run.status}</span>
          <span className="muted">{run.summary}</span>
        </div>
      ))}

      <h2 style={{ marginTop: 28 }}>Orders</h2>
      {s.orders.map((order) => (
        <div className="agent-row" key={order.id}>
          <span>{when(order.createdAt)} · {order.slug} · {dollars(order.amountCents)} · {order.mode}</span>
          <span className="muted">{order.email} · {order.status} · {order.emailedLink ? "link emailed" : "no email"} · {order.id}</span>
        </div>
      ))}

      <h2 style={{ marginTop: 28 }}>Tickets</h2>
      {s.tickets.map((ticket) => (
        <div className="agent-row" key={ticket.id}>
          <span>{when(ticket.createdAt)} · {ticket.intent} · {ticket.answeredBy}{ticket.refund ? ` · refund ${ticket.refund.kind}` : ""}</span>
          <span className="muted">{ticket.email}: {ticket.message.slice(0, 100)}</span>
        </div>
      ))}

      <h2 style={{ marginTop: 28 }}>Catalog</h2>
      {s.catalog.map((product) => (
        <div className="agent-row" key={product.slug}>
          <span>{product.name} · {dollars(product.priceCents)}</span>
          <span className="muted">{product.origin} · {product.status}</span>
        </div>
      ))}

      <h2 style={{ marginTop: 28 }}>Marketing copy</h2>
      {s.posts.map((post) => (
        <div className="agent-row" key={post.id}>
          <span>{when(post.at)} · {post.delivered}</span>
          <span className="muted">{post.post}</span>
        </div>
      ))}

      <h2 style={{ marginTop: 28 }}>Events</h2>
      {s.events.map((event) => (
        <div className="agent-row" key={event.id}>
          <span>{when(event.at)} · {event.kind}</span>
          <span className="muted">{event.detail}</span>
        </div>
      ))}
    </div>
  );
}
