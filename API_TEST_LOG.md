# Alpaca Trading API — Raw Request/Response Log

Live smoke test run against a real Alpaca **paper trading** account via this
repo's NestJS backend (`localhost:3000` → proxied to
`https://paper-api.alpaca.markets`), on **2026-09-15**. Account:
`PA3J93N4D9PG`. This is the raw evidence backing the "What we proved"
section of [FINDINGS.md](FINDINGS.md) — every response below is unedited
except for pretty-printing.

---

## 1. Get account status

**Request**
```
GET http://localhost:3000/trading/account
```

**Response**
```json
{
  "id": "f6eadbe0-2ef0-4d3d-974c-df8f4fc63bd6",
  "admin_configurations": {},
  "user_configurations": null,
  "account_number": "PA3J93N4D9PG",
  "status": "ACTIVE",
  "crypto_status": "ACTIVE",
  "options_approved_level": 3,
  "options_trading_level": 3,
  "currency": "USD",
  "buying_power": "400000",
  "regt_buying_power": "200000",
  "effective_buying_power": "400000",
  "non_marginable_buying_power": "100000",
  "options_buying_power": "100000",
  "cash": "100000",
  "accrued_fees": "0",
  "portfolio_value": "100000",
  "trading_blocked": false,
  "transfers_blocked": false,
  "account_blocked": false,
  "created_at": "2026-09-15T16:16:58.821492Z",
  "trade_suspended_by_user": false,
  "multiplier": "4",
  "shorting_enabled": true,
  "equity": "100000",
  "last_equity": "100000",
  "long_market_value": "0",
  "short_market_value": "0",
  "position_market_value": "0",
  "initial_margin": "0",
  "maintenance_margin": "0",
  "last_maintenance_margin": "0",
  "sma": "0",
  "balance_asof": "2026-09-14",
  "crypto_tier": 0,
  "intraday_adjustments": "0",
  "pending_reg_taf_fees": "0"
}
```

**Takeaway:** confirms our backend authenticates correctly against Alpaca
Trading API and reads live account state — default paper account seeded
with $100,000 cash/equity, fully `ACTIVE`, nothing blocked.

---

## 2. Place a market order (buy 1 share AAPL)

**Request**
```
POST http://localhost:3000/trading/orders
Content-Type: application/json

{"symbol":"AAPL","qty":"1","side":"buy"}
```

**Response**
```json
{
  "id": "cf8f8e43-4a36-42da-af5f-983e0c726d34",
  "client_order_id": "23153aff-5b4c-477d-b686-528db48613cc",
  "created_at": "2026-09-15T16:20:35.29220537Z",
  "updated_at": "2026-09-15T16:20:35.310243297Z",
  "submitted_at": "2026-09-15T16:20:35.29220537Z",
  "filled_at": null,
  "expired_at": null,
  "canceled_at": null,
  "failed_at": null,
  "replaced_at": null,
  "replaced_by": null,
  "replaces": null,
  "asset_id": "b0b6dd9d-8b9b-48a9-ba46-b9d54906e415",
  "symbol": "AAPL",
  "asset_class": "us_equity",
  "notional": null,
  "qty": "1",
  "filled_qty": "0",
  "filled_avg_price": null,
  "order_class": "",
  "order_type": "market",
  "type": "market",
  "side": "buy",
  "position_intent": "buy_to_open",
  "time_in_force": "day",
  "limit_price": null,
  "stop_price": null,
  "status": "pending_new",
  "extended_hours": false,
  "legs": null,
  "trail_percent": null,
  "trail_price": null,
  "hwm": null,
  "subtag": null,
  "source": null,
  "expires_at": "2026-09-15T20:00:00Z"
}
```

**Takeaway:** order accepted immediately (`pending_new`); our
`TradingService.placeOrder` defaults (`type: market`, `time_in_force: day`)
applied as expected since the request body only specified `symbol`, `qty`,
`side`.

---

## 3. Retrieve the order by id (after a few seconds)

