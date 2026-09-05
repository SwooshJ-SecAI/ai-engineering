# Frameworks

Reusable engineering frameworks that underpin the agents and tooling in this portfolio. Each framework is a documented methodology — not a single script — designed to be applied repeatedly across different problems, agents, and domains.

A framework earns its place here when it has been used to build more than one production artifact. The value is in the pattern, not any single instance of it.

---

## Collection

| Framework | Purpose |
|:---|:---|
| [Learning Agents Framework](./learning-agents-framework/) | Turns any subject or certification into a complete, structured learning package. Powers a fleet of subject-specific study agents. |
| [Agent Design Framework](./agent-design-framework/) | A two-tier methodology for designing AI agents — fast task agents versus rigorous spec-driven agents — with guidance on when each is appropriate. |
| [Universal Reasoning Framework](./universal-reasoning-framework/) | A first-principles analytical engine for deconstructing concepts, testing hypotheses, and validating evidence. Plugs into other frameworks as their reasoning layer. |
| [Architecture Map Design System](./architecture-map-design-system/) | The stakeholder-readable diagram design language used across every architecture map in this portfolio. |

---

## How These Fit Together

These frameworks are composable rather than isolated. The Universal Reasoning Framework supplies the analytical layer that the Learning Agents Framework uses to deconstruct a subject before teaching it. The Agent Design Framework governs how any new agent — including agents built on the Learning Agents Framework — is scoped and constructed. The Architecture Map Design System documents how all of the above are communicated visually.

```
Universal Reasoning Framework   ->  analytical engine
        |
        v
Learning Agents Framework       ->  applies reasoning to teach a subject
        |
        v
Agent Design Framework          ->  governs how the agents are built
        |
        v
Architecture Map Design System  ->  communicates the design visually
```

---

## Design Principles Shared Across All Frameworks

- **Deconstruct, do not simplify.** A framework should expose the underlying logic of a problem so the mechanism becomes intuitive, rather than hiding complexity behind abstraction.
- **Composability over monoliths.** Each framework does one thing well and connects cleanly to the others.
- **Reproducibility.** A framework is only valuable if a second person, or a future version of the author, can apply it and get consistent results.
- **Evidence of capability.** Every framework here links to concrete artifacts it has produced.

---

*Part of the [SwooshJ-SecAI](https://github.com/SwooshJ-SecAI) security and AI engineering portfolio. Built with Amazon Quick.*
