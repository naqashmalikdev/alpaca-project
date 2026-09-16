# Alpaca POC — Project Context

## What this is

A 5-hour scoping POC (NestJS backend) to answer one strategic question for the
business: **can our application own the customer experience while Alpaca
provides the brokerage account-opening and funding infrastructure underneath
it?**

This is not a product build. It is a technical spike to de-risk a build/buy
decision before committing engineering time to an Alpaca integration.

## The two questions this POC exists to answer

1. **Account opening**: can a customer start inside our app, go through an
   Alpaca-provided onboarding/account-opening flow, and have the resulting
   Alpaca account associated back to our application?
2. **Funding + recurring contributions**: once opened, can the customer fund
   the account and set up recurring contributions through an
   Alpaca-provided flow/UI, with our app able to read funding/account status?

**Read [FINDINGS.md](FINDINGS.md) first**, then **[PROPOSAL.md](PROPOSAL.md)**
for how the client's actual ask reframes those findings. Short version of
FINDINGS.md: a fully white-labeled onboarding + in-app funding UI requires
Alpaca's **Broker API**, which the client has ruled out. But the client's
real ask (relayed after FINDINGS.md was written) is narrower than that: an
**OAuth pop-out** for account opening (not custom onboarding UI) and
**Alpaca fully owns funding** (not something our app builds a UI for) — both
of which are plausibly achievable on plain Trading API. PROPOSAL.md is the
current live assessment and milestone plan for that narrower, real ask. Two
concrete unknowns remain unvalidated (see PROPOSAL.md "Risk 1" / "Risk 2"):
whether Alpaca's OAuth flow actually supports brand-new customers cleanly
in one sitting (undocumented), and that Alpaca has no mutual-fund asset
class at all (so literal "Vanguard 2065"-style funds aren't tradable —
needs an ETF-proxy mapping instead).

## Explicit non-goals for this POC

Per the client's own scoping — do not spend time on:
- Target-date portfolio construction or rebalancing
- Polished UI
- Production infrastructure
- Regulatory/compliance implementation
- Working around the Broker API restriction (e.g., screen-scraping, informal
  workarounds) — if a flow needs Broker API, document that, don't route
  around it

## What was actually built

Since account-opening and funding are out of reach without Broker API, the
only piece of the two POC questions that's directly testable is the trading
layer, using our own Alpaca **paper trading** (Trading API) credentials:

- `POST /trading/orders` — place a paper order
- `GET /trading/orders/:id` — retrieve an order
- `GET /trading/positions` / `GET /trading/positions/:symbol` — retrieve
  position(s)