**Request**
```
GET http://localhost:3000/trading/orders/cf8f8e43-4a36-42da-af5f-983e0c726d34
```

**Response**
```json
{
  "id": "cf8f8e43-4a36-42da-af5f-983e0c726d34",
  "client_order_id": "23153aff-5b4c-477d-b686-528db48613cc",
  "created_at": "2026-09-15T16:20:35.29220537Z",
  "updated_at": "2026-09-15T16:20:36.028259861Z",
  "submitted_at": "2026-09-15T16:20:35.313259061Z",
  "filled_at": "2026-09-15T16:20:36.026665173Z",
  "expired_at": null,
  "canceled_at": null,
  "failed_at": null,
  "replaced_at": null,
  "replaced_by": null,
  "replaces": null,
  "asset_id": "b0b6dd9d-8b9b-48a9-ba46-b9d54906e415",
  "symbol": "AAPL",
  "asset_class": "us_equity",
  "notional": null,
  "qty": "1",
  "filled_qty": "1",
  "filled_avg_price": "330.41",
  "order_class": "",
  "order_type": "market",
  "type": "market",
  "side": "buy",
  "position_intent": "buy_to_open",
  "time_in_force": "day",
  "limit_price": null,
  "stop_price": null,
  "status": "filled",
  "extended_hours": false,
  "legs": null,
  "trail_percent": null,
  "trail_price": null,
  "hwm": null,
  "subtag": null,
  "source": null,
  "expires_at": "2026-09-15T20:00:00Z"
}
```

**Takeaway:** order transitioned `pending_new` → `filled` within ~1 second,
`filled_qty: "1"` at `filled_avg_price: "330.41"`.

---

## 4. Retrieve positions

**Request**
```
GET http://localhost:3000/trading/positions
```

**Response**
```json
[
  {
    "asset_id": "b0b6dd9d-8b9b-48a9-ba46-b9d54906e415",
    "symbol": "AAPL",
    "exchange": "NASDAQ",
    "asset_class": "us_equity",
    "asset_marginable": true,
    "qty": "1",
    "qty_available": "1",
    "avg_entry_price": "330.41",
    "side": "long",
    "market_value": "330.4",
    "cost_basis": "330.41",
    "unrealized_pl": "-0.01",
    "unrealized_plpc": "-0.00003",
    "unrealized_intraday_pl": "-0.01",
    "unrealized_intraday_plpc": "-0.00003",
    "current_price": "330.4",
    "lastday_price": "333.08",
    "change_today": "-0.00805"
  }
]
```

**Takeaway:** the filled order produced exactly one open position, 1 share
AAPL long, cost basis matching the fill price — confirms order → position
flow is consistent end-to-end.

---

## Summary

| # | Call | Result |
|---|---|---|
| 1 | `GET /trading/account` | `ACTIVE`, $100,000 cash/equity |
| 2 | `POST /trading/orders` (1 AAPL, buy, market) | Order created, `pending_new` |
| 3 | `GET /trading/orders/:id` | `filled` @ $330.41 |
| 4 | `GET /trading/positions` | 1 share AAPL long, matches fill |

All four calls round-tripped through our NestJS backend to Alpaca's live
paper trading environment with no errors. This is the complete evidence
trail for the initial trading-mechanics smoke test — see
[FINDINGS.md](FINDINGS.md) for why account-opening and funding were not
similarly testable (Broker API required, ruled out of scope).

---

## Session 2 (2026-09-15): Target-date fund asset discovery + mapped trade

Client's actual product ask (relayed after the above): resolve a
retirement year to a matching target-date fund and trade it. Alpaca has no
mutual fund asset class (see PROPOSAL.md Risk 2), so we queried Alpaca's
live asset list for a tradable equivalent.

### 5. Full asset list query

**Request**
```
GET https://paper-api.alpaca.markets/v2/assets?status=active&asset_class=us_equity
```

