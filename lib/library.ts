export const libraryItems: Record<
  string,
  { title: string; body: string }[]
> = {
  "starter-pack": [
    {
      title: "20 prompts",
      body: "Write a product name, a one-sentence offer, three benefits, and a fair price. Repeat for a checklist, a guide, and a membership.",
    },
    {
      title: "Pricing worksheet",
      body: "Cost to make it + 4 hours of your time + a price a stranger would pay without a call. If that number is over $49, split the offer.",
    },
    {
      title: "Launch checklist",
      body: "Page live. Price printed. Refund rule written. Support email working. One test purchase in demo mode. Then open Stripe.",
    },
  ],
  "business-kit": [
    {
      title: "Landing page blocks",
      body: "Who it is for. What they get. What it costs. How to get help. What happens after they pay. Keep each block under 60 words.",
    },
    {
      title: "Email scripts",
      body: "Launch: here is the link and the price. Delivery: here is the library. Refund: reply to this note and we review within two days.",
    },
    {
      title: "Agent task list",
      body: "Morning: check failed checkouts. Midday: answer tickets. Evening: log refunds for owner review. Never move money alone.",
    },
  ],
  "member-pass": [
    {
      title: "This month’s drop",
      body: "A 7-day content calendar for a $9 digital pack, plus three subject lines that do not shout.",
    },
    {
      title: "Agent report",
      body: "Demo mode is on until Stripe keys exist. Help queue is empty until the first ticket. Refunds stay paused for owner review.",
    },
  ],
  "care-pass": [
    {
      title: "How priority works",
      body: "Your next help or refund note is tagged priority. A written reply goes out the same business day. Money still waits on the owner.",
    },
  ],
};
