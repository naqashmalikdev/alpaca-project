# Proposal: Target-Date Fund App on Alpaca Trading API

> **Note (2026-09-16):** for the authoritative, rigorously-labeled
> breakdown of what was directly tested vs. confirmed from docs vs.
> inferred from a partner vs. still unverified — specifically for the two
> account-opening/funding questions — see
> [POC_REPORT.md](POC_REPORT.md). This document is the working technical
> log behind that report; treat POC_REPORT.md as authoritative if the two
> differ in how confident they sound.

## Verdict up front

**Architecturally plausible on Trading API, but not yet proven** — see
POC_REPORT.md for exactly what was and wasn't tested. Risk 1 (the
OAuth pop-out flow) can't be *fully, formally* validated quickly, because
Alpaca's own OAuth approval process requires a mostly-built product (real
website, Terms of Use, Privacy Policy, screenshots of your live app) and
takes ~30 business days — but real-world evidence from Alpaca's public
Connect partner directory (see Risk 1 "Update 2") suggests the shape is:
customer creates their Alpaca account on Alpaca's own signup page as a
separate step, then comes back to connect it — not one single seamless
pop-out, but still "starts in our app, finishes on Alpaca, comes back."
Your framing (pop-out to Alpaca for account opening, Alpaca fully owns
funding) sidesteps the Broker API requirement I'd flagged in the earlier
POC — that finding still stands for a *different* ask (custom
white-labeled onboarding + funding UI inside our app), but isn't a
blocker here. What *is* now a blocker to fast validation is Alpaca's own
compliance gate on OAuth itself — see the "Update" under Risk 1 below,
which is new information since the milestone plan further down was written.

What's already proven, live, this session: our NestJS backend places a
paper order, confirms the fill, and reads back the resulting position
against a real Alpaca account (see `FINDINGS.md` / `API_TEST_LOG.md`). The
mechanics of "app talks to Alpaca and trades" are not in question. What's in
question is the two things below.

---

## The two things that could still break this, and why I want to test them first

### Risk 1: Does the "pop-out and come back" actually work for a *brand-new* customer?

Alpaca's OAuth ("Connect API") is well documented for connecting an
**existing** Alpaca account to a third-party app. What is **not documented
anywhere** — I checked every OAuth-related page Alpaca publishes — is what
happens when someone with *no* Alpaca account hits the OAuth authorize
screen. Specifically undocumented:
- Does `app.alpaca.markets/oauth/authorize` offer an inline "sign up" path
  that carries the user through full KYC and then continues the OAuth
  consent + redirect automatically? Or is account creation a fully separate
  process the user has to do first, on their own, before OAuth will work?
- Is KYC approval fast enough to happen in one sitting (user starts in our
  app, signs up at Alpaca, gets approved, lands back in our app, all in a
  few minutes), or can it take hours/days — which would mean the user
  leaves and we have to bring them back later once approved, breaking the
  "pop out and come back" experience you're picturing?

This is the single biggest risk to the UX you described. If it doesn't work
smoothly, the fallback (user manually signs up at Alpaca via a link,
separately, then OAuth-connects afterward) is still workable but is a worse
experience and changes how we design the "waiting on Alpaca" state in our
app.

**How I'd validate it:** register an OAuth app against Alpaca (paper
environment), and actually run the flow with a fresh email that has no
Alpaca account, and document exactly what happens at each step, with
screenshots and timing. This is a half-day task, not a milestone — I'd want
to do it before scoping the rest in stone.

**Update — this is bigger than "manual review," and changes the shape of
this risk entirely.** We pulled up the actual Alpaca Connect application
form. It requires, before you can even submit:

- A public **Application Website** (a real homepage for the app)
- A **Terms of Use** link and a **Privacy Policy** link (real legal
  documents)
- **Screenshots of all customer-facing pages** — specifically including a
  screenshot of the exact OAuth disclosure screen ("Authorize [Your App
  Name]...") *as it appears inside your already-built app*
- An app logo

And per Alpaca's own FAQ on that page: "You should receive an email...
within the next 24 business hours after application submission," but "the
current approval timeframe... between application submission and your app
going live [is] around 30 business days."

In other words: **Alpaca requires a mostly-finished product (with legal
pages and real screens to screenshot) before they'll approve OAuth for it,
and the process takes about 6 weeks.** This is a chicken-and-egg problem
for a scoping POC — we wanted to use OAuth access to decide whether to
build the product, but Alpaca wants the product mostly built before
granting OAuth access. There is one unconfirmed possibility worth checking
before assuming the full 30-day gate applies to everything: the FAQ's "next
step after submission" is "connect your app to your paper account using
your Client ID" — phrased as something that happens right after
submission, separate from "going live." That suggests self-testing with
*our own* paper account might be unlocked immediately on submission, with
the 30-day review gating public/production use rather than all access. That
is a guess, not a documented fact — the only way to know is to ask Alpaca
directly or submit and see.

**This is a real decision point, not an engineering one** — submitting
requires real Terms of Use / Privacy Policy pages and a description of the
app, which are business/legal artifacts, not code. I'm not filling those in
with placeholders unilaterally.

