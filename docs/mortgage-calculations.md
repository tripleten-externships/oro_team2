# Mortgage and Home-Equity Calculation Methodology

## Purpose and source

This document is the canonical calculation model for Oro's corrected prototype. It started as a transcription of `oro-equity-comparison-tool.html`, supplied as the client reference, and records deliberate corrections that make the model internally coherent. It intentionally excludes the source page's visual styling and marketing copy.

Treat this as the canonical source for the current prototype. These are illustrative comparison estimates, not lender underwriting, APR disclosures, HECM calculations, legal advice, or financial advice. Rates, fees, discounts, appreciation and product formulas are Oro assumptions unless explicitly marked as standard amortization math.

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

The corrected implementation applies defaults only when a field is absent. Numeric strings are accepted from forms and localStorage. Blank strings, non-numeric values, infinities and invalid negatives are rejected instead of silently falling back to defaults. A zero interest rate is valid and is handled explicitly.

The prototype also applies a `$100,000,000` home-value sanity cap before calculation. This keeps illustrative projections and displayed metrics within a useful range; it is a product-input guardrail, not an underwriting or lender limit.

## 2. Shared constants and notation

- Annual home appreciation: `3%`; annual growth factor: `1.03`.
- Cash-out refinance: `7.25%` fixed, new term `30 years` (`n30 = 360` months).
- HELOC: `8.5%` representative rate, interest-only for a `10-year` draw period followed by a `15-year` amortizing repayment period. The rate is held constant for this illustration; real HELOC rates can change.
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

When `r = 0`, use `payment(L, 0, n) = L / n`.

For a fully amortizing balance after `k` payments:

```text
balance(L, r, n, k) = L × ((1 + r)^n - (1 + r)^k) / ((1 + r)^n - 1)
```

At `r = 0`, use `L × (1 - k / n)`, clamped to zero after the final payment.

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
helocRateMonthly = 8.5 / 100 / 12
drawMonths = 10 × 12
repaymentMonths = 15 × 12

balanceAtMonths(m) =
  m <= drawMonths ? cn : balance(cn, helocRateMonthly, repaymentMonths, m - drawMonths)

monthlyAtMonths(m) =
  m < drawMonths
    ? cn × helocRateMonthly
    : payment(cn, helocRateMonthly, repaymentMonths)

cashNet = max(0, cn - helocCC)
monthlyAt(y) = -round(monthlyAtMonths(y × 12))
costAt(y) = helocCC +
  cn × helocRateMonthly × min(y × 12, drawMonths) +
  payment(cn, helocRateMonthly, repaymentMonths) ×
    min(max(0, y × 12 - drawMonths), repaymentMonths)
equityAt(y) = round(E0 - balanceAtMonths(y × 12) + hv × (1.03^y - 1))
```

This is still an Oro illustration: it assumes the full requested amount is drawn at the beginning and the representative rate never changes. The phases are explicit so the balance and payment no longer contradict the product description.

### HELOAN

```text
heloanCC = round(min(cn × 0.025, 3,500))
heloanRateMonthly = 8.0 / 100 / 12
heloanPI = payment(cn, heloanRateMonthly, 180)
monthly = -round(heloanPI)
cashNet = max(0, cn - heloanCC)
costAt(y) = heloanCC + heloanPI × min(y × 12, 180)
equityAt(y) = round(E0 - balance(cn, heloanRateMonthly, 180, y × 12)
  + hv × (1.03^y - 1))
```

The equity projection now uses the same amortization schedule as the payment.

### Cash-out refinance

```text
refiCC = round(min(newLoan × 0.025, 8,000))
monthly = -round(refiPI - oldPI)
cashNet = max(0, cn - refiCC)
costAt(y) = max(0, refiCC + (refiPI - oldPI) × min(y × 12, 360))

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
reverseAmount = eligible ? min(cn, max(0, E0) × PLF × 0.95) : 0
reverseCC = eligible ? round(reverseAmount × 0.04) : 0

monthly = eligible ? round(reverseAmount × 0.005) : 0
cashNet = eligible ? max(0, reverseAmount - reverseCC) : 0
costAt(y) = eligible ? reverseCC + reverseAmount × (1.075^y - 1) : null

equityAt(y) = eligible
  ? round(E0 - reverseAmount × 1.075^y + hv × (1.03^y - 1))
  : E0
```

The corrected formula uses `max(0, E0)` when calculating `reverseAmount`. The positive monthly amount remains an Oro illustrative income heuristic, not the HECM mortgage insurance formula. Ineligible reverse mortgage results receive a recommendation score of `-99` and display no cash, cost, or monthly result.

### Home equity investment (HEI)

```text
heiShare = 0.15
heiDiscount = 0.88
monthly = 0
cashCC = round(cn × 0.03)
cashNet = max(0, round(cn × heiDiscount) - cashCC)
costAt(y) = cashCC + hv × 1.03^y × heiShare - hv × heiShare
equityAt(y) = round(hv × 1.03^y × (1 - heiShare) - mb)
```

The source describes the 12% reduction as an investor risk premium plus fees and separately displays a 3% cash cost. Preserve both values as separate fields.

### Co-ownership

```text
coShare = min(cn / hv, 0.49)
coDiscount = 0.90
monthly = 0
cashCC = round(cn × 0.02)
cashNet = max(0, round(cn × coDiscount) - cashCC)
costAt(y) = cashCC + hv × 1.03^y × coShare - hv × coShare
equityAt(y) = round(hv × 1.03^y × (1 - coShare) - mb)
```

### Sale leaseback

```text
salePrice = round(hv × 0.875)
saleNet = salePrice - mb
rent = round(hv × 0.005)
cashCC = round(hv × 0.02)
cashNet = max(0, saleNet - cashCC)
monthly = -rent
costAt(y) = round(rent × y × 12)
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

- Cost at 5 years: `round(costAt(5))`, using the product's actual 60-month model.
- Cost at 10 years: `round(costAt(10))`.
- Equity views use `equityAt(5)`, `equityAt(10)`, and `equityAt(15)`.
- Chart years: `[0, 1, 2, 3, 5, 7, 10, 15, 20]`.
- Cash chart: `round((cashNet + equityAt(y)) / 1,000)`; label `Net cash + equity ($K)`.
- Equity chart: `round(equityAt(y) / 1,000)`; label `Equity ($K)`. Negative equity remains visible.
- Cumulative-cost chart: `round(costAt(y) / 1,000)`; label `Modeled cumulative cost ($K)`.
- Monthly-impact chart: `round(monthlyAt(y))`; label `Monthly impact ($)`, preserving income and payment signs.

Ineligible products return `null` for chart data and show unavailable comparison values.

## 7. Implementation guardrails

- Keep annual rates, monthly rates, years, months, dollars, and percentages explicit in names and documentation.
- Keep pure formulas testable independently from formatting (`$`, `K`, and `M`) and UI state.
- Round only at documented display and result boundaries; do not round intermediate balances or payment calculations.
- `cashNet` means estimated cash actually received after the model's separate cash cost or closing cost.
- Modeled costs and cash proceeds are never exposed as negative values; monthly impact and equity retain their documented signs.
- Modeled costs combine product-specific outflows and are not APR, finance charge, total of payments, or a lender quote.
- If a formula, constant, score, eligibility rule, or projection assumption changes, update this document and its consuming skill in the same change.
