import { Injectable } from '@nestjs/common';

export interface FundVintage {
  /** Target retirement year this ETF is built for, or 'retirement' for already-retired. */
  vintage: number | 'retirement';
  symbol: string;
  name: string;
  fractionable: boolean;
}

/**
 * Real, tradable target-date ETFs confirmed against Alpaca's live
 * `GET /v2/assets` (paper) on 2026-09-15 — all `tradable: true`,
 * `status: "active"`, exchange ARCA. See FINDINGS.md "Risk 2" for the raw
 * data. Alpaca does not support literal mutual funds (e.g. Vanguard's
 * VFORX) — this is the closest real equivalent: BlackRock's iShares
 * LifePath Target Date ETF suite, which already uses the same "pick your
 * retirement year" naming convention the product is asking for.
 *
 * Re-verify this list periodically — Alpaca's asset roster and iShares'
 * fund lineup can both change.
 */
const VINTAGES: FundVintage[] = [
  {
    vintage: 2030,
    symbol: 'ITDB',
    name: 'iShares LifePath Target Date 2030 ETF',
    fractionable: true,
  },
  {
    vintage: 2035,
    symbol: 'ITDC',
    name: 'iShares LifePath Target Date 2035 ETF',
    fractionable: false,
  },
  {
    vintage: 2040,
    symbol: 'ITDD',
    name: 'iShares LifePath Target Date 2040 ETF',
    fractionable: true,
  },
  {
    vintage: 2045,
    symbol: 'ITDE',
    name: 'iShares LifePath Target Date 2045 ETF',
    fractionable: false,
  },
  {
    vintage: 2050,
    symbol: 'ITDF',
    name: 'iShares LifePath Target Date 2050 ETF',
    fractionable: false,
  },
  {
    vintage: 2055,
    symbol: 'ITDG',
    name: 'iShares LifePath Target Date 2055 ETF',
    fractionable: false,
  },
  {
    vintage: 2060,
    symbol: 'ITDH',
    name: 'iShares LifePath Target Date 2060 ETF',
    fractionable: false,
  },
  {
    vintage: 2065,
    symbol: 'ITDI',
    name: 'iShares LifePath Target Date 2065 ETF',
    fractionable: false,
  },
  {
    vintage: 2070,
    symbol: 'ITDJ',
    name: 'iShares LifePath Target Date 2070 ETF',
    fractionable: false,
  },
];

const RETIREMENT_FUND: FundVintage = {
  vintage: 'retirement',
  symbol: 'IRTR',
  name: 'iShares LifePath Retirement ETF',
  fractionable: false,
};

export interface FundMatch extends FundVintage {
  requestedYear: number;
}

@Injectable()
export class FundMappingService {
  resolve(requestedYear: number): FundMatch {
    if (requestedYear <= (VINTAGES[0].vintage as number)) {
      return { ...RETIREMENT_FUND, requestedYear };
    }

    const nearest = VINTAGES.reduce((closest, candidate) =>
      Math.abs((candidate.vintage as number) - requestedYear) <
      Math.abs((closest.vintage as number) - requestedYear)
        ? candidate
        : closest,
    );
    return { ...nearest, requestedYear };
  }

  listVintages(): FundVintage[] {
    return [RETIREMENT_FUND, ...VINTAGES];
  }
}