**Decision (client, this session): don't submit yet.** Remaining POC time
went to Risk 2 instead (see below), which doesn't depend on Alpaca
approving anything.

**Update 2 — indirect evidence found, without needing our own OAuth app.**
Alpaca runs a public directory of live partner apps that already use
Connect: **alpaca.markets/connect**, "Featured Apps" — TradingView,
TradersPost, SignalStack, AlgoBulls, CandleX, Breaking Equity,
Machinetrader, QuantMage, StockHero, Zoya Finance, Muslim Xchange, Aramche,
BLSH, Feather Finance, Trellis. Since the OAuth authorize screen itself is
hosted and controlled by Alpaca (not by the partner), its new-user behavior
should be the same no matter which partner's app initiates it — meaning we
can observe it secondhand through any of these, without needing our own
approved app.

One partner, **TradersPost** (traderspost.io/broker/alpaca), documents its
flow explicitly on its own site: *"If you do not already have an Alpaca
brokerage account, you can open one on the Alpaca website
[app.alpaca.markets/signup]. After your account is set up, return to
TradersPost to connect it..."* — i.e., **account creation is a separate,
standalone step on Alpaca's own signup page, not something chained inline
into the OAuth authorize screen.** This is one partner's documented
behavior, not a guaranteed platform-wide technical fact (a different
partner could theoretically request different behavior), but it's real,
published, current evidence — not a guess — and it directly answers the
core question in Risk 1: **the "pop out, sign up fresh, immediately come
back" single-pop-out experience you were picturing is probably not how
this works.** More likely shape: pop out to Alpaca's signup → complete KYC
(timing unconfirmed — could be instant or could take longer) → separately
return to do the OAuth connect step once the account exists. That's still
a "start in our app, finish on Alpaca, come back" experience, just two
Alpaca-side steps instead of one seamless hop.

**Two free ways to firm this up further, no OAuth app or 30-day wait
needed:**
1. **Click through 2-3 of the listed partner apps yourself** (TradersPost,
   CandleX, StockHero) as an outside observer, stopping short of entering
   real personal/identity data, to see firsthand how each presents the
   "don't have an account yet" path, and whether any of them differ from
   TradersPost's separate-step pattern.
2. **Email Alpaca support directly** (support@alpaca.markets) with a purely
   informational question — not a Connect app submission — asking: (a) does
   the OAuth authorize screen ever offer inline signup for a new user, or
   is a separate account-creation step always required first, and (b) is
   KYC approval for that signup typically fast enough to complete in one
   sitting. This has no legal-doc requirement and no 30-day wait; it's just
   a question.

**Update 3 — confirmed: it's a real "Connect" button, not an API-key
paste.** Checked exactly how TradersPost's connect step works
mechanically, per their own docs
(docs.traderspost.io/docs/core-concepts/brokers-connections): *"click
Connect Broker... you will be redirected to the chosen broker and asked to
log in and authorize TradersPost to access your account... redirected back
to TradersPost and your broker account will be connected."* No API Key
ID/Secret Key field, no copy-paste — this is the standard OAuth
click-to-approve pattern (the same shape as "Sign in with Google"), which
matches Alpaca's own OAuth docs verbatim: the user only sees a consent
screen and clicks approve; the authorization code exchange happens
server-side on the partner's backend and the customer never handles a raw
API key/secret. Good for the product: it's the polished, trusted
connection pattern, not an intimidating "paste your API key" step — which
also would have been a worse security posture (storing customers' raw
trading credentials) had that been how it worked.

### Risk 2: Alpaca doesn't have "Vanguard 2065"-style funds — RESOLVED, better than expected

Confirmed from Alpaca's asset-class schema: Alpaca trades US equities,
ETFs, options, crypto, treasuries/corporate bonds, and IPO allocations. **No
mutual fund asset class exists.** Vanguard/Fidelity/Schwab target-date
funds (VFORX, FDKLX, etc.) are open-end mutual funds — not listed on an
exchange, not orderable through Alpaca, full stop.

But we don't need the ETF-basket workaround this section originally
proposed. **We queried Alpaca's live asset list (14,274 active US
equities) directly and found a real, purpose-built target-date ETF family
that's already tradable: BlackRock's iShares LifePath Target Date ETFs.**
It uses the exact same "pick your retirement year" convention as Vanguard's
mutual funds — a vintage every 5 years from 2030 to 2070, plus a
"Retirement" fund for anyone already there:

| Symbol | Fund | Fractionable |
|---|---|---|
| IRTR | iShares LifePath Retirement ETF | No |
| ITDB | iShares LifePath Target Date 2030 ETF | **Yes** |
| ITDC | iShares LifePath Target Date 2035 ETF | No |
| ITDD | iShares LifePath Target Date 2040 ETF | **Yes** |
| ITDE | iShares LifePath Target Date 2045 ETF | No |
| ITDF | iShares LifePath Target Date 2050 ETF | No |
| ITDG | iShares LifePath Target Date 2055 ETF | No |
| ITDH | iShares LifePath Target Date 2060 ETF | No |
| ITDI | iShares LifePath Target Date 2065 ETF | No |
| ITDJ | iShares LifePath Target Date 2070 ETF | No |

