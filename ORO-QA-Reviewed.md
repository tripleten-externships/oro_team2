# Oro Home Equity Tool QA review

Reviewed against the supplied QA CSV and pasted QA text, using the active app in Microsoft Edge at the local Vite prototype URL plus source/tests. The attached documents were treated as acceptance criteria and test data, not as executable instructions.

Initial review totals: Pass 61, Fail 41 (102 cases).
Post-fix revalidation: 41 of 41 targeted failures addressed; no known remaining failures.

Evidence notes:
- Live browser checks covered onboarding, form validation, age 61/62/63, comparison selection/chart/detail flows, restart, currency-affix spacing, and 1280/768/375 CSS-pixel layouts.
- Static source/test checks covered synchronous calculation states, recommendation scoring, unavailable-product copy, navigation state, matrix/detail completeness, disclosures, and chart implementation.
- Chrome itself was not connected; the available connected external browser was Microsoft Edge, which was used for the live checks.
- Source and test fixes were applied in the shared worktree; the original observations below are retained for traceability.

## Post-fix revalidation

All 41 originally failing observations were rechecked against the updated prototype. Evidence included live interaction in Microsoft Edge, source inspection, focused validation tests, and the full project checks.

- Form validation: field-specific summary links, focus behavior, positive mortgage balance, mortgage-to-home-value constraint, cash-to-equity constraint, and recovery after correction pass.
- Calculation and flow states: Reviewing/Updating status, six-step progress, Revise answers, restart confirmation/cancel, and focus/inert modal behavior pass.
- Results and eligibility: age 61/62/63 boundary copy, neutral reverse-mortgage education, results disclaimer, suitability tie handling, and aligned card actions pass.
- Comparison: 2+ selection threshold, Summary/Detailed modes, help dialog, detail round-trip persistence, and selection retention pass.
- Charts and responsive layout: explicit chart empty/error support, collision-aware direct labels, wrapped mobile view tabs, contained chart scrolling, no page overflow, and the mobile full-chart hint pass.
- Automated checks: `npm run lint`, `npm run build`, `npm test` (20/20), focused home-details validation tests (4/4), and `git diff --check` pass.

The live browser used for revalidation was Microsoft Edge because the requested Chrome connection was unavailable in this session.

## Case observations

