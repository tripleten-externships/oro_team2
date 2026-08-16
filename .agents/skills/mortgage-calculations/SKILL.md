---
name: mortgage-calculations
description: "Implement, review, test, or explain Oro mortgage and home-equity calculations using the canonical formulas and assumptions in docs/mortgage-calculations.md. Use before changing financial logic, recommendation scoring, projections, comparison values, or related UI."
---

# Mortgage calculations

`AGENTS.md` is the repository contract and has priority over this skill. Before touching financial logic, read `docs/mortgage-calculations.md` completely. It is the canonical corrected Oro prototype model based on the client HTML; do not replace its documented assumptions with generic mortgage advice or undocumented lender rules.

## Rules

- Keep the calculation model separate from React rendering and formatting.
- Use named functions with explicit units. Convert annual percentage rates to decimal monthly rates before amortization.
- Preserve the documented constants, rounding, eligibility rules, product formulas, projection horizon, and recommendation scores unless the user explicitly asks for a model change.
- Do not silently “fix” a prototype simplification. Record any proposed change, update the canonical document first, then update consumers and tests together.
- Keep the corrected model's explicit zero-rate branch, amortized balances, HELOC draw/repayment phases, signed projections, product-specific modeled costs, and non-negative cash proceeds/costs.
- Keep signs consistent: positive monthly values are income, negative values are payments/costs.
- Validate inputs and handle malformed or missing values safely. Never let `NaN`, infinity, or negative loan amounts reach the UI.
- Label projections as illustrative; these formulas are not lender underwriting, APR disclosures, HECM calculations, or financial advice.
- For UI files, use lowercase BEM names: `oro-mortgage-form.jsx`, `oro-mortgage-form.css`, and `oro-mortgage-form__field.jsx`. Use kebab-case for pure calculation modules, docs, and font assets; BEM applies only to UI blocks, elements, and modifiers.

## Workflow

1. Read `AGENTS.md` and `docs/mortgage-calculations.md`.
2. State the affected formulas, inputs, outputs, and edge cases before editing.
3. Implement pure calculation functions before wiring them to components.
4. Add or update deterministic cases for defaults, age 62 eligibility, ineligible reverse mortgage, zero/invalid inputs, and each product.
5. Verify the result with `npm run lint` and `npm run build`, and report assumptions or limitations.

When a component displays these values, also follow `.agents/skills/oro-component-workflow/SKILL.md` and never duplicate formula constants in JSX or CSS.
