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
| `GET /v2/account` returns cash/equity/buying_power fields that would reflect a funding event if one occurred | **TESTED** — we called this endpoint live and got real values back, but against our own **already-funded** paper account (it starts with $100,000 by default). **We never funded an account ourselves and watched this endpoint change** — we only confirmed the field exists and returns a number, not that it correctly reflects a real funding event over time |
| Our app can practically detect a funding event by polling this endpoint | **UNVERIFIED** — never tested; no funding event was ever triggered or observed during this POC |
| What Alpaca's own consumer-facing funding UI/flow actually looks like, or whether it supports "recurring deposits" for individual retail users at all | **UNVERIFIED** — we never looked at this. We did not research any partner's funding-status handling either (unlike account opening, where we at least checked one partner). This is a real gap in this POC, not just an open question. |
| "Recurring contributions probably means the customer sets it up inside Alpaca's own UI, and our app just reacts to it" | **UNVERIFIED — our own hypothesis, not sourced from any documentation or partner example.** This was our inference based on process of elimination (Alpaca has no API for it, and funding is stated to be Alpaca's responsibility), not a confirmed fact. It needs to be checked against Alpaca directly or a partner's real product before being treated as true. |

**Bottom line on Question 2: not proven, and less researched than
Question 1.** We're confident Trading API has no funding capability
(that's well-documented and unambiguous), which does answer part of the
question — but "the customer can fund and set up recurring contributions
through an Alpaca-provided flow, with our app able to tell when funds are
available" was never observed, tested, or even researched via a partner
example. The most honest summary: Alpaca almost certainly doesn't own
"recurring contributions" as a first-class feature at all (no such object
exists anywhere in their API), which itself is useful to know, but exactly
how a partner app is supposed to detect and react to funding in practice
was not established this POC.

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