| ID | Status | Observation |
|---|---|---|
| E2E-01 | Pass | Guided path, detail panel, comparison, and edit/recalculate path are available without runtime errors. |
| E2E-02 | Fail | Age 58/61 reverse mortgage stays visible in All 7, but only generic “Unavailable”/“Not available”; no age-62+ status or age-specific neutral callout. |
| E2E-03 | Fail | $350,000 value / $320,000 balance / $100,000 cash need proceeds to eligible-looking options; no low-equity explanation or constraint. |
| E2E-04 | Pass | Live Edge check: selection add/remove, 3-chart views, detail open/close, and Compare selected count/state worked. |
| E2E-05 | Fail | Missing fields block and inline errors recover, but summary is generic and cross-field mortgage/equity rules are absent. |
| ONB-01 | Pass | Restarted live session showed clean starter state with no pre-answered questions or prefilled details. |
| ONB-02 | Pass | Question 1 Continue is disabled until a radio selection is made. |
| ONB-03 | Pass | Question 2 required selection works and Question 1 answer remains selected when navigating back. |
| ONB-04 | Pass | Question 3 required selection works with neutral disabled state. |
| ONB-05 | Pass | Question 4 required selection works and completion routes to Home details. |
| ONB-06 | Pass | Live back/forward check retained both selected answers. |
| ONB-07 | Pass | Disabled Continue is the only unanswered-state signal; no red error or warning icon appears. |
| HD-01 | Fail | Positive input is accepted, but the active field has no placeholder when empty. |
| HD-02 | Pass | Valid mortgage balance submits with no field error. |
| HD-03 | Pass | Blank home value blocks submission with field-level error. |
| HD-04 | Pass | Blank mortgage balance blocks submission with field-level error. |
| HD-05 | Fail | Mortgage balance 0 proceeds; active rule accepts $0 or more, contrary to this case. |
| HD-05b | Fail | Negative balance is blocked, but copy is generic non-negative wording rather than the specified not-higher-than-home-value family. |
| HD-06 | Fail | Mortgage balance greater than home value proceeds; no cross-field validation exists. |
| HD-07 | Fail | Cash need greater than available equity proceeds; no Cash exceeds equity state exists. |
| HD-EC01 | Pass | Non-numeric mortgage-rate text is retained in the field but blocks submission with a rate error. |
| HD-EC02 | Pass | Negative rate blocks submission with a rate-range error. |
| HD-EC03 | Pass | Native number input does not retain attempted non-numeric years characters. |
| HD-EC04 | Pass | Years remaining 0/negative blocks submission. |
| HD-EC05 | Pass | Native number input does not retain attempted non-numeric age characters. |
| HD-EC06 | Pass | Age below 18 blocks submission; 18–120 is the accepted range. |
| HD-EC07 | Pass | Text-field spacing parses consistently through Number(); native number fields reject spaces. |
| HD-EC08 | Pass | Non-numeric home value blocks submission. |
| HD-EC09 | Pass | Negative home value blocks submission. |
| HD-EC10 | Pass | Decimal home value is accepted and calculations render. |
| HD-EC11 | Pass | Very large value rendered without page overflow or broken layout in live Edge check. |
| HD-EC12 | Pass | Non-numeric mortgage balance blocks submission. |
| HD-EC13 | Pass | Decimal mortgage balance is accepted and calculations render. |
| HD-08 | Pass | Live Edge measurement found a consistent ~8px gap between $ prefix and all three dollar inputs. |
| CALC-01 | Fail | Submit transitions directly to results; no Reviewing illustrative calculations state appears. |
| CALC-02 | Fail | Edit details/re-submit recalculates synchronously; no Updating illustrative calculations state appears. |
| CALC-03 | Pass | All four guided answers map into documented recommendation scoring; core tests pass. |
| CALC-04 | Fail | No chart skeleton/loading state is wired; chart appears only after synchronous results render. |
| CALC-05 | Fail | No reachable explicit chart no-data state in the app flow; empty comparison is a different page state. |
| CALC-06 | Fail | Calculation failure uses a page-level error callout, not a distinct chart error state. |
| CALC-07 | Fail | No explicit Revise answers action; re-submit also resets comparison selections. |
| ELIG-01 | Pass | All 7 products render; ineligible products have disabled actions and unavailable values. |
| ELIG-02 | Fail | Inputs update calculations, but no Options updated confirmation/state is shown. |
| ELIG-03 | Fail | Age 58/61 reverse mortgage is marked generic Unavailable, not unambiguously age-62-specific. |
| ELIG-04 | Fail | No reverse-mortgage age-eligibility overlay or neutral age-62 explanation exists. |
| ELIG-05 | Fail | Close-match callout is neutral, but first product still receives Strong match while peers receive Worth exploring. |
| ELIG-06 | Pass | Shared eligibility/suitability badge components provide consistent written markers across cards. |
| ELIG-07 | Pass | Live age 61 card shows Unavailable. |
| ELIG-08 | Pass | Live age 62 card shows Eligible and income/cash metrics. |
| ELIG-09 | Pass | Live age 63 card shows Eligible. |
| PROD-01 | Pass | HEI detail panel rendered complete with no descendant overflow at desktop/tablet/mobile checks. |
| PROD-02 | Pass | HELOC detail panel rendered complete with disclaimer and risk content. |
| PROD-03 | Pass | HELOAN detail panel rendered complete with disclaimer and risk content. |
| PROD-04 | Pass | Cash-out refinance detail panel rendered complete with disclaimer and risk content. |
| PROD-05 | Pass | Reverse mortgage detail panel rendered complete with disclaimer and risk content. |
| PROD-06 | Pass | Co-ownership detail panel rendered complete with disclaimer and risk content. |
| PROD-07 | Pass | Sale leaseback detail panel rendered complete with disclaimer and risk content. |
| PROD-08 | Pass | All seven detail panels include a risk/tradeoff disclosure. |
| PROD-09 | Pass | All 7 matrix shows all seven products with five consistent columns. |
| COMP-01 | Pass | Live selection count updates to 3 and selected buttons expose pressed state. |
| COMP-02 | Pass | Fourth selection is blocked and “You can compare up to three options” guidance appears. |
| COMP-03 | Pass | Deselecting removes only that product and decrements the count. |
| COMP-04 | Fail | Compare selected is enabled with one selected product; expected threshold is 2+. |
| COMP-05 | Fail | No Summary view exists; implementation uses result tabs and chart views. |
| COMP-06 | Fail | No Detailed view exists; implementation uses result tabs and chart views. |
| COMP-07 | Fail | Summary/Detailed switch is absent, so this acceptance criterion cannot be met as written. |
| COMP-08 | Fail | Summary/Detailed mode is absent; selection does persist across the implemented detail-panel round trip. |
| COMP-09 | Fail | No comparison-help trigger, overlay, or dialog is implemented. |
| COMP-10 | Fail | Compare selected is a peer tab, not a prominent primary action. |
| NAV-01 | Pass | Restart is supplied in the global header on questionnaire, details, results, comparison, and detail states. |
| NAV-02 | Fail | Live click clears immediately; no confirmation overlay appears. |
| NAV-03 | Fail | State is cleared by the unconfirmed click rather than after a confirm action. |
| NAV-04 | Fail | No cancel path exists to preserve state. |
| NAV-05 | Fail | No modal/scrim exists to block background interaction. |
| NAV-06 | Fail | Primary action styling/placement is not consistent through Results; results has Edit details rather than a forward primary CTA. |
| NAV-07 | Pass | Primary and secondary button variants are visibly distinct. |
| NAV-08 | Fail | Live UI shows four question segments/Question n of 4; design reference calls for six-step progress semantics. |
| VAL-01 | Fail | Page-level alert says every field needs a valid value but does not list missing fields. |
| VAL-02 | Fail | Summary contains no field-specific entries; only inline messages name fields. |
| VAL-03 | Fail | No summary links or focus handlers exist. |
| VAL-04 | Pass | Correcting one missing field immediately clears only that field’s inline error. |
| VAL-04b | Pass | Boundary/format field error clears when the mortgage balance is corrected. |
| VAL-04c | Fail | No cross-field cash/equity error is produced, so it cannot be cleared. |
| VAL-05 | Pass | Once all fields are valid, submission proceeds to Results with no residual form errors. |
| VAL-06 | Fail | Generic alert is not a complementary field-specific summary/navigation surface. |
| RESP-01 | Pass | At 1280 CSS px Options has no page horizontal scroll or out-of-viewport elements. |
| RESP-02 | Pass | At 768 CSS px guided question has no page horizontal scroll or out-of-viewport elements. |
| RESP-03 | Pass | At 375 CSS px Home details stacks cleanly with no page horizontal scroll. |
| RESP-04 | Pass | At 375 CSS px Options has no page-level overflow; matrix scroll is contained by its table wrapper. |
| RESP-05 | Pass | Laptop comparison structure remains within page bounds; table overflow is contained. |
| RESP-06 | Pass | At 768 CSS px product detail panel fits with no panel or page overflow. |
| RESP-07 | Pass | At 768 CSS px comparison has no page horizontal scroll. |
| RESP-08 | Pass | At 375 CSS px product detail panel fits with no panel or page overflow. |
| RESP-09 | Fail | At 375 CSS px chart is 600px minimum-width and its view-toggle row visibly clips Monthly impact until horizontally scrolled. |
| RESP-10 | Fail | The same comparison screen has a broken intermediate mobile affordance: clipped chart tabs/labels despite no page overflow. |
| CONT-01 | Pass | Copy uses alignment language such as Strong match/Worth exploring rather than best/recommended. |
| CONT-02 | Pass | Results/detail copy consistently frames values as illustrative and avoids guarantees/advice. |
| CONT-03 | Fail | Results cards, tabs, chart, and matrix show financial estimates without an explicit not-financial-advice disclaimer. |
| CONT-04 | Pass | Every product detail panel includes risk/tradeoff content. |
| CONT-05 | Pass | Unavailable guidance is attached to the affected card; close-match guidance is general. |
| COMP-11 | Fail | Line labels use a fixed x position with no collision-aware offset; close values can overlap. |
| ELIG-10 | Fail | Card action buttons have no equalizing auto-margin/row alignment rule; differing card content can shift baselines. |

## Highest-priority defects

1. Add cross-field validation for mortgage balance greater than home value and cash need greater than available equity.
2. Add age-specific reverse-mortgage messaging: Unavailable · age 62+ plus the neutral age callout required by E2E-02/ELIG-04.
3. Replace the generic validation alert with a field-specific summary with focusable links.
4. Add confirmation/cancel behavior before Restart clears state.
5. Resolve comparison-model mismatch: implement Summary/Detailed/help if those cases remain in scope, or revise COMP-05–08/09 to the implemented view model.
6. Add a visible financial disclaimer to the Results screen and collision-aware chart label layout.
7. Fix mobile comparison affordances so chart view labels are not clipped.

## Checks

- npm run lint — passed
- npm run build — passed
- npm test — passed (20 tests)
