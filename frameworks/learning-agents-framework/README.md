# Learning Agents Framework

A framework that turns any subject or certification into a complete, structured learning package — and, when needed, into a standalone study agent dedicated to that subject.

The framework is the product. The study materials it generates are the proof of what it can do.

---

## The Problem It Solves

Most study material is either shallow (bullet-point summaries that skip the reasoning) or unstructured (a wall of notes with no path through it). Learning a hard technical subject — a security certification, a cloud platform, an engineering discipline — needs both depth and structure at once: you need to understand *why* each concept exists, and you need a sequenced path that moves you from foundations to mastery with feedback along the way.

Building that by hand for every new subject is slow and inconsistent. This framework standardizes the process so any subject can be turned into a rigorous, self-contained learning package with the same quality bar every time.

---

## What It Produces

For a given subject, the framework generates a coordinated set of artifacts:

- **Detailed notes** — sectioned, first-principles explanations that deconstruct each concept to its underlying logic rather than restating definitions.
- **First-principles analysis** — for the hardest concepts, a breakdown of the causal chain: what the smallest unit is, why it exists, and how the parts combine.
- **Quizzes** — knowledge-check questions with answer rationales, not just answer keys.
- **Notecards** — condensed active-recall prompts for spaced repetition.
- **Assessments** — longer evaluations that measure mastery against the subject's objective map.
- **A subject-specific agent** — optionally, a standalone study agent scoped to that subject, so the learner can have an ongoing tutor rather than a static document.

---

## How It Works: The Five-Layer Pipeline

The framework runs a subject through five layers, each building on the one before it.

### Layer 1 — Subject Decomposition
The subject is broken into its objective map: domains, sub-domains, and the concepts within each. For a certification this mirrors the official exam objectives and their weightings; for an open subject it is derived from the source material. This layer answers *what must be learned and in what proportion*.

### Layer 2 — First-Principles Analysis
Each concept is deconstructed to its causal root. Rather than "here is the definition," this layer asks "why does this exist, what problem does it solve, and what breaks without it." This is the analytical layer, and it is powered by the [Universal Reasoning Framework](../universal-reasoning-framework/). It is what separates the output from a summary generator.

### Layer 3 — Material Generation
The analyzed concepts are rendered into the concrete artifacts — notes, quizzes, notecards, assessments — each formatted for a specific mode of learning (reading, active recall, self-testing).

### Layer 4 — Assessment and Feedback
The generated assessments are mapped back to the objective map from Layer 1, so a learner's performance can be traced to specific weak domains. This closes the loop: study, test, identify gaps, restudy the specific gap.

### Layer 5 — Agent Spawning
When an ongoing tutor is wanted, the framework packages the subject's material and objective map into a standalone study agent. That agent carries the subject in its knowledge base and can teach, quiz, and re-explain on demand — a living version of the static package.

```
Subject
  |
  v
[1] Subject Decomposition   ->  objective map (domains + weightings)
  |
  v
[2] First-Principles Analysis  ->  causal breakdown of each concept
  |                                (Universal Reasoning Framework)
  v
[3] Material Generation     ->  notes | quizzes | notecards | assessments
  |
  v
[4] Assessment + Feedback   ->  performance mapped to weak domains
  |
  v
[5] Agent Spawning          ->  standalone subject-specific study agent
```

---

## Why Five Layers Instead of One Pass

A single-pass "generate study notes" approach fails at depth: it produces plausible summaries that skip the reasoning. Separating decomposition (Layer 1) from analysis (Layer 2) forces the framework to first establish *what* matters and *how much*, before spending analytical effort — so effort is allocated in proportion to exam weighting and conceptual difficulty. Separating generation (Layer 3) from assessment (Layer 4) means the material and the way it is tested are designed against the same objective map, so feedback is diagnostic rather than generic. Each seam in the pipeline exists to prevent a specific failure mode of the naive approach.

---

## Capability Examples

See [CAPABILITY_EXAMPLES.md](./CAPABILITY_EXAMPLES.md) for the agents built on this framework and sample excerpts of the material they generate.

---

## Reuse

The framework is subject-agnostic. It has been applied to security certifications, cloud certifications, an AI-security certification, an agentic-AI engineering handbook, and platform-mastery subjects — the same five layers, different source material each time.

---

*Part of the [SwooshJ-SecAI](https://github.com/SwooshJ-SecAI) portfolio. Built with Amazon Quick.*
