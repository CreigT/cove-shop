# Cove: an autonomous AI storefront

**Sponsored by CREIGNIFICENT LLC**

Cove sells small digital products and runs itself once the owner adds keys. Agents deliver orders, answer support, refund small orders, add new products, tune prices, write marketing copy, and send the owner a daily revenue report. Guardrails cap what any agent can do with money or AI spend, and one switch stops them all.

With no environment variables, the whole loop runs in demo mode: checkout is simulated, storage is in memory, support answers by rule, and the product agent uses a built-in idea bank.

## How the loop works

| Agent | Trigger | What it does | Guardrail |
| --- | --- | --- | --- |
| Fulfillment | Stripe `checkout.session.completed` webhook | Verifies the Stripe signature on the raw body, records the order once, emails a signed download link | Idempotent per Checkout Session. Link expires after `DOWNLOAD_LINK_TTL_HOURS` and closes on refund |
| Support | `POST /api/ticket` | Classifies the note by rule, answers with AI when a key is set, emails the reply | AI only rewrites a rule decision. It cannot move money. Per-IP rate limit |
| Refund | `/refund` page or a refund ticket with an order ID | Refunds through Stripe when the order matches the email, is inside the window, and is at or under the cap | `REFUND_AUTO_CAP` (default $29). Larger ones are held and emailed to the owner |
| Pricing | Daily cron | Raises a price one step after 5+ sales in 7 days, lowers it one step after 7 days with no sales at that price | Never outside `PRICE_MIN` to `PRICE_MAX`. Max change `PRICE_STEP_PCT` per day. Subscriptions untouched |
| Product | Daily cron | Drafts a new digital product with real content, publishes it | Price clamped to the band. At most `MAX_AGENT_PRODUCTS`. `AGENT_AUTOPUBLISH=false` keeps drafts hidden |
| Marketing | Daily cron | Writes a post and an email blurb for a featured product, stores it, posts to `MARKETING_WEBHOOK_URL` if set | Nothing is posted anywhere without that URL |
| Revenue report | Daily cron | Stores a report and emails it to `OWNER_EMAIL` | Read-only |

Global guardrails:

- `KILL_SWITCH=true` halts every scheduled agent and all AI calls, and sends every refund to owner review. Paid orders are still delivered.
- `AI_DAILY_CALL_CAP` and `AI_DAILY_TOKEN_CAP` stop AI calls for the day once reached. Agents fall back to rules.
- `/admin?token=ADMIN_TOKEN` is a read-only owner desk with orders, revenue, tickets, agent runs, catalog, and events. `GET /api/admin/status` returns the same data as JSON with `Authorization: Bearer ADMIN_TOKEN`.
- `/agents` is the public page showing the agent roster and recent runs. Emails are masked.
- Each cron route needs `Authorization: Bearer CRON_SECRET`. Vercel sends it automatically when `CRON_SECRET` is set. Each agent runs at most once per UTC day. Add `?force=1` to rerun by hand.

## Go live checklist

Do these in order. Nothing here needs code changes.

1. **Storage.** In Vercel, open the project, then Storage, and add an Upstash Redis database (free tier) connected to this project. That sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`. Without it, orders and agent memory vanish on every cold start.
2. **Secrets.** Set `STORE_SECRET`, `CRON_SECRET`, and `ADMIN_TOKEN` to long random strings (`openssl rand -hex 32`).
3. **Store identity.** Set `NEXT_PUBLIC_STORE_NAME`, `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_OWNER_NAME`, and `NEXT_PUBLIC_STORE_URL` (your production URL, no trailing slash).
4. **Email.** Create a free Resend account, verify a sending domain, and set `RESEND_API_KEY`, `EMAIL_FROM` (an address on that domain), and `OWNER_EMAIL`. Resend's test sender `onboarding@resend.dev` only delivers to your own Resend login email.
5. **AI.** Set `AI_API_KEY`, `AI_BASE_URL`, and `AI_MODEL` for any OpenAI-compatible provider. Groq has a free tier: `AI_BASE_URL=https://api.groq.com/openai/v1`, `AI_MODEL=llama-3.1-8b-instant`. Keep the daily caps.
6. **Stripe keys.** Set `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. Start with test keys (`sk_test_...`).
7. **Stripe webhook.** In the Stripe dashboard, open Developers, then Webhooks, and add the endpoint `https://YOUR-DOMAIN/api/webhook` with the events `checkout.session.completed`, `checkout.session.async_payment_succeeded`, and `charge.refunded`. Copy its signing secret into `STRIPE_WEBHOOK_SECRET`.
8. **Turn off demo.** Set `NEXT_PUBLIC_DEMO_MODE=false` and redeploy. Environment changes only apply after a redeploy.
9. **Test purchase.** With test keys, buy the Starter Pack using card `4242 4242 4242 4242`. Confirm the receipt email arrives with a working download link, the order shows on `/admin?token=...`, and a refund from `/refund` with the order ID succeeds.
10. **Test the agents.** Run each once by hand:
    ```bash
    for a in pricing product marketing report; do
      curl -H "Authorization: Bearer $CRON_SECRET" "https://YOUR-DOMAIN/api/cron/$a?force=1"; echo
    done
    ```
11. **Go live.** Swap in live Stripe keys, create a live-mode webhook with the same three events, update `STRIPE_WEBHOOK_SECRET`, and redeploy.
12. **Plan check.** Vercel's Hobby plan is for non-commercial use. A store taking real payments should run on a Pro plan.

Optional:

- `STRIPE_PRICE_*` uses fixed Stripe Price IDs for seed products. They apply only while the price matches the seed price. After the pricing agent changes a price, checkout uses inline pricing.
- `MARKETING_WEBHOOK_URL` receives `{ text, content, emailBlurb, slug }` as JSON each day, which fits a Zapier, Make, or Discord webhook.
- `SALES_SHEET_ID` and `GOOGLE_SERVICE_ACCOUNT` (the service account JSON) append each sale to a `Sales` tab in Google Sheets. Share the sheet with the service account email.

## Schedule

`vercel.json` runs the agents daily in UTC: pricing 13:00, product 14:00, marketing 15:00, report 16:00 (6 to 9 AM Pacific in summer). Hobby plans may fire anywhere within the hour.

## Pages and routes

| URL | What it is |
| --- | --- |
| `/` `/shop` `/pricing` `/product/[slug]` | Storefront, including agent-made products |
| `/library` | Purchased content, unlocked by cookie or emailed link |
| `/help` | FAQ and the support agent |
| `/refund` | Refund agent |
| `/agents` | Public agent roster and recent runs |
| `/admin?token=` | Read-only owner desk |
| `/api/webhook` | Stripe webhook |
| `/api/download?token=` | Signed download link. Add `&file=1` for a Markdown file |
| `/api/cron/[agent]` | `pricing`, `product`, `marketing`, `report` |
| `/api/health` | Mode, storage, AI, email, kill switch |

## Local

```bash
npm install
npm run dev        # demo mode, no keys needed
npm test           # webhook, refunds, pricing, kill switch, cron auth, support
npm run typecheck
npm run lint
npm run build
```

To run an agent locally, start with `CRON_SECRET=dev npm run dev` and call `curl -H "Authorization: Bearer dev" localhost:3000/api/cron/product`.

## Change the catalog

Seed products live in `lib/products.ts` and their content in `lib/library.ts`. Agent-made products and price changes are stored in Redis.

Engineering contract: [MODULE.md](./MODULE.md)
