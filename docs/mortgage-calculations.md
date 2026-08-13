# Mortgage and Home-Equity Calculation Methodology

## Purpose and source

This document is a faithful, calculation-only transcription of `oro-equity-comparison-tool.html`, supplied as the client reference. It captures the input flow, constants, formulas, projections, comparison metrics, and recommendation scoring. It intentionally excludes the source page's visual styling and marketing copy.

Treat this as the canonical source for the current prototype. These are illustrative comparison estimates, not lender underwriting, legal advice, or financial advice. Do not add lender-specific rules unless the client supplies them.

## 1. Inputs and fallback values

The page reads six numeric inputs on every recalculation:

| Symbol | Input | Default in source | Unit |
| --- | --- | ---: | --- |
| `hv` | Home value | 750,000 | dollars |
| `mb` | Mortgage balance | 350,000 | dollars |
| `cr` | Current mortgage rate | 4.5 | annual percent |
| `yl` | Years remaining | 22 | years |
| `cn` | Cash needed | 100,000 | dollars |
| `age` | Homeowner age | 55 | years |

The source parses each field as a number and uses `value || default`. Therefore a blank, zero, or other falsy value falls back to the default. Preserve this behavior only when matching the prototype; a production implementation should validate inputs explicitly and document any changed zero-value behavior.

## 2. Shared constants and notation

- Annual home appreciation: `3%`; annual growth factor: `1.03`.
- Cash-out refinance: `7.25%` fixed, new term `30 years` (`n30 = 360` months).
- HELOC: `8.5%` variable, interest-only monthly estimate.
- HELOAN: `8.0%` fixed, `15 years` (`hlN = 180` months).
- Reverse mortgage: `7.5%` accruing, available only at age 62 or older.
- `round(x)` means JavaScript `Math.round(x)` at the same points used by the source.
- `E0 = hv - mb` is current home equity.
- Annual rate `R` becomes a monthly decimal rate `r = R / 100 / 12`.

For a fully amortizing loan, the source uses:

```text
payment(L, r, n) = L × r × (1 + r)^n / ((1 + r)^n - 1)
```

`L` is principal, `r` is the monthly decimal rate, and `n` is the number of monthly payments.

## 3. Existing mortgage and refinance setup

```text
newLoan = mb + cn
refiRateMonthly = 7.25 / 100 / 12
refiPI = payment(newLoan, refiRateMonthly, 360)

oldRateMonthly = cr / 100 / 12
oldMonths = yl × 12
oldPI = oldMonths > 0 ? payment(mb, oldRateMonthly, oldMonths) : 0
```

The refinance monthly impact is the new payment minus the old payment, represented as a negative outflow below.

## 4. Product formulas

All `cashNet` values are dollars delivered to the homeowner after the source's modeled discount or closing cost. All `monthly` values use the sign convention: positive = income, negative = payment.

### HELOC

```text
helocCC = round(min(cn × 0.02, 3,000))
helocMonthly = cn × (8.5 / 100 / 12)
monthly = -round(helocMonthly)
cashNet = cn - helocCC
cost10 = round(helocMonthly × 120 + helocCC)
equityAt(y) = round(E0 - cn × max(0, 1 - y / 15) + hv × (1.03^y - 1))
```

The prototype describes a 10-year draw and 15-year repayment, but its monthly estimate is interest-only and its equity formula reduces the borrowed amount linearly over 15 years. Do not substitute an amortization schedule without an explicit model decision.

### HELOAN

```text
heloanCC = round(min(cn × 0.025, 3,500))
heloanRateMonthly = 8.0 / 100 / 12
heloanPI = payment(cn, heloanRateMonthly, 180)
monthly = -round(heloanPI)
cashNet = cn - heloanCC
cost10 = round(heloanPI × 120 + heloanCC)
equityAt(y) = round(E0 - cn × max(0, 1 - y / 15) + hv × (1.03^y - 1))
```

As with HELOC, the prototype uses a linear principal reduction for equity projections instead of the amortization schedule used for the payment.

### Cash-out refinance

```text
refiCC = round(min(newLoan × 0.025, 8,000))
monthly = -round(refiPI - oldPI)
cashNet = cn - refiCC
cost10 = round((refiPI - oldPI) × 120 + refiCC)

remainingBalance(y) = newLoan × ((1 + refiRateMonthly)^360 -
  (1 + refiRateMonthly)^(12y)) /
  ((1 + refiRateMonthly)^360 - 1)

equityAt(y) = round(hv × 1.03^y - remainingBalance(y))
```

This replaces the existing mortgage with the new loan and uses the amortizing remaining-balance formula for the projection.

### Reverse mortgage

