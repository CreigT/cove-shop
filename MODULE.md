# Day module — Customer Care Desk inside a complete shop

## 1. Module Name
Cove Shop — Storefront + Customer Care Desk (Support, Refund intake, Reputation)

## 2. Purpose
Give ordinary buyers one readable place to shop, unlock files, ask for help, file a refund, and leave a review. Agents operate the desk. The human is owner and override only.

## 3. Business Value
A store that cannot answer “where is my file?” or “I want my $9 back” will churn. Care is the module that keeps $9–$29 digital sales trustworthy without a call center.

## 4. Agent Responsibilities
- Sales Agent: start checkout at printed prices
- Customer Support Agent: log tickets, point to the library
- Refund Agent: record requests, never execute Stripe refunds
- Reputation Agent: accept short public reviews
- CRM Agent: bind email to a signed cookie
- Ethics Agent: block dark patterns and silent charges
- CEO Agent: keep offers small and prices public

## 5. Inputs
Buyer email, product slug, ticket text, refund reason, review text, Stripe session id, env vars.

## 6. Outputs
Checkout URL, signed access cookie, library HTML, ticket event, refund-pending event, review list, health JSON.

## 7. APIs Required
`/api/checkout` `/api/claim` `/api/webhook` `/api/access` `/api/health` `/api/ticket` `/api/refund` `/api/review`

## 8. MCP Tools Required
None in production path. Optional later: GitHub deploy status, email send.

## 9. Databases Required
None required to launch. In-memory event + review lists on the function instance. Replace with Postgres when traffic is real.

## 10. Memory Requirements
HMAC access token in an httpOnly cookie. Short event log for the agent page.

## 11. Security Controls
Zero-trust cookies, HMAC signatures, webhook signature check, no secret keys in the browser, demo mode default, refunds cannot call Stripe.

## 12. Failure Recovery Strategy
Checkout errors return JSON. Demo path works with empty Stripe keys. Health endpoint for Vercel probes. Owner can freeze live mode by setting `NEXT_PUBLIC_DEMO_MODE=true`.

## 13. Agent-to-Agent Communications
Events written through `logEvent`. Support reads tickets. Refund reads refund-request. Reputation reads reviews. Finance only sees Stripe when live.

## 14. Workflow Diagram (text)
Buyer → Shop → Product → Checkout (demo cookie or Stripe)
→ Success → Claim → Library
Help note → Ticket API → Event log → Support Agent
Refund form → Refund API → pending-owner event (no payout)
Review form → Review API → wall

## 15. Data Flow
Env config → product catalog → checkout session → entitlement cookie → library render. Side paths write events only.

## 16. Decision Logic
If Stripe key missing or demo flag true → demo unlock.
If live → Stripe Checkout.
If refund posted → log only.
If ticket posted → log only.
If review posted → append public list.

## 17. Escalation Rules
Refunds, chargebacks, legal claims, and any amount above printed catalog prices escalate to the owner email. Agents do not improvise discounts.

## 18. KPIs
Checkout start rate, demo vs live mix, library unlocks, tickets per 10 sales, refund requests, review count and average stars, health uptime.

## 19. Logging Requirements
Every checkout start, claim, ticket, refund request, review, and Stripe event type.

## 20. Audit Trail Requirements
Event log fields: id, time, kind, detail. Cookie payload stores email + slugs + expiry.

## 21. Compliance Requirements
Printed prices. No dark patterns. 14-day refund *request* window. Owner approval for money movement. Privacy note on /legal. Stripe handles cards.

## 22. Future Expansion Ideas
Postgres tickets, Resend mail, owner approval token for refunds, loyalty stamps, help-center search.

## 23. Risks
In-memory logs reset on cold start. Cookie access is browser-bound. Demo mode can be mistaken for live if URL is public. Webhook must use raw body.

## 24. Testing Strategy
`npm run build`. Hit `/api/health`. Walk demo checkout for $9 starter. Confirm library lock/unlock. Submit help and refund. Confirm refund JSON `moneyMoved: false`.

## 25. Production Readiness Checklist
- [ ] Env vars set on Vercel
- [ ] STORE_SECRET is long and random
- [ ] STORE_URL matches the live domain
- [ ] Demo mode understood
- [ ] Stripe webhook added only when live
- [ ] Support email is a real inbox
- [ ] Legal page names the owner

## 26. Suggested Technology Stack
Next.js 14, React 18, TypeScript, Stripe, Vercel, HMAC cookies.

## 27. Cost Estimate
Hobby Vercel: $0. Stripe: 2.9% + $0.30 live only. Domain optional ~$12/year. No LLM cost in this module.

## 28. Deployment Plan
Create GitHub repo → import in Vercel → paste env → deploy → set public URL → redeploy → test /api/health.

## 29. Maintenance Strategy
Change copy in `lib/products.ts` and `lib/library.ts`. Rotate STORE_SECRET only if you can re-issue access. Watch /agents after a launch week.

## 30. Opportunities for Additional AI Automation
Draft ticket replies, summarize refund reasons for the owner, flag angry reviews, suggest the next $9 pack from review text.

---

Completed today: Cove complete shop + care desk.
Depends on: Lumen / ai-commerce storefront pattern, Quay fulfillment idea.
Tomorrow: Email desk — plain broadcast + one $9 “launch note” paywall.
Remaining platform: about 22%.
