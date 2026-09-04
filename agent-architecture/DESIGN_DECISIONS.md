# Agent Architecture — Design Decisions

This document explains the methodology behind designing agents rather than just building them — the two-tier design framework, the separation of agent design from agent execution, the dashboard automation tier-classification system, and the trade-offs involved.

---

## The Two-Tier Agent Design Methodology

The central idea is that not all agents should be built the same way. Agents fall into two tiers, and choosing the right tier for a use case is the first and most important design decision.

### Tier 1: Vibe Coding — fast task agents

Some agents exist to do a bounded, well-understood task. For these, heavy upfront specification is wasted effort. The Vibe Coding tier optimizes for speed: define the task, give the agent the tools and context it needs, and iterate quickly. These agents are cheap to build, easy to change, and appropriate when the task is clear and the cost of a wrong answer is low.

### Tier 2: Spec-Driven — rigorous agents

Other agents govern high-stakes, multi-phase workflows where correctness and auditability matter — compliance auditing, evidence handling, anything where a wrong answer is expensive or where the process itself must be defensible. For these, the Spec-Driven tier applies upfront rigor: an explicit specification of phases, decision logic, validation criteria, and failure handling before the agent is built. The specification is the contract the agent must honor.

### Why two tiers instead of one standard

Applying spec-driven rigor to every agent would make simple task agents absurdly expensive to build. Applying vibe-coding speed to every agent would make high-stakes agents dangerously underspecified. The two-tier model matches the amount of design ceremony to the stakes of the task. The most common design error — and the one this methodology exists to prevent — is using the wrong tier: over-engineering a trivial agent or under-specifying a critical one.

### How the tier decision is made

The deciding questions are: How clear is the task? How expensive is a wrong answer? Does the process need to be auditable? A clear, low-stakes, non-auditable task is Vibe Coding. An ambiguous, high-stakes, or auditable workflow is Spec-Driven. Making this call explicitly, at the start, is the methodology's core discipline.

---

## Separating Agent Design From Agent Execution

A deliberate architectural choice is to treat *designing* an agent and *running* an agent as distinct activities with distinct tooling.

### The rationale

Design is about architecture: what the agent should do, how it should decide, what tools it needs, how it should be tested. Execution is about operation: the agent actually doing its job for a user. Conflating the two produces agents that are hard to reason about because their design intent is buried in their runtime behavior.

Separating them means an agent's design can be reviewed, critiqued, and improved as an artifact in its own right — before and independent of running it. The design becomes a durable, inspectable specification rather than something that only exists implicitly in a live agent. This is what makes the two-tier methodology usable: the Spec-Driven tier in particular depends on the design existing as a reviewable artifact separate from execution.

### The meta-agent pattern

This separation is embodied in a meta-agent whose job is to help design other agents. It does not execute the target agent's task — it produces the architecture, prompt structure, tool selection, and testing approach for it. Designing agents is itself a design problem worth its own dedicated tooling.

---

## Dashboard Automation Tier Classification

A concrete application of tiered thinking is the dashboard automation system, which classifies each dashboard build into a tier before executing the build.

### Why classify first

Dashboards vary enormously in complexity — from a simple single-source view to a multi-source, multi-audience analytical surface. Building every dashboard with the same heavyweight process wastes effort on simple ones; building every dashboard with a lightweight process fails the complex ones. Classifying the build into a tier up front — based on intake questions about data sources, audience, and complexity — routes each dashboard to an appropriately weighted build process.

### The intake-to-tier flow

The system asks structured intake questions, classifies the requirement into a tier based on the answers, and only then proceeds to layout design, component selection, and build automation. The classification is the hinge: it determines how much process the rest of the build applies. This mirrors the two-tier agent methodology — assess stakes and complexity first, then match the process to the assessment.

---

## Trade-offs

### Prescriptive templates vs. flexible design

A tiered methodology with defined processes provides structure and prevents the wrong-tier error, but structure can feel prescriptive to an experienced designer who already knows what a use case needs. The resolution is that the tiers guide the *amount* of rigor, not the *content* of the design. Within a tier, design decisions remain open. The methodology prescribes ceremony proportional to stakes, not the specific architecture — that stays a design judgment.

### Upfront design cost vs. downstream reliability

The Spec-Driven tier front-loads cost: writing a specification before building takes time that a vibe-coded agent skips. That cost buys downstream reliability and auditability. The trade-off is only worth it when the stakes justify it — which is exactly why the tier decision matters. Paying spec-driven cost for a vibe-coding task is pure waste; skipping it for a high-stakes task is a latent failure.

### Meta-tooling overhead vs. agent quality

Building tooling to design agents — rather than just building agents directly — is overhead. It pays off when enough agents are built that consistent, reviewable design becomes valuable. For a portfolio spanning dozens of agents, the meta-tooling earns its keep by making every agent's design inspectable and improvable; for a single agent it would be over-investment.

---

## Lessons Learned

### The wrong-tier error is the most common and most costly

The single most valuable outcome of the methodology is preventing the two symmetric mistakes: over-engineering simple agents and under-specifying critical ones. Both are common, both are expensive, and both are avoided by making the tier decision explicit and early. Naming the tiers turned an implicit, often-wrong judgment into a deliberate one.

### Design is more durable than execution

Treating an agent's design as a standalone artifact — reviewable independent of running it — produced better agents than designing implicitly through iteration on a live agent. The design artifact is what enables review, critique, and reuse. When design lives only inside a running agent, it cannot be improved deliberately.

### Classify before you build

The dashboard system's classify-first flow generalized into a broader lesson: assess the stakes and complexity of any build before choosing how much process to apply. The classification step feels like an extra gate, but it is what routes effort correctly. Skipping it defaults to a one-size process that is wrong for most cases.

### Match ceremony to stakes

The unifying principle across the two-tier methodology, the design/execution split, and the dashboard classifier is the same: the amount of rigor should be proportional to the cost of being wrong. More ceremony is not better; appropriate ceremony is better. This proportionality is the through-line of the whole architecture practice.
