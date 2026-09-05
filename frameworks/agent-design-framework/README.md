# Agent Design Framework

A two-tier methodology for designing AI agents. It answers the first question that determines whether an agent will succeed: *how much rigor does this agent actually need?*

Over-engineering a simple agent wastes effort and slows iteration. Under-engineering a critical agent produces something that is confidently wrong at the worst moment. The framework makes that trade-off an explicit, up-front decision rather than an accident.

---

## The Problem It Solves

Not every agent deserves the same construction process. A quick internal helper that reformats text and a compliance agent that produces audit evidence sit at opposite ends of a rigor spectrum. Treating them the same way is the core mistake: the helper gets buried under unnecessary specification, and the compliance agent gets shipped without the guardrails it needed.

The framework separates agents into two tiers with different construction processes, and gives clear criteria for choosing between them.

---

## The Two Tiers

### Tier 1 — Vibe Coding (Fast Task Agents)

For agents whose scope is narrow, whose output is easy to verify, and whose failure cost is low.

- **Design process:** lightweight. Define the task, the input, the expected output, and the one or two tools needed. Write a focused system prompt and iterate by trying it.
- **Optimized for:** speed of creation and iteration.
- **Typical uses:** formatting and transformation helpers, single-purpose lookups, draft generators, internal convenience agents.
- **Guardrails:** minimal — the human reviewing the output is the safety net, and that is acceptable because the output is easy to check and cheap to get wrong.

### Tier 2 — Spec-Driven (Rigorous Multi-Phase Agents)

For agents whose scope is broad, whose output is hard to verify, or whose failure cost is high.

- **Design process:** a written specification precedes construction. It defines the agent's identity and scope, its phases of operation, its decision logic, its knowledge base, its tools, its refusal conditions, and how its output is validated.
- **Optimized for:** correctness, consistency, and auditability.
- **Typical uses:** security operations agents, compliance and audit agents, anything that produces evidence, makes recommendations with real consequences, or operates with limited human review.
- **Guardrails:** built in — explicit scope boundaries, refusal conditions for out-of-scope or unsupported requests, and a validation step on output.

---

## Choosing a Tier

The decision rests on three questions:

| Question | Leans Tier 1 | Leans Tier 2 |
|:---|:---|:---|
| How broad is the scope? | Narrow, single task | Broad, multi-domain |
| How verifiable is the output? | Easy to eyeball | Hard to verify, or unreviewed |
| What is the cost of being wrong? | Low, easily corrected | High, consequential |

If any answer lands firmly in the Tier 2 column, build it as Tier 2. Rigor tracks the cost of failure, not the size of the agent.

```
New agent needed
      |
      v
Is scope broad, output hard to verify, OR failure cost high?
      |                                 |
     no                                yes
      |                                 |
      v                                 v
  Tier 1: Vibe Coding             Tier 2: Spec-Driven
  (define -> prompt -> iterate)   (specify -> build -> validate)
```

---

## The Design Process in Detail

### Separating Design From Execution
A deliberate principle of the framework: the agent that *designs* another agent is not the agent that *runs* the workload. Design is a distinct phase with its own output (a specification or a working prompt), reviewed before anything is deployed. This separation is what makes agent construction repeatable rather than improvised.

### Prompt Engineering Approach
- Give the agent a clear identity and a bounded scope in the first lines of its instructions.
- Prefer explaining *why* a rule exists over stacking absolute directives — a capable model follows rationale more reliably than a wall of "always/never."
- State refusal conditions explicitly for Tier 2 agents, so the agent declines gracefully instead of fabricating.

### Tool Selection
Give an agent the fewest tools that cover its task. Every additional tool widens the surface for error and makes behavior harder to predict. Tools are added when a concrete step in the agent's process requires them, not speculatively.

### Testing
- **Tier 1:** try representative inputs, confirm the output, iterate.
- **Tier 2:** build evaluation cases from the specification — including out-of-scope inputs that should trigger refusal — and run them before deployment and after each change.

---

## Why This Framework Exists

The single most expensive agent-building mistake is applying the wrong amount of process. This framework makes the rigor level a conscious, criteria-based decision at the very start, so effort is spent where failure actually costs something and iteration stays fast where it does not.

---

*Part of the [SwooshJ-SecAI](https://github.com/SwooshJ-SecAI) portfolio. Built with Amazon Quick.*
