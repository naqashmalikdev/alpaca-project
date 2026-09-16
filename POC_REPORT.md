# Alpaca Trading API POC — Findings Report

**Revised 2026-09-16** after client review. The previous version of this
report blended "confirmed from documentation," "inferred from a partner's
own description of their integration," and "directly tested" together
under language like "the architecture works," which read as more validated
than what was actually done. This version corrects that: every claim below
is labeled by exactly how we know it, and the two questions this POC was
actually meant to answer are addressed first and most rigorously — not the
trading demo, which was a secondary, easier-to-prove piece.

## Verification key

Every claim in this report is tagged with one of:

- **TESTED** — we personally ran this against live Alpaca infrastructure
  this POC and observed the result ourselves.
- **DOCS** — stated directly in Alpaca's own official documentation, which
  we read; not run by us.
- **INFERRED (partner)** — a real Alpaca Connect partner's own public
  description of their own integration, which we read secondhand; not
  something we clicked through ourselves, and not an Alpaca statement
  about the platform generally.
- **UNVERIFIED** — a gap: not tested, not documented anywhere we found,
  or an assumption/hypothesis we made that hasn't been checked against
  Alpaca or a partner example.

## The two questions this POC was meant to answer

1. Can a customer start in our app, go through an Alpaca-provided
   account-opening flow, and have that Alpaca account connected back to
   our application?
2. Can that customer fund the account and establish recurring
   contributions through an Alpaca-provided customer-facing flow, with our
   app able to tell when funds are available?

**Neither question was directly tested end-to-end.** Below is exactly what
was and wasn't done for each, and why.

## Direct answers

For each question: is it live-tested or blocked, would it actually work if
the blocker were resolved, and where's the proof. Full evidence and
reasoning for each line is in the detailed sections further down.

### Q1: Account opening (OAuth pop-out and connect)

- **Tested live, or blocked?** Blocked. **Zero live executions.** We never
  obtained Alpaca OAuth app credentials, so `/oauth/login` and
  `/oauth/callback` have never run against Alpaca's servers — not once,
  not even the simple case of an existing account clicking "Authorize."