```text
eligible = age >= 62
PLF = eligible ? min(0.60, 0.30 + (age - 62) × 0.015) : 0
reverseAmount = eligible ? min(cn, E0 × PLF × 0.95) : 0
reverseCC = eligible ? round(reverseAmount × 0.04) : 0

monthly = eligible ? round(reverseAmount × 0.005) : 0
cashNet = eligible ? min(reverseAmount, cn) - reverseCC : 0
cost10 = eligible ? round(reverseAmount × (1.075^10 - 1)) : null

equityAt(y) = eligible
  ? max(0, round(E0 - reverseAmount × 1.075^y + hv × (1.03^y - 1)))
  : E0
```

The source labels the positive monthly amount as income. Ineligible reverse mortgage results receive a recommendation score of `-99` and display no cash, cost, or monthly result.

### Home equity investment (HEI)

```text
heiShare = 0.15
heiDiscount = 0.88
monthly = 0
cashNet = round(cn × heiDiscount)
cashCC = round(cn × 0.03)
cost10 = round(hv × 1.03^10 × heiShare - hv × heiShare)
equityAt(y) = round(hv × 1.03^y × (1 - heiShare) - mb)
```

The source describes the 12% reduction as an investor risk premium plus fees and separately displays a 3% cash cost. Preserve both values as separate fields.

### Co-ownership

```text
coShare = min(cn / hv, 0.49)
coDiscount = 0.90
monthly = 0
cashNet = round(cn × coDiscount)
cashCC = round(cn × 0.02)
cost10 = round(hv × 1.03^10 × coShare - hv × coShare)
equityAt(y) = round(hv × 1.03^y × (1 - coShare) - mb)
```

### Sale leaseback

```text
salePrice = round(hv × 0.875)
saleNet = salePrice - mb
rent = round(hv × 0.005)
cashCC = round(hv × 0.02)
cashNet = saleNet - cashCC
monthly = -rent
cost10 = round(rent × 120)
equityAt(y) = 0
```

The source treats this as no longer owning the home, so `keepTitle = false`, appreciation share is `None`, and projected equity is zero.

## 5. Guided recommendation flow

The guided flow asks four questions in order:

1. Goal: `lump`, `income`, `lower`, or `faster`.
2. Long-term stay: `yes`, `prob`, `open`, or `soon`.
3. Can handle a payment: `yes`, `min`, or `no`.
4. Priority: `cost`, `cash`, `equity`, or `simple`.

Start every product score at zero. Apply all matching adjustments below, then set reverse mortgage to `-99` when ineligible. Sort scores descending and return the top three products.

| Answer | Score adjustments |
| --- | --- |
| `q2 = soon` | Sale leaseback `+3`; co-ownership `+2` |
| `q2 = yes` or `prob` | Sale leaseback `-3`; co-ownership `-1` |
| `q3 = no` | Reverse `+3`; HEI `+3`; co-ownership `+2`; sale leaseback `+1`; HELOC/HELOAN/refi `-2` each |
| `q3 = min` | HEI `+1`; reverse `+1`; HELOC `+1` |
| `q3 = yes` | HELOC/HELOAN/refi `+2` each |
| `q1 = lump` | HELOAN/HEI `+2` each; HELOC/refi/sale leaseback `+1` each |
| `q1 = income` | Reverse `+3`; HELOC `+1` |
| `q1 = lower` | Refi `+3`; HELOC `-1` |
| `q1 = faster` | Refi `+2` |
| `q4 = cost` | HELOC/HELOAN `+2` each; reverse/HEI `-1` each |
| `q4 = cash` | Sale leaseback `+2`; reverse/refi `+1` each |
| `q4 = equity` | HELOC/HELOAN/refi `+1` each; HEI `-2`; co-ownership `-2`; sale leaseback `-3` |
| `q4 = simple` | Refi `+1`; HELOAN `+1` |

## 6. Comparison and chart metrics

- Cost at 5 years: `round(cost10 / 2)`.
- Cost at 10 years: `cost10`.
- Equity views use `equityAt(5)`, `equityAt(10)`, and `equityAt(15)`.
- Chart years: `[0, 1, 2, 3, 5, 7, 10, 15, 20]`.
- Cash chart: `round((cashNet + equityAt(y)) / 1,000)`; label `Net cash + equity ($K)`.
- Equity chart: `max(0, round(equityAt(y) / 1,000))`; label `Equity ($K)`.
- Cumulative-cost chart: `round((abs(monthly) × y × 12 + cashCC) / 1,000)`; label `Cumulative cost ($K)`.
- Monthly-impact chart: `round(abs(monthly))`; label `Monthly ($)`.

Ineligible products return `null` for chart data and show unavailable comparison values.

## 7. Implementation guardrails

- Keep annual rates, monthly rates, years, months, dollars, and percentages explicit in names and documentation.
- Keep pure formulas testable independently from formatting (`$`, `K`, and `M`) and UI state.
- Round only where the source rounds; do not round intermediate values unless a new client-approved rule says so.
- If a formula, constant, score, eligibility rule, or projection assumption changes, update this document and its consuming skill in the same change.
