# Findings: Can Alpaca Support Our Customer Onboarding + Funding Flows?

**Bottom line: No, not with the product we're scoped to use.** Both flows the
POC was meant to validate — Alpaca-hosted account opening, and
Alpaca-hosted/assisted funding + recurring contributions — are capabilities
of Alpaca's **Broker API** product exclusively. The client has explicitly
ruled Broker API out of scope ("that's for bigger players, we only use the
Trading API"). The standard **Trading API** (the paper/live trading product,
`api.alpaca.markets` / `paper-api.alpaca.markets`) has **no account-creation
endpoint and no funding/transfer capability of any kind** — with or without
OAuth. This isn't a matter of missing access or approval on our part; it's
that the capability doesn't exist outside Broker API. Trading works (see
"What we proved" below); the account-opening and funding questions do not
have a workaround within Trading API.

This document is the evidence trail for that conclusion, organized by the
two questions the POC was scoped to answer.

---

## Question 1 — Customer account opening

**Can a customer start inside our app, go through an Alpaca-provided
onboarding flow, and have the resulting account associated back to us?**

**No, not via Trading API.** Account creation is exclusively a Broker API
endpoint (`POST /v1/accounts` on `broker-api.sandbox.alpaca.markets` /
`broker-api.alpaca.markets`). The Trading API reference has no
account-creation operation at all — only `GET /v2/account`, which reads the
account belonging to the API key pair you already hold. There is no way to
call Trading API and have it create a new brokerage account for a customer.

**Alpaca OAuth doesn't fill this gap either.** Alpaca does offer OAuth
("Connect API") for Trading API, but it is authorization-only, not signup:
- The customer must **already have an Alpaca-branded account**, opened
  directly through Alpaca's own dashboard/app — our app cannot originate it.
- The OAuth consent screen (`app.alpaca.markets/oauth/authorize`) lets an
  existing Alpaca user grant our app a token scoped to `trading`, `data`,
  and/or `account:write` (account configuration/watchlists). There is no
  account-creation scope.
- Registering an OAuth app in the first place requires *us* to log into an
  Alpaca brokerage account via Alpaca's Connect dashboard.

So the closest thing Trading API + OAuth offers is: a customer independently
signs up for their own standalone Alpaca account (under Alpaca's brand, not
ours), then separately authorizes our app to view/trade on it. That is a
fundamentally different customer experience than "the customer starts inside
our app and comes out the other side with an Alpaca account tied to us" —
there's no association step, no white-labeling, and the account isn't
something we can consider "ours" or attributable to us in Alpaca's system.

**What would actually satisfy this flow (for the record, since it's
explicitly out of scope):** Broker API's `POST /v1/accounts` supports
exactly this — a partner-owned onboarding UI collects identity/contact/
financial-profile/disclosure/agreement data, submits it as one payload, and
Alpaca runs KYC/AML decisioning asynchronously, returning the account through
a documented status lifecycle (`SUBMITTED` → `APPROVED`/`ACTION_REQUIRED`/
`APPROVAL_PENDING` → `ACTIVE`, etc.). Note even there: Alpaca does **not**
provide a hosted onboarding UI/widget (other than an optional Onfido SDK
step for ID-document capture) — the partner still builds 100% of the
onboarding screens themselves and submits structured data via REST.
Access to Broker API sandbox is self-serve/free (no partner approval
needed to develop against it); going to *production* requires a business
agreement with Alpaca (entity docs, KYC process doc, etc.). None of this
was tested against live endpoints for this POC since the client ruled the
product out before that work started — this is documentation-only,
synthesized from Alpaca's official docs (see Sources).

---

## Question 2 — Funding + recurring contributions

**Once opened, can the customer fund the account and set up recurring
contributions through an Alpaca-provided flow, with our app reading status?**

