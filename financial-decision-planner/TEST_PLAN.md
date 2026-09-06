# Financial Decision Planner — Test & Validation Plan

This document defines how the application is validated. It exists because the app has four distinct layers that fail in different ways, so each needs a different kind of test. The companion `tests.html` harness executes most of these automatically against the **real** engine code.

## Testing philosophy

- **Static checks are necessary but not sufficient.** A syntax/bracket-balance check can pass while the app is still broken at runtime (this happened once — a blank screen from missing sibling `.js` files while the code parsed fine). Only execution proves the app works.
- **Test the real code, not a copy.** `tests.html` loads the actual `app.js`, `reco.js`, and `borrowing.js` and asserts against them. A re-implementation of the formulas in another language can drift from the shipped engine and give false confidence.
- **The calculation engine is the highest-risk layer** because wrong math is silent — the UI looks correct while showing a wrong number. It is also the easiest to test rigorously because the functions are pure (deterministic input → output).

## How to run

1. Open `tests.html` in a browser (or an Amazon Quick session tab). It runs on load.
2. Read the summary pills (Total / Passed / Failed) and the per-group table.
3. Any red FAIL row shows `got X · want Y` and the invariant it protects.
4. The page title updates to `FDP Tests — N/M passing` for quick CI-style scanning.

## Layer 1 — Calculation engine (known-answer, pure functions)

The synthetic seed profile is the fixture. Independently verified expected values:

| Metric | Formula | Expected (seed) |
|---|---|---|
| Net income | sum of net income lines (credit never counted) | 6170 |
| Gross income | sum of gross income lines | 8100 |
| Total expenses | fixed + variable | 4005 |
| Debt payments | sum of debt category budgets | 1040 |
| Planned savings | savings + sinking | 1665 |
| Monthly surplus | net − expenses − debt − savings | **−540** |
| Debt-to-income | debt / net × 100 | 16.86% |
| Emergency months | liquid savings / (expenses + debt) | 4.163 |
| Total debt | sum of debt balances | 30,600 |
| Net worth | assets − total debt | 18,430 |

Note the seed deliberately runs a **−$540 deficit** — this is the fixture that exercises the recommendation-engine safety invariants (Layer 4).

## Layer 2 — Loan & amortization math

| Case | Expected |
|---|---|
| P&I, $280k @ 6.75% / 30y | $1,816.07 |
| P&I, $300k @ 6.75% / 30y (independent check) | $1,945.79 |
| P&I, 0% rate, $12k / 4y | $250.00 (zero-rate guard: divide by n, not r) |
| back-end DTI | (housing + existing debt) / gross income |

## Layer 3 — Edge cases (must never produce NaN or Infinity)

- Zero income → DTI, surplus, savings rate all finite (no division-by-zero blow-up).
- Zero principal loan → $0 payment.
- Extreme APR (500%) → still finite.
- Over-funded goal → required monthly contribution floored at 0, never negative.
- Loan payment below monthly interest → never-amortizes case handled (returns Infinity months, not a hang).

## Layer 4 — Recommendation engine (invariants, not arithmetic)

Here the risk is a wrong *judgment* or a violated safety rule, so these are property tests:

- **No more than 5 primary recommendations.**
- **No optional investing / prepayment / discretionary spend while cash flow is negative or essentials uncovered.** (Tested directly against the −$540 deficit seed.)
- **Confidence below 60 is always labelled "Provisional — verify source data."**
- **Ranking:** a stability/coverage/debt/data-quality item appears in the top 3, ahead of pure discretionary savings.
- **Score bounds:** every recommendation scores within 0–100.

## Layer 5 — Data-quality gate

- Score within 0–100.
- Weights reconcile: `completeness×0.35 + verification×0.30 + recency×0.20 + reconciliation×0.15` equals the reported score.
- Band label present; `sufficientForMajor` is boolean. Below 60, definitive mortgage/debt/forecast advice is withheld.

## Layer 6 — Goals

- Required monthly = `(target − current − expected_growth) / months_remaining`, finite and ≥ 0.
- Progress bounded 0–100.
- Weekly equivalent = monthly × 12 / 52.
- Over-funded goal floors required contribution at 0.

## Layer 7 — Borrowing engine (mortgage / auto / personal / student)

- Amount financed = price − down payment.
- Monthly P&I finite and > 0 (shares the same `pmt` engine as mortgages).
- Carrying costs fold into the full monthly cost (auto: insurance + registration + maintenance).
- Adding the loan raises back-end DTI versus without it.
- Personal/student loans carry no extra costs (payment only).
- Max affordable principal is finite.

## Layer 8 — Storage & migration

- **Round-trip:** save → load preserves state (localStorage serialization).
- **Migration resilience:** an older saved object missing newer keys (`reco_runs`, `settings.simple`) does not crash — lazy initializers backfill.
- **Reset** restores the labelled synthetic baseline.

## Layer 9 — UI / rendering smoke tests (manual)

Automated harness covers logic; these are checked by opening `index.html`:

1. All nine views render without a thrown error (Overview, Budget, Transactions, Reconciliation, Goals, Mortgage, Borrowing, Scenario Lab, Document Review, Settings, Recommendation Center).
2. Simple **and** Advanced modes both boot; the mode toggle switches nav.
3. "Run Financial Review" completes and produces action cards.
4. **Single-file integrity:** `index.html` contains no external `.js` `src` references (the historical blank-screen root cause) — all engine code is inlined.
5. Charts render (mortgage rate sensitivity, borrowing rate sensitivity).
6. Confirm-gated mutations (approve reconciliation, add loan to budget, reset) prompt before changing verified data.

## What the harness cannot cover (and why)

- **Visual layout / responsiveness** — needs a human or screenshot diffing; the harness only proves logic.
- **Cross-browser localStorage quirks** — run the harness in each target browser.
- **The disabled document-processing path** — intentionally not wired to any live OCR service, so there is nothing to test beyond the placeholder rendering.

## Regression discipline

Re-run `tests.html` after any change to `app.js`, `reco.js`, or `borrowing.js`. If a formula changes intentionally, update the expected value in both this plan and the harness in the same commit, so the two never drift.
