# Capability Examples

This document shows what the Learning Agents Framework produces in practice. Each agent below was built on the framework, scoped to a specific subject. The sample excerpts are representative of the material each generates — condensed for illustration.

---

## Agents Built on the Framework

| Agent | Subject | What It Generates |
|:---|:---|:---|
| CompTIA Security+ Study Agent | Security+ SY0-701 | Domain-weighted notes, practice questions, notecards, and readiness assessments across the five exam domains |
| CompTIA SecAI+ Study Agent | AI-security certification | Notes and assessments on securing AI/ML systems, model risk, and AI governance |
| AWS AI Practitioner Study Coach | AWS Certified AI Practitioner (AIF-C01) | Domain breakdowns, service-level notes, scenario questions, and score tracking |
| Agentic AI Fundamental Learning Agent | Agentic AI engineering | Chapter-by-chapter notes and first-principles analysis from a multi-chapter engineering handbook |
| Amazon Quick SME Coach | Platform mastery | Structured lessons, hands-on exercises, and mastery tracking for platform subsystems |
| Skill Authoring Mastery Coach | Skill authoring methodology | Notes on skill structure, hands-on practice, and a test-improve mastery loop |

All six run the same five-layer pipeline. They differ only in source material and objective map.

---

## Sample Output: Detailed Notes (First-Principles Style)

> **Concept: Asymmetric encryption — why two keys instead of one**
>
> A symmetric cipher uses one shared key to both lock and unlock. That is fast, but it has a distribution problem: to talk securely with someone, you must first get the shared key to them securely — which is the very problem you were trying to solve. This is circular.
>
> Asymmetric encryption breaks the circle by using a mathematically linked key pair: a public key that anyone may hold, and a private key that never leaves the owner. Anything locked with the public key can only be opened with the private key. Now the distribution problem disappears — the public key can be shouted across an open channel, because holding it grants only the ability to *encrypt to* the owner, not to decrypt.
>
> The cost is speed: asymmetric operations are far slower than symmetric ones. This is why real systems use asymmetric encryption only to exchange a symmetric session key, then switch to the fast symmetric cipher for the actual data. Understanding *why* — the distribution problem — makes the hybrid design obvious rather than arbitrary.

This excerpt illustrates Layer 2 in action: the concept is deconstructed to the problem it solves (secure key distribution) before the mechanism is described, so the design choice becomes intuitive.

---

## Sample Output: Quiz Question with Rationale

> **Question.** An organization needs to allow a public web client to send data that only its backend can read. Which approach fits, and why?
>
> A. Share a symmetric key with every client
> B. Encrypt with the backend's public key
> C. Hash the data with SHA-256
> D. Encode the data in Base64
>
> **Answer: B.**
>
> **Rationale.** The requirement is confidentiality toward a specific recipient (the backend). Encrypting with the backend's public key means only the backend's private key can decrypt — exactly the property needed, with no key-distribution problem. A is wrong because distributing a shared symmetric key to every public client destroys its secrecy. C is wrong because hashing is one-way and provides integrity, not confidentiality — the backend could not recover the data. D is wrong because Base64 is an encoding, not encryption, and provides no protection at all.

Distractors are chosen to map to specific misconceptions (confusing hashing, encoding, and encryption), so a wrong answer diagnoses a specific gap.

---

## Sample Output: Notecard (Active Recall)

> **Front:** Why do TLS sessions use both asymmetric and symmetric encryption?
>
> **Back:** Asymmetric solves key distribution (no pre-shared secret needed) but is slow. Symmetric is fast but needs a shared key. TLS uses asymmetric only to exchange a symmetric session key, then uses symmetric for the bulk data — getting distribution safety and speed together.

---

## Sample Output: Assessment-to-Domain Mapping

> **Readiness snapshot (illustrative):**
>
> | Domain | Weighting | Score | Status |
> |:---|:---|:---|:---|
> | General Security Concepts | 12% | 88% | Ready |
> | Threats, Vulnerabilities, Mitigations | 22% | 71% | Review |
> | Security Architecture | 18% | 90% | Ready |
> | Security Operations | 28% | 64% | Focus here |
> | Program Management & Oversight | 20% | 83% | Ready |
>
> **Recommended next action:** Concentrate study on Security Operations — it carries the highest exam weighting (28%) and shows the lowest score. A gain here moves the overall readiness more than any other domain.

This is Layer 4 closing the loop: performance is tied to weighted domains so study effort is directed where it changes the outcome most.

---

## What These Examples Demonstrate

- **Depth:** material explains the causal logic, not just definitions.
- **Structure:** every artifact traces back to a weighted objective map.
- **Diagnostic feedback:** assessments identify *which* gap to close next, ranked by impact.
- **Consistency:** six different subjects, one repeatable pipeline, the same quality bar.

---

*Part of the [SwooshJ-SecAI](https://github.com/SwooshJ-SecAI) portfolio. Built with Amazon Quick.*
