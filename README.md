# Alpaca POC

NestJS backend for a POC scoping whether Alpaca's Trading API can power a
target-date-fund investing app: customer account opening via Alpaca OAuth,
funding fully owned by Alpaca, and fund selection/trading through our app.

- **Start here:** [POC_REPORT.md](POC_REPORT.md) — the consolidated
  findings report: what's proven live, what's still open, and why.
- **Full technical write-up:** [PROPOSAL.md](PROPOSAL.md) — milestone plan
  and detailed research/evidence trail behind the report.
- **Raw evidence:** [API_TEST_LOG.md](API_TEST_LOG.md) — actual request/
  response bodies from every live API call made during this POC.
- **Original scoping research:** [FINDINGS.md](FINDINGS.md) — why a fully
  custom, in-app onboarding/funding experience would require Broker API
  (out of scope), in case that's ever revisited.
- **Project context / how to work in this repo:** [CLAUDE.md](CLAUDE.md)

## Quick start

```bash
npm install
cp .env.example .env   # fill in ALPACA_TRADING_KEY_ID / ALPACA_TRADING_SECRET_KEY
npm run start:dev
```

Then see the "Manual smoke test" section in [CLAUDE.md](CLAUDE.md) for the
curl commands that place a paper trade and retrieve the order/position.