**Result:** 14,274 active US equity assets returned. Filtering `name` for
`target`/`20\d\d`/`lifepath`/`retirement` (case-insensitive) surfaced a
complete, real target-date ETF family — BlackRock's iShares LifePath
Target Date suite — all confirmed `tradable: true`, `status: "active"`,
exchange `ARCA`:

| Symbol | Name | Fractionable | Marginable |
|---|---|---|---|
| IRTR | iShares LifePath Retirement ETF | false | true |
| ITDB | iShares LifePath Target Date 2030 ETF | **true** | true |
| ITDC | iShares LifePath Target Date 2035 ETF | false | true |
| ITDD | iShares LifePath Target Date 2040 ETF | **true** | true |
| ITDE | iShares LifePath Target Date 2045 ETF | false | true |
| ITDF | iShares LifePath Target Date 2050 ETF | false | true |
| ITDG | iShares LifePath Target Date 2055 ETF | false | true |
| ITDH | iShares LifePath Target Date 2060 ETF | false | true |
| ITDI | iShares LifePath Target Date 2065 ETF | false | true |
| ITDJ | iShares LifePath Target Date 2070 ETF | false | true |

Only the 2030 and 2040 vintages are currently `fractionable`; the rest
require whole-share orders on Alpaca as of this date.

### 6. Year → fund resolution (our mapping logic, no Alpaca call)

```
GET http://localhost:3000/funds/target-date?year=2056
```
```json
{"vintage":2055,"symbol":"ITDG","name":"iShares LifePath Target Date 2055 ETF","fractionable":false,"requestedYear":2056}
```

Also verified: `year=2065` → exact match `ITDI`; `year=2027` → below the
earliest vintage, correctly falls back to `IRTR` (retirement fund);
`year=2090` → beyond the furthest vintage, correctly caps at `ITDJ` (2070).

### 7. Place the mapped trade

**Request**
```
POST http://localhost:3000/trading/orders
Content-Type: application/json

{"symbol":"ITDG","qty":"1","side":"buy"}
```

**Response**
```json
{
  "id": "72e2e6d8-3093-435f-8c40-bce9dcc70287",
  "symbol": "ITDG",
  "qty": "1",
  "filled_qty": "0",
  "status": "pending_new",
  "type": "market",
  "side": "buy"
}
```
(fields trimmed for readability — full response includes the same shape as
Session 1)

### 8. Confirm fill + position

**Request:** `GET /trading/orders/72e2e6d8-3093-435f-8c40-bce9dcc70287`
**Response (trimmed):**
```json
{
  "id": "72e2e6d8-3093-435f-8c40-bce9dcc70287",
  "symbol": "ITDG",
  "status": "filled",
  "filled_qty": "1",
  "filled_avg_price": "42.38"
}
```

**Request:** `GET /trading/positions/ITDG`
**Response:**
```json
{
  "asset_id": "a7619658-a11e-457e-ba52-3a1782d3a444",
  "symbol": "ITDG",
  "exchange": "ARCA",
  "asset_class": "us_equity",
  "qty": "1",
  "avg_entry_price": "42.38",
  "side": "long",
  "market_value": "42.3625",
  "current_price": "42.3625"
}
```

### Session 2 summary

| # | Call | Result |
|---|---|---|
| 5 | `GET /v2/assets` (direct to Alpaca) | Found 10 real tradable target-date ETFs (IRTR + ITDB–ITDJ) |
| 6 | `GET /funds/target-date?year=2056` | Resolved to `ITDG` (2055 vintage) — our own logic, no Alpaca call |
| 7 | `POST /trading/orders` (ITDG, buy 1) | Order created, `pending_new` |
| 8 | `GET /trading/orders/:id` → `GET /trading/positions/ITDG` | `filled` @ $42.38; position confirmed |

**This proves the full pipeline the client described**: user states a
retirement year → app resolves it to a real, tradable fund → app places
the trade → app reads back the confirmed order and position. All against a
live Alpaca paper account, no Broker API involved. See PROPOSAL.md "Risk 2"
for the write-up and remaining caveats (fractionability, "creativity"
needed only in the edge-year fallback logic, not in the core mapping).