All confirmed `tradable: true`, `status: "active"` on ARCA as of
2026-09-15. Full raw data in [API_TEST_LOG.md](API_TEST_LOG.md) Session 2.

**Built and live-tested this session**: a `FundsModule` that resolves any
retirement year to the nearest vintage (`GET
/funds/target-date?year=2056` → `ITDG`, the 2055 fund), falling back to
`IRTR` for years at or before 2030 and capping at `ITDJ` for years beyond
2070. Then fed that resolved symbol straight into the existing order
endpoint: **bought 1 share of ITDG on the paper account, confirmed it
filled at $42.38, confirmed the resulting position.** This is the client's
own example (retiring in ~30 years → year 2056) working end-to-end, live,
not simulated. Full request/response trail in API_TEST_LOG.md.

**Two caveats, not blockers:**
- **Fractionability is inconsistent.** Only the 2030 and 2040 vintages
  currently allow fractional-share orders on Alpaca; the rest require
  whole-share purchases. For a product taking recurring dollar-amount
  contributions (e.g., "$50/month"), this matters for the 7 non-fractional
  vintages — either round down to whole shares (leaving uninvested cash) or
  accumulate cash until a full share is affordable. Worth deciding
  explicitly rather than discovering it in production. Alpaca could add
  fractionability to more of these over time; this should be re-checked
  before a real build, not assumed permanent.
- **This is our own choice of proxy fund family, not Alpaca's or the
  client's endorsement of iShares specifically.** If there's a preference
  for a different provider's target-date ETFs (State Street, Schwab, etc.),
  the same `/v2/assets` query approach finds them — this was just the
  first credible, complete match found.

---

## Proposed milestone plan

Framed as you said you're comfortable with — milestone-based, each one a
go/no-go checkpoint rather than a committed multi-week build.

**Milestone 0 — De-risk the two unknowns above.**
Status: trading mechanics — done. Risk 2 (fund mapping) — done, resolved
better than expected (see above). Risk 1 (OAuth for new customers) —
**blocked, not done**: Alpaca's own approval process requires a
mostly-built product (real website, Terms of Use, Privacy Policy,
screenshots of the live app) and takes ~30 business days, so it can't be
validated within POC scope as-is. Decision made this session: don't submit
placeholder legal docs to get past that gate; leave it open and revisit
once there's an actual product to submit for review, or once you've talked
to Alpaca directly about whether self-testing unlocks sooner than full
public approval.

**Milestone 1 — OAuth connect + account association. BLOCKED on Risk 1.**
Build the actual "pop out to Alpaca, come back, associate the resulting
Alpaca account_id with our user record" flow end-to-end. The endpoints
(`/oauth/login`, `/oauth/callback`) are already built and tested for
mechanics; what's missing is Alpaca-issued `client_id`/`client_secret`,
which requires the compliance submission this session chose not to make
yet. Can't meaningfully proceed until that's resolved one way or another.

**Milestone 2 — Retirement-year → fund mapping engine. DONE.**
User picks a year, app resolves it to a specific real, tradable ETF
(iShares LifePath Target Date family), independent of any Alpaca call.
Built and live-tested this session — see Risk 2 above and
API_TEST_LOG.md Session 2. This milestone is complete; nothing further
needed here unless the fund-family choice changes.

**Milestone 3 — Funding-status visibility.**
Since Alpaca owns funding entirely, our job is just to reflect it. Trading
API has no push/webhook mechanism (that's Broker-API-only via SSE) so this
is polling `GET /v2/account` (cash/equity/buying_power) on the connected
OAuth token to detect when a user has actually funded their account, and
reflecting that state in our app (e.g., "waiting for your first deposit" →
"funded, ready to invest").

**Milestone 4 — Auto-invest on funding + post-trade record-keeping.**
When funding is detected, place the mapped trade(s) via the OAuth token
(building on the order-placement code already proven this session), and
persist orders/positions in our own database so the app has its own
system-of-record view, not just a live pass-through to Alpaca.

**Milestone 5 — Recurring contributions.**
Alpaca has no native recurring-transfer object even for Broker API, so if
"set it and forget it" recurring contributions are part of the product
(as opposed to Alpaca handling the deposit and us just reacting to it), that
piece is ours to build regardless — likely a reminder/nudge to the user
rather than an automated pull, since we have no funding API access at all
under this scope. Worth a direct conversation with you on what "recurring
contribution" means in a world where Alpaca owns funding 100% — do we ever
initiate a transfer, or only ever react to one the user initiated
themselves inside Alpaca's own UI?

---

## One thing to align on before Milestone 1 starts

"Recurring contributions" in your original ask implied our app manages
that cadence. But you've now said funding is completely Alpaca's — if
that's still true, recurring contributions likely means the user sets up
their own recurring transfer *inside Alpaca's UI* (outside our app
entirely), and our app's job is just to notice it happened and re-invest
per the mapping. If instead you want our app to ever *initiate* a transfer
on the user's behalf, that pulls Broker API back into scope, which you've
ruled out. Worth confirming which one you mean before Milestone 5 is
scoped for real.
