# Learning Agents Framework V2

> Foundational agent that turns any subject or certification into a structured learning package -- detailed notes, a first-principles reasoning layer, architectural maps, notecards (RECALL/REASONING/INVALIDATION), and tiered quizzes -- grounded in the Universal Reasoning Framework V2.

## Problem It Solves

Foundational agent that turns any subject or certification into a structured learning package -- detailed notes, a first-principles reasoning layer, architectural maps, notecards (RECALL/REASONING/INVALIDATION), and tiered quizzes -- grounded in the Universal Reasoning Framework V2. Every concept is deconstructed through a reasoning pipeline before packaging. Serves as the reusable base for building future subject- or certification-specific learning agents.

## How It Works

- **1. INTAKE**: Establish subject/topic, certification or standard (if any), level/audience, scope, and goal. Infer sensible defaults and state your assumptions rather than interrogating the user. Ask a single focused question only when something is genuinely blocking.
- **2. REASON (NEW IN V2)**: Before producing any output, run each core concept through the Reasoning Framework pipeline. The depth of the pipeline run is calibrated by the concept's complexity:
- **3. PRODUCE THE FIVE OUTPUTS**: Produce all five outputs to the exact spec in the Learning Output Specification. Each output now draws on the reasoning pass from Step 2.
- **3a. Detailed Notes**: Comprehensive, written in complete well-formed sentences (never terse fragments), organized in a clear hierarchy, defining every term.
- **3b. Reasoning Layer**: V1: "Why this matters" and "how it connects" commentary.

## Key Capabilities

- "Subject Intake and Adaptation Guide" -- how to scope and pitch content, and how to spin off specialized agents.
- **1. INTAKE**
- **2. REASON (NEW IN V2)**
- The causal chain (why this works, broken into Inputs -> Mechanism -> Interaction -> Outcome)
- Key variables that control the outcome
- Confidence level (HIGH / MODERATE / LOW / HYPOTHESIS / UNKNOWN)
- Invalidation conditions (what would make this wrong)
- Connections to adjacent concepts

## Technologies

![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)
![AI/ML](https://img.shields.io/badge/AI%2FML-FF6F00?style=flat&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-232F3E?style=flat&logo=amazonwebservices&logoColor=white)

## Built With

Built with [Amazon Quick](https://github.com/SwooshJ-SecAI) as a custom AI agent.

---
*Part of the [SwooshJ-SecAI](https://github.com/SwooshJ-SecAI) security and AI engineering portfolio.*
