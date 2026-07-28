# BarbFlow — Barbing Business Management Platform

A multi-tenant web app for running a barbing business: super admin, business owners (admin), barbers, and customers — with Paystack payments, ticket-based haircut approvals, an automatic loyalty reward (every 3rd paid visit is free), and an 85/15 revenue split between business owners and the platform.

**Stack:** Next.js 14 (App Router) · Supabase (Postgres + Auth + RLS) · Paystack · Cloudflare Pages · GitHub

---

## 1. How the system works

| Role | Capabilities |
|---|---|
| **Super Admin** | Platform owner. Views revenue/commission across all businesses, sets/adjusts each business's commission rate, suspends businesses. |
| **Admin (business owner)** | Registers their business, onboards/removes barbers & customers, sets haircut price, approves tickets, approves barber expenses, views Finance tab (profit/loss, money in/out, transactions report). |
| **Barber** | Onboarded by the owner, can reset their own password, approves customer tickets, logs expenses (owner-approved). |
| **Customer** | Onboarded by owner or barber, pays via Paystack, gets an auto-generated ticket, clicks "Submit ticket" so it appears on the owner/barber dashboard for approval, gets a free ticket automatically every 3rd paid visit. |

**Payment flow:** Customer pays on Paystack → webhook confirms → a `transactions` row is marked `success` → a Postgres trigger auto-creates a `pending` ticket and increments the customer's loyalty counter (every 3rd triggers a free ticket) → customer clicks **Submit ticket** → it appears on the owner/barber dashboard → they approve it → barber gives the haircut → mark completed.

**Money split:** Every successful transaction is split at the database level: `platform_fee` (15% default, editable per business by the super admin) and `business_amount` (the rest). The Finance tab totals these automatically.

---

## 2. Project structure

```
barbing-app/
├─ app/
│  ├─ login/, register/              — auth pages
│  ├─ dashboard/
│  │  ├─ super-admin/                — platform overview, businesses list
│  │  ├─ admin/                      — finance, tickets, barbers, customers, expenses
│  │  ├─ barber/                     — tickets, expenses, password reset
│  │  └─ customer/                   — pay, ticket history, loyalty progress
│  └─ api/paystack/initiate,webhook  — payment routes
├─ lib/
│  ├─ actions.ts                     — server actions (onboarding, approvals, expenses)
│  ├─ paystack.ts                    — Paystack init/verify/webhook signature helpers
│  └─ supabase/client.ts, server.ts  — Supabase browser/server/admin clients
├─ supabase/schema.sql               — full DB schema, RLS policies, triggers
└─ middleware.ts                     — session refresh + role-based route protection
```

---

## 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** and run the entire contents of `supabase/schema.sql`. This creates all tables, the loyalty trigger, and Row Level Security policies.
3. Go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret — used only in server-side code for onboarding & webhooks)
4. Go to **Authentication → Providers** and make sure Email is enabled. You can turn off "Confirm email" for now since accounts are created server-side with `email_confirm: true`.

### Creating your first Super Admin
There's no public signup for super admin (by design — it's the platform owner). After you sign up as a business owner once (via `/register`) or create a user directly in Supabase Auth, promote them manually in the SQL editor:

```sql
update profiles set role = 'super_admin', business_id = null where id = 'the-users-auth-uuid';
```

---

## 4. Set up Paystack

1. Get your **Test** API keys from Paystack Dashboard → Settings → API Keys & Webhooks.
2. Add them to your environment variables (see step 6).
3. Under **Settings → API Keys & Webhooks**, set your webhook URL to:
   ```
   https://your-domain.pages.dev/api/paystack/webhook
   ```
   This is what confirms payment and triggers ticket + loyalty generation — required for the flow to work end-to-end.
4. When you're ready for real payments, switch to your live keys and update the webhook URL to your production domain.

---

## 5. Push to GitHub

```bash
cd barbing-app
git init
git add .
git commit -m "Initial commit: BarbFlow platform"
git branch -M main
git remote add origin https://github.com/<your-username>/barbing-app.git
git push -u origin main
```

---

## 6. Deploy to Cloudflare (Workers, via OpenNext)

This app is wired for the **OpenNext Cloudflare adapter** (`@opennextjs/cloudflare`) — the actively-maintained way to run Next.js on Cloudflare (the older `@cloudflare/next-on-pages` is deprecated and capped at Next 15.5.2 with a known CVE, so this project avoids it).

**Option A — CLI (simplest)**
```bash
npm install
npx wrangler login          # one-time: connect your Cloudflare account
npm run deploy               # builds with OpenNext, then deploys via Wrangler
```
Set your secrets first (these are NOT read from `.env` in production — Workers needs them set explicitly):
```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put PAYSTACK_SECRET_KEY
```
Non-secret public vars (`NEXT_PUBLIC_*`) can go in `wrangler.jsonc` under `"vars"`, or also as secrets — either works for this app.

**Option B — Cloudflare Dashboard (Git integration)**
1. Go to Cloudflare Dashboard → **Workers & Pages → Create → Workers → Connect to Git**, select your repo.
2. Build command: `npx opennextjs-cloudflare build`
3. Deploy command: `npx opennextjs-cloudflare deploy`
4. Add your environment variables/secrets in Settings → Variables.
5. Deploy. Cloudflare gives you a `*.workers.dev` (or your custom domain) URL — use that for your Paystack webhook (step 4.3).

**Local preview against Cloudflare's runtime:**
```bash
npm run preview
```

---

## 7. Local development

```bash
npm install
cp .env.example .env.local   # fill in real values
npm run dev
```
Visit `http://localhost:3000`. For local Paystack webhook testing, use the Paystack CLI or a tunnel (e.g. `cloudflared tunnel` or `ngrok`) pointed at `localhost:3000/api/paystack/webhook`.

---

## 8. Testing the full flow

1. Go to `/register` → create a business (you become the `admin`).
2. In **Barbers**, onboard a barber (note the temp password you set — the barber logs in and can change it under **Reset Password**).
3. In **Customers**, onboard a customer.
4. Log in as that customer, go to **My Tickets**, click **Pay** → complete payment with a Paystack test card (`4084 0840 8408 4081`, any future expiry/CVV/OTP).
5. After redirect, refresh — a ticket appears. Click **Submit ticket**.
6. Log in as the owner or barber → **Tickets** → **Approve** → **Mark completed**.
7. Repeat the payment 2 more times as the same customer — on the 3rd paid transaction, a free ticket is auto-generated (check **Customers** tab for the loyalty count, or the customer's ticket history for the 🎁 entry).
8. As a barber, log an expense in **Expenses** → as the owner, approve/reject it → check the owner's **Finance Overview** for updated profit/loss.
9. Promote yourself to `super_admin` (SQL snippet above) and check **Platform Overview** and per-business commission control.

---

## 9. Extending this further
This scaffold covers the full core loop end-to-end. Natural next additions:
- Email/SMS notifications (ticket approved, free ticket earned) — Supabase has built-in email hooks, or wire up a provider like Termii/Twilio for SMS (common for Nigerian users).
- Multiple services/prices per business (currently one `default_price` per business).
- Barber-specific commission/payout splits within a business.
- Analytics charts on the Finance tab (the `recharts` package is already included).
- Business branding (logo, custom slug page) for a public booking link.
