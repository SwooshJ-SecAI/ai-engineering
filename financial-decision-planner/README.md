# Financial Decision Planner

A private, self-contained personal financial planning web application. Runs entirely in the browser with on-device storage — no backend, no network calls, no accounts. Open `index.html` and it works.

All demonstration data is **synthetic** and clearly labelled as such.

## Features

- **Overview** — net income, free cash flow, savings rate, emergency-fund months, debt-to-income, net worth, budget utilization, top variances, goal progress, and borrowing-readiness status at a glance.
- **Budget** — income plus fixed, variable, debt, savings, and sinking-fund categories; monthly/weekly views. Monthly surplus = net income − expenses − debt − planned savings. Available credit is never counted as income.
- **Transactions & Variance** — budget-vs-actual by category with configurable green/amber/red/critical thresholds; duplicate, unusual, recurring, and uncategorized flags.
- **Reconciliation** — a review queue with confidence scores; nothing becomes official until approved.
- **Goals** — required monthly contribution, weekly equivalent, gap, projected completion, and income/expense/deadline levers.
- **Borrowing Readiness** — one loan engine for mortgage, auto, personal, and student loans. Each type carries its own costs and the correct sustainability lens (DTI, cash-flow impact, max affordable amount).
- **Scenario Lab** — an immutable baseline with adjustable levers; compares scenarios on cash flow, DTI, reserves, goals, and affordability.
- **Recommendation Center** — a quantitative engine that scans ten financial areas and produces up to five ranked, traceable recommendations with a priority score, effort rating, dollarized "cost of doing nothing," and milestone framing. Includes a data-quality gate that withholds definitive advice on weak data.
- **Simple / Advanced modes** — a plain-language "Home" (health verdict, money in/out/left, one "do this next" card, guided walkthrough) with user-configurable status thresholds, plus the full nine-view detail behind a toggle.
- **Grounded assistant** — answers only from stored data, shows its math, and separates verified values from estimates.

## Design principles

- **Private by default** — data stays on the device; nothing is published or shared.
- **Verified vs. estimate** — every figure is labelled; estimates are never presented as guaranteed lending, tax, legal, or investment advice.
- **Traceable** — each recommendation shows its formula, inputs, assumptions, and what would invalidate it.
- **Confirm before change** — any action that alters verified data requires explicit confirmation, and an audit trail is kept.

## Usage

Open `index.html` in any modern browser. The app self-seeds a synthetic demonstration profile on first load. Use **Reset synthetic dataset** in Settings to start over.

`architecture.html` is a system-model diagram of how data flows from inputs through the calculation and recommendation engines to the dual-mode presentation.

## Files

- `index.html` — the complete self-contained application (all logic inlined).
- `architecture.html` — architecture map.
- `app.js`, `ui.js`, `reco.js`, `reco_ui.js`, `simple.js`, `borrowing.js` — module sources (inlined into `index.html`; included for readability).

## Note on document processing

The Document Review screen is a disabled placeholder marked "External integration required." No OCR or document ingestion is performed; it demonstrates the review workflow only.

## License

MIT