- `GET /trading/account` — retrieve account status/cash/equity (this is the
  one piece of "account status" Trading API *can* read for an account we
  already hold keys to — see FINDINGS.md for why this doesn't generalize to
  reading a customer's status)

No database, no auth, no customer-management layer was built — there was
nothing real to persist once Broker API was ruled out. Don't add a customer
<-> account association layer speculatively; it would be fictional code
standing in for a capability we don't have access to.

Also built, once the client clarified the real product is a target-date
fund picker: `FundsModule` (`GET /funds/vintages`, `GET
/funds/target-date?year=`) resolving a retirement year to a real, tradable
ETF (iShares LifePath Target Date family, discovered via Alpaca's live
`/v2/assets`) — pure app logic, no Alpaca call. Fed straight into
`TradingService` to place a real mapped trade. See PROPOSAL.md "Risk 2" and
API_TEST_LOG.md Session 2.

**Status: verified live** — two rounds of live paper-account testing on
2026-09-15 (account `PA3J93N4D9PG`): a plain AAPL order (Session 1), and a
retirement-year → fund → order → position round trip using ITDG (Session
2, client's own "30 years out" example). Full request/response trails in
[API_TEST_LOG.md](API_TEST_LOG.md).

## Current status: Risk 1 blocked (client decision), Risk 2 done

Per PROPOSAL.md's two de-risking questions:

- **Risk 2 (fund mapping) — DONE**, and better than expected: a real ETF
  family already matches the "pick your retirement year" ask, no synthetic
  glide-path construction needed. See above.
- **Risk 1 (OAuth for brand-new customers) — formal validation still
  BLOCKED (client chose not to submit placeholder legal docs), but
  indirect real-world evidence found without needing our own OAuth app.**
  `OauthModule` is built and ready (`GET /oauth/login` / `GET
  /oauth/callback`) for whenever credentials do land. Since Alpaca's OAuth
  authorize screen is hosted/controlled entirely by Alpaca (not the
  partner), its new-user behavior can be observed secondhand through
  Alpaca's public Connect partner directory
  (`alpaca.markets/connect`) — no approval needed for us to look. One
  partner, **TradersPost**, documents on its own site that a new customer
  must create their Alpaca account on Alpaca's own signup page as a
  *separate* step, then return to connect — not one seamless inline
  pop-out. See PROPOSAL.md Risk 1 "Update 2" for the full writeup and two
  free next steps (click through more partner apps yourself; email Alpaca
  support a plain informational question — not a Connect submission).
  **Don't restart the formal OAuth-app-submission path without checking
  PROPOSAL.md/the conversation for a new decision first** — that blocker
  is still business/legal, not something to code around.

## Architecture

```
src/
  config/           # env config (ConfigModule, typed AppConfig)
  alpaca/           # AlpacaTradingClient — thin wrapper over Alpaca Trading API
                     # (paper), auth headers injected via HttpModule.registerAsync
  trading/           # TradingModule: controller + service + DTO for the
                     # order/position/account demo endpoints
  oauth/             # OauthModule: Alpaca Connect (OAuth2) login/callback,
                     # used to validate the "pop out and come back" flow
                     # (blocked — see "Current status" above)
  funds/             # FundsModule: retirement-year -> tradable ETF mapping
                     # (iShares LifePath Target Date family), pure logic
```

Env vars (see `.env.example`): `ALPACA_TRADING_KEY_ID`,
`ALPACA_TRADING_SECRET_KEY`, `ALPACA_TRADING_BASE_URL` (defaults to
`https://paper-api.alpaca.markets`), `ALPACA_OAUTH_CLIENT_ID`,
`ALPACA_OAUTH_CLIENT_SECRET`, `ALPACA_OAUTH_REDIRECT_URI`,
`ALPACA_OAUTH_SCOPE`, `ALPACA_OAUTH_ENV`.

## Conventions for this repo

- Keep it small. This is a spike, not a product codebase — resist adding
  abstractions, retry logic, queues, etc. that a real integration would
  eventually need.
- Don't build speculative code for Broker API flows (account creation,
  ACH linking, recurring transfers) since we don't have access to test
  them and the client has ruled the product out. If that changes, the
  research in FINDINGS.md is the starting point for real implementation.
- class-validator DTOs + a global `ValidationPipe` (whitelist + transform)
  guard the one write endpoint (`POST /trading/orders`).
- Alpaca credentials are picked up via `.env` (gitignored) using
  `@nestjs/config`; never hardcode keys.

## Useful commands

```bash
npm run start:dev      # watch mode
npm run start          # single run
npx tsc --noEmit       # type-check only
```

## Manual smoke test (paper trade demo)

```bash
curl http://localhost:3000/trading/account

curl -X POST http://localhost:3000/trading/orders \
  -H "Content-Type: application/json" \
  -d '{"symbol":"AAPL","qty":"1","side":"buy"}'

curl http://localhost:3000/trading/orders/<id-from-above>
curl http://localhost:3000/trading/positions
```

## Manual smoke test (target-date fund demo)

```bash
curl http://localhost:3000/funds/vintages
curl "http://localhost:3000/funds/target-date?year=2056"   # -> ITDG

curl -X POST http://localhost:3000/trading/orders \
  -H "Content-Type: application/json" \
  -d '{"symbol":"ITDG","qty":"1","side":"buy"}'

curl http://localhost:3000/trading/orders/<id-from-above>
curl http://localhost:3000/trading/positions/ITDG
```