**No, not via Trading API.** There is no ACH, wire, deposit, or transfer
endpoint anywhere in the Trading API. Funding (`ACH relationships`,
`transfers`, `journals`) is exclusively documented under Broker API.
Trading API + OAuth's scope list (`trading`, `data`, `account:write`) has no
funding-related scope. The one thing Trading API *can* do is read the cash/
equity/buying_power fields on `GET /v2/account` — but only for an account we
already hold API keys for (our own paper account, or one an existing user
has OAuth'd to us), not as a general "check any customer's funding status"
capability, since we can't create or attach ACH funding to it via Trading
API in the first place.

**Recurring contributions have no native Alpaca object even under Broker
API.** For completeness: even if Broker API were in scope, there is no
"recurring investment" or "scheduled transfer" primitive in Alpaca's API.
Funding via Broker API is one-off (ACH via a Plaid-linked `ach_relationship`,
wire, or internal journal). A "contribute $X every Friday" feature would
require our own scheduler/cron calling the transfer endpoint repeatedly —
Alpaca doesn't manage recurrence for us. The closest adjacent feature,
"Portfolio Rebalancing," automates what happens to cash *once it lands* in
an account (buying toward target weights on a schedule or drift trigger) —
it is not a mechanism for pulling new cash from the customer's bank on a
schedule.

**Status delivery, for the record:** Broker API pushes status changes via
Server-Sent Events (account status, transfer status, journal status, trade
status, non-trading activity), not traditional webhooks. Not relevant to us
directly since we're not integrating Broker API, but worth knowing if this
ever gets revisited.

---

## What we proved (Trading API, in scope) — verified live, 2026-09-15

The NestJS backend in this repo was run end-to-end against a real Alpaca
paper trading account (`paper-api.alpaca.markets`):

1. `GET /trading/account` → account `PA3J93N4D9PG`, status `ACTIVE`,
   $100,000 paper cash/equity.
2. `POST /trading/orders` with `{"symbol":"AAPL","qty":"1","side":"buy"}` →
   order `cf8f8e43-4a36-42da-af5f-983e0c726d34` created, `pending_new`.
3. `GET /trading/orders/:id` → order shows `status":"filled"`,
   `filled_qty":"1"`, `filled_avg_price":"330.41"`.
4. `GET /trading/positions` → resulting position: 1 share AAPL, long,
   `avg_entry_price":"330.41"`.

This confirms the trading mechanics work end-to-end and that a NestJS
backend integrates cleanly with Alpaca's REST API and auth model. It does
**not** touch account-opening or funding, per the findings above — those
remain out of reach without Broker API regardless of trading working fine.

Full raw request/response bodies for all four calls:
[API_TEST_LOG.md](API_TEST_LOG.md).

---

## Recommendation

If the two-question goal ("can our app own the experience while Alpaca
handles brokerage infrastructure underneath it") is still the actual
business goal, it requires **Broker API**, not Trading API — there is no
version of Trading API, with or without OAuth, that opens accounts or moves
customer money. That's a product decision (and likely a commercial/legal
one — Broker API production access requires a business agreement with
Alpaca), not an engineering one, so it's flagged here rather than worked
around. If Broker API remains off the table, Alpaca cannot deliver the
onboarding/funding experience described in the original POC brief, and an
alternative (a different BaaS/brokerage-as-a-service provider, or a
fully-licensed in-house build) would need to be evaluated instead.

---

## Sources

All Broker API and Trading API/OAuth claims above are sourced from Alpaca's
official documentation, fetched and read directly (not summarized from
memory) during this POC:

- `docs.alpaca.markets/docs/about-broker-api`
- `docs.alpaca.markets/docs/getting-started-with-broker-api`
- `docs.alpaca.markets/docs/integration-setup-with-alpaca`
- `docs.alpaca.markets/docs/broker-api-faq`
- `docs.alpaca.markets/docs/account-opening`
- `docs.alpaca.markets/docs/accounts-statuses`
- `docs.alpaca.markets/docs/use-cases`
- `docs.alpaca.markets/docs/funding-accounts`
- `docs.alpaca.markets/docs/ach-funding`
- `docs.alpaca.markets/docs/funding-via-journals`
- `docs.alpaca.markets/docs/sse-events`
- `docs.alpaca.markets/docs/account-status-events-for-kycaas`
- `docs.alpaca.markets/docs/portfolio-rebalancing`
- `docs.alpaca.markets/reference/get-v1-accounts-account_id-onfido-sdk-tokens`
- `docs.alpaca.markets/docs/about-connect-api`
- `docs.alpaca.markets/docs/using-oauth2-and-trading-api`
- `docs.alpaca.markets/docs/registering-your-app`
- `docs.alpaca.markets/docs/getting-started-with-trading-api`
- `docs.alpaca.markets/us/llms.txt` (documentation index, used to confirm no
  funding/account-creation endpoints exist outside the Broker API section)
- `alpaca.markets/broker` (marketing page — used only for the specific
  quoted claims, flagged inline as marketing content rather than technical
  docs)
