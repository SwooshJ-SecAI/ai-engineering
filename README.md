# AI Engineering

![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-232F3E?style=flat&logo=amazonwebservices&logoColor=white)
![JSON](https://img.shields.io/badge/JSON-000000?style=flat&logo=json&logoColor=white)
![Markdown](https://img.shields.io/badge/Markdown-000000?style=flat&logo=markdown&logoColor=white)

AI agent architecture, parallel orchestration, skill authoring, knowledge graph systems, and reusable learning frameworks.

---

## Overview

This repository documents the AI engineering side of the portfolio — how intelligent agents are designed, how reusable frameworks turn one-off automation into scalable systems, and how learning agents convert any subject into a structured study package. The focus is on architecture and repeatable methodology, not just individual tools.

**What's inside:**

- **10 AI and learning agents** — see the [Agent Catalog](./AGENTS.md)
- **Agent design methodology** — two-tier framework for building task and spec-driven agents
- **Reusable learning framework** — spawns subject-specific study agents from a common base
- **Documented frameworks** — see the [Frameworks collection](./frameworks/)
- **Architecture maps** — see the [visual index](./ARCHITECTURE_MAPS.md)

---

## Structure

### [frameworks/](./frameworks/)
The engines behind the agents — documented as first-class, reusable artifacts. Includes the [Learning Agents Framework](./frameworks/learning-agents-framework/) (with [capability examples](./frameworks/learning-agents-framework/CAPABILITY_EXAMPLES.md) and browsable [study packages](./frameworks/learning-agents-framework/study-packages/) you can study from directly), the [Agent Design Framework](./frameworks/agent-design-framework/), the [Universal Reasoning Framework](./frameworks/universal-reasoning-framework/), and the [Architecture Map Design System](./frameworks/architecture-map-design-system/).

### [agent-architecture/](./agent-architecture/)
The methodology for designing new agents — a two-tier framework separating fast task agents (Vibe Coding) from rigorous spec-driven agents, plus the dashboard automation tier-classification system. See the [design decisions](./agent-architecture/DESIGN_DECISIONS.md) for the rationale.

### [skill-authoring/](./skill-authoring/)
Patterns and tooling for formalizing workflows into reusable SKILL.md definitions — frontmatter structure, deterministic vs. agentic step design, triggers, and the test-improve loop.

### [knowledge-graphs/](./knowledge-graphs/)
Knowledge graph systems — entity extraction, relationship modeling, and how structured organizational knowledge feeds agent context.

### [orchestration/](./orchestration/)
Parallel orchestration patterns — decomposing complex work into concurrent sub-agents with tracked task groups, schema-driven results, and pipeline composition.

### [learning-frameworks/](./learning-frameworks/)
The reusable Learning Agents Framework and the subject-specific agents it produces (CompTIA Security+, SecAI+, AWS AI Practitioner, Agentic AI, and platform coaches). Multi-format output: notes, quizzes, notecards, and assessments. See the [design decisions](./learning-frameworks/DESIGN_DECISIONS.md).

---

## Getting Started

Each subfolder is self-contained with its own README. Start with [agent-architecture](./agent-architecture/) to understand the design methodology, then browse the [Agent Catalog](./AGENTS.md) to see it applied across ten agents.

---

## Built With

Built with [Amazon Quick](https://github.com/SwooshJ-SecAI). Agents and frameworks were developed on the Amazon Quick platform and sanitized for public release.

---

## License

MIT

---

*Part of the [SwooshJ-SecAI](https://github.com/SwooshJ-SecAI) security and AI engineering portfolio.*