- **If the blocker (Alpaca's ~30-business-day app approval) is resolved,
  will this actually work?** The core connection mechanism — very likely
  yes. This is Alpaca's standard, mature OAuth product, used today by
  multiple real, live partner apps (TradingView, TradersPost, and others
  listed in Alpaca's own Connect directory), so the plumbing itself is
  low-risk. What's *less* certain even after the blocker clears: whether a
  brand-new customer experiences this as one smooth "pop out and come
  back" hop, or two separate steps with an unconfirmed wait in between for
  identity verification (that's what TradersPost's own documentation
  suggests happens for their integration). So: the connection will
  probably work; the exact UX shape and timing needs the live test to
  confirm.
- **Proof of testing:** None exists, because none was performed. There is
  no request/response log for this in API_TEST_LOG.md, and there
  shouldn't be one yet — that would misrepresent untested code as tested.
  What we do have is Alpaca's own documentation (cited inline in the
  Question 1 table below) and TradersPost's public description of their
  own integration (also cited) — evidence *about* the flow, not proof we
  ran it.

### Q2: Funding + recurring contributions

- **Tested live, or blocked?** Blocked — **by a different blocker than
  Question 1, not the OAuth one.** `GET /v2/account` was called live and
  returned real data (see API_TEST_LOG.md), but against our own
  already-funded paper account, so that only proves the endpoint works,
  not that our app can detect a real funding event. What's actually
  blocking this test is needing a **live, identity-verified, funded**
  Alpaca account to observe a real deposit against — that's testable with
  our own direct API key, the same way we already tested paper trading,
  and doesn't require Alpaca's OAuth/Connect app approval at all.
- **If that blocker (a live, funded account) is resolved, will this
  actually work?** Split answer:
  - **"App can tell when funds are available"** — very likely yes, but
    only via polling. Trading API has no push/webhook mechanism for this
    (that's exclusive to Broker API, out of scope), so our app would need
    to periodically call `GET /v2/account` and check the balance, not get
    notified instantly. This is a low-risk, well-understood pattern, just
    not real-time. Note this doesn't need OAuth either — only once we want
    to do this for a customer's account rather than our own does the
    OAuth connection from Question 1 become relevant.
  - **"Customer can establish recurring contributions through an
    Alpaca-provided flow"** — genuinely uncertain, and getting a live
    funded account would **not** automatically answer this either. It
    depends on a separate fact we haven't confirmed: whether Alpaca's own
    consumer app even offers a recurring-deposit feature to end customers
    at all. Public documentation search found no evidence it exists (see
    Question 2 below) — but that's based on reading support articles, not
    on logging into a real Alpaca account and checking.
- **Proof of testing:** One real API call exists
  (`GET /v2/account` → live response, in API_TEST_LOG.md), but it proves
  the endpoint works, not that funding detection or recurring
  contributions work. No test exists for either of those because both are
  currently blocked or unconfirmed as described above.

---

## Question 1: Account opening

| Claim | Status |
|---|---|
| Alpaca OAuth ("Connect") is a click-to-approve consent flow — user clicks "Authorize," never sees/copies an API key | **DOCS** — docs.alpaca.markets/docs/using-oauth2-and-trading-api |
| Our backend's `/oauth/login` → `/oauth/callback` code correctly builds the authorize URL and would exchange a code for a token | **UNVERIFIED** — the code was written to match Alpaca's documented spec but has never executed against real Alpaca infrastructure. We do not have a Client ID/Secret (see below), so this endpoint has never been run, not once, against Alpaca's servers. This is the single most important gap: **the OAuth flow itself is completely untested by us.** |
| Registering an OAuth app requires Alpaca's manual compliance review, with a public app website, Terms of Use, Privacy Policy, screenshots of the live OAuth screen, and ~30 business days to "go live" | **DOCS** — we personally opened Alpaca's Connect application form and read the requirements and FAQ directly; we did not submit it |
| A new customer creates their Alpaca account on Alpaca's own signup page as a step separate from the OAuth consent screen, then returns to connect | **INFERRED (partner)** — this is what TradersPost, a real Alpaca Connect partner, states about *their own* integration on their own documentation site. We read this; we did not click through TradersPost's actual signup flow ourselves, and no other partner was checked for this specific claim. This is one partner's account of their own product, not an Alpaca statement about how the platform behaves for every integration. |
| Whether the OAuth authorize screen itself ever offers an inline "sign up" option for a user with no Alpaca account (vs. requiring account creation first, unconditionally) | **UNVERIFIED** — we never loaded the actual authorize screen as an unauthenticated new user (we have no approved app to generate a valid authorize URL with), so we have not seen this screen with our own eyes in any state |
| How long identity verification/KYC takes for a self-directed new signup — minutes, hours, or days | **UNVERIFIED** — not stated anywhere in Alpaca's documentation that we found, and not something we could test (would require actually completing a real signup) |
| That a connected account can be reliably associated back to a specific user record in our app (i.e., the token → account_id linkage actually works as expected in practice) | **UNVERIFIED** — this depends on completing a real OAuth token exchange, which has never happened |

**Bottom line on Question 1: not proven.** We know what the flow is
*supposed* to look like, from Alpaca's documentation and one partner's
description of their own integration. We have not run it, not once, with
real Alpaca infrastructure — not even the basic consent-click mechanics
with an account that already exists, let alone the new-customer path. The
reason is a real, external blocker (Alpaca's compliance review requires a
built product and takes ~30 business days), not a technical failure — but
that doesn't make it tested. It isn't.

---

## Question 2: Funding + recurring contributions

| Claim | Status |
|---|---|
| Trading API (with or without OAuth) has no ACH/wire/deposit/transfer endpoints at all | **DOCS** — confirmed by reading Alpaca's full documentation index; funding-related endpoints (ACH relationships, transfers, journals) are documented exclusively under Broker API, which is out of scope |
| OAuth's available scopes (`trading`, `data`, `account:write`) contain nothing funding-related | **DOCS** — docs.alpaca.markets/docs/using-oauth2-and-trading-api scope table |
| No native "recurring transfer" object exists anywhere in Alpaca's API, even under Broker API | **DOCS** — confirmed by reading Alpaca's funding, ACH, journals, and FAQ documentation; absence confirmed across every funding-related page, not assumed |
| What a live account actually requires to open (US: 18+, valid SSN, US residential address, citizen/permanent resident/valid visa; non-US: uploaded documents + selfie), and that funding is a separate step after signup, not part of it | **DOCS** — `alpaca.markets/support/requirements-alpaca-brokerage-account` |
| How long live-account identity verification actually takes | **UNVERIFIED** — checked Alpaca's requirements page and their dedicated "check your application status" article specifically for this; neither states a timeframe (not minutes, hours, or days). Only actually starting the live signup would reveal whether their UI shows an estimate, which hasn't been done. |
| `GET /v2/account` returns cash/equity/buying_power fields that would reflect a funding event if one occurred | **TESTED** — we called this endpoint live and got real values back, but against our own **already-funded** paper account (it starts with $100,000 by default). **We never funded an account ourselves and watched this endpoint change** — we only confirmed the field exists and returns a number, not that it correctly reflects a real funding event over time |
| Our app can practically detect a funding event by polling this endpoint | **UNVERIFIED** — never tested; no funding event was ever triggered or observed during this POC |
| Alpaca's own consumer app has no "recurring deposit" / "recurring investment" feature documented anywhere | **DOCS — read, not tested.** We read Alpaca's public support center (`alpaca.markets/support`, all articles under "Individuals" and specifically the funding/transfers tag) and their marketing site. Every funding article covers one-time ACH/wire transfers only; nothing describes a recurring/automatic deposit or auto-invest feature. **We did not log into any Alpaca account's dashboard and look for this ourselves — this is based on reading their public help articles and marketing pages, not on using the product.** Treat this as "not found in what Alpaca publishes," not a confirmed "does not exist" — their blog wasn't checked, and a logged-in dashboard could show something support articles don't mention. |
| What Alpaca's actual funding UI (bank linking, deposit screen) looks like for a real customer | **UNVERIFIED.** Paper accounts get simulated funding with no real bank-linking step, so this can't be seen there. Seeing the real thing needs a **live** Alpaca account, which requires actual identity verification (KYC) with no confirmed timeline — a real cost, not a quick check. Not attempted this POC. |
| "Recurring contributions probably means the customer sets it up inside Alpaca's own UI, and our app just reacts to it" | **UNVERIFIED — our own hypothesis, not sourced from any documentation or partner example.** This was our inference based on process of elimination (Alpaca has no API for it, and funding is stated to be Alpaca's responsibility) — and is now further undercut by the finding above, since there's no evidence Alpaca's own UI even *has* a recurring-deposit setting for the customer to use. Needs to be checked directly with Alpaca before being treated as true. |
| Our app detecting a real funding event and reacting to it (the actual second half of the client's question) | **BLOCKED — but by a live, KYC'd account, not by the OAuth blocker from Question 1.** This test doesn't need OAuth at all: it only needs a **live** Alpaca account (ours or anyone's, via our own direct API key, same mechanism already proven for paper trading), taken through real identity verification and an actual deposit, then polled to watch the balance change. That's a separate blocker from Question 1's Connect-app approval — it's about needing a live/funded account to observe, not about needing our app approved to connect one. OAuth only becomes relevant for the narrower case of proving this same mechanism works against a *third-party customer's* account specifically, rather than our own — a smaller, later concern once the core mechanism is already confirmed. |

**Bottom line on Question 2: not proven.** Two things are now clear from
reading Alpaca's documentation (not from testing): Trading API itself has
no funding capability at all (unambiguous), and there's no sign Alpaca's
own consumer app offers recurring deposits as a feature at all (less
certain — based on public docs only, not on logging into a real account).
Both are useful to know, but neither is the same as testing the actual
question: whether our app can detect and react to a customer funding their
account and contributing recurringly. That part is blocked by needing a
live, identity-verified, actually-funded Alpaca account to observe —
**not** by Question 1's OAuth approval blocker, which is a different,
unrelated blocker. The two questions have two separate blockers; they
don't compound on this piece.

---

## What was tested (secondary — this was not the main uncertainty)

Trading mechanics and the target-date-fund mapping were the easiest parts
to validate, since they only need Trading API keys we already had — no
Alpaca approval required. They're real and working, but they don't answer
either of the two questions above, and were correctly called out by the
client as not the main point of this POC.

- **TESTED**: placed a real market order (1 share AAPL) on a live Alpaca
  paper account, confirmed the fill, confirmed the resulting position.
- **TESTED**: queried Alpaca's live asset list, found a real tradable
  target-date ETF family (iShares LifePath, 2030–2070 + Retirement fund),
  built year→fund mapping logic, and placed a real trade through it
  (2056 → ITDG, filled @ $42.38, position confirmed).

Full raw request/response logs for both: [API_TEST_LOG.md](API_TEST_LOG.md).

---

## What would actually close out Questions 1 and 2

1. **Question 1** requires either: (a) building enough of a real product
   (website, Terms of Use, Privacy Policy) to submit Alpaca's OAuth app
   review and waiting ~30 business days, or (b) a direct answer from
   Alpaca about faster self-testing access, or (c) personally clicking
   through a live partner app's (e.g. TradersPost) real account-connection
   flow as an outside user to observe the actual screens firsthand
   (stopping short of submitting real personal/identity data) — none of
   which has been done yet.
2. **Question 2** requires researching how a real partner app (e.g.
   TradersPost, or another Connect partner) actually surfaces funding
   status and handles recurring contributions in their own product — this
   research was not done and is the more significant gap of the two.

---

## Repo guide

- **[PROPOSAL.md](PROPOSAL.md)** — full technical write-up and research
  citations.
- **[API_TEST_LOG.md](API_TEST_LOG.md)** — raw request/response logs for
  every live API call made (trading and fund-mapping only — see above for
  why account-opening/funding have no equivalent log).
- **[FINDINGS.md](FINDINGS.md)** — original scoping research on why a
  fully custom, in-app onboarding/funding experience would require Broker
  API (out of scope).
- **[CLAUDE.md](CLAUDE.md)** — engineering context for continuing this
  codebase.
- **`src/`** — the working NestJS backend: `trading/` (tested),
  `funds/` (tested), `oauth/` (written to spec, never executed — see
  Question 1 above).
