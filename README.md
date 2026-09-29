# Cove — complete simple AI shop

One site. Shop, library, help, refunds, reviews, and a $9 care pass.

You add environment variables. You push to GitHub. You deploy on Vercel.

You are the legal owner. You are not the day-to-day operator.

## Live repo

https://github.com/CreigT/cove-shop

## What you do

1. Open [vercel.com/new](https://vercel.com/new) and import `CreigT/cove-shop`.
2. Paste the variables from `.env.example`.
3. Deploy.
4. Set `NEXT_PUBLIC_STORE_URL` to the Vercel URL and redeploy once.
5. Leave Stripe keys empty to walk the shop in demo mode. Add keys when you want live cards.

## Pages

| URL | What it is |
| --- | --- |
| `/` | Landing page anyone can read |
| `/shop` | Three products |
| `/pricing` | Printed prices |
| `/product/[slug]` | Buy page |
| `/library` | Paywalled files |
| `/help` | FAQ + ticket form |
| `/refund` | Refund request (no auto money) |
| `/reviews` | Public notes |
| `/care` | $9 priority queue |
| `/agents` | Who runs the store |
| `/legal` | Owner, data, refunds |
| `/success` | After pay |
| `/api/health` | Liveness |

## Prices

- Starter Pack · **$9** once
- Business Kit · **$29** once
- Member Pass · **$19 / month**
- Priority Care · **$9** once

## Variables

```
NEXT_PUBLIC_STORE_NAME=Cove
NEXT_PUBLIC_STORE_TAGLINE=A calm digital shop. Agents keep the lights on.
NEXT_PUBLIC_STORE_URL=https://your-app.vercel.app
NEXT_PUBLIC_SUPPORT_EMAIL=you@email.com
NEXT_PUBLIC_OWNER_NAME=Your Name
NEXT_PUBLIC_DEMO_MODE=true
STORE_SECRET=long-random-string
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

Stripe webhook path: `https://YOUR-DOMAIN/api/webhook`

Live money runs only when `STRIPE_SECRET_KEY` is set and `NEXT_PUBLIC_DEMO_MODE=false`.

## Local

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000

## Change the catalog

Edit `lib/products.ts` and `lib/library.ts`.

## Owner rule

Refunds, legal promises, and live payouts wait for you. The shop can sell without you standing in checkout.

Builds on yesterday: [ai-commerce / Lumen](https://github.com/CreigT/ai-commerce).
Full engineering contract: [MODULE.md](./MODULE.md)
