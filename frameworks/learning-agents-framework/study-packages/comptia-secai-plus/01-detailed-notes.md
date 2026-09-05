# CompTIA SecAI+ (CY0-001) — Detailed Notes

AI security built from fundamentals. Every AI-specific risk is tied back to the classic security property it threatens.

---

## §1. AI Fundamentals for Security

### 1.1 Why a defender needs to understand the model

You cannot secure what you do not understand. An AI system is not a black box you wrap in a firewall — its internal mechanics create its vulnerabilities. Three concepts are load-bearing:

- **Training** — the model learns patterns from a dataset. Whatever is in the training data shapes behavior. This is why data is an attack surface: corrupt the data, corrupt the model.
- **Inference** — the trained model makes predictions on new input. This is the runtime attack surface: craft input to manipulate output.
- **Parameters / weights** — the learned values that encode the model's knowledge. They are intellectual property and, if stolen, allow model replication.

### 1.2 Model types the exam expects

- **Supervised learning** — trained on labeled data (input paired with correct output). Used for classification (spam/not spam) and regression.
- **Unsupervised learning** — finds structure in unlabeled data (clustering, anomaly detection). Directly relevant to security: anomaly detection flags deviations from a learned baseline.
- **Reinforcement learning** — learns by reward/penalty through interaction.
- **Large Language Models (LLMs)** — trained on vast text; generate language. Introduce prompt injection and data-leakage risks specific to their generative, instruction-following nature.

### 1.3 The AI supply chain

Modern AI is assembled, not built from scratch: pre-trained foundation models, third-party datasets, open-source libraries, and model hubs. Each imported component is a supply-chain risk — a poisoned pre-trained model or a backdoored library inherits its compromise into your system. The classic supply-chain lesson applies: trust must be verified, provenance must be tracked.

---

## §2. AI Threats & Attacks

The four canonical AI attacks map cleanly to the CIA triad and the training-vs-inference split.

### 2.1 Data poisoning (attack on training, breaks integrity)

The attacker injects malicious data into the training set so the model learns the wrong thing. Two flavors:
- **Availability poisoning** — degrade overall accuracy so the model becomes unreliable.
- **Backdoor / targeted poisoning** — implant a hidden trigger: the model behaves normally except when it sees a specific pattern, then misbehaves as the attacker chose (for example, always classifying malware with a certain marker as benign).

Why it works: the model trusts its training data as ground truth. If you control part of that data, you control part of what it "knows." The defense is data provenance, validation, and anomaly detection on the training set.

### 2.2 Evasion / adversarial examples (attack on inference, breaks integrity)

The attacker crafts input with small, often human-imperceptible perturbations that cause the model to misclassify. A classic example: a few pixel changes make an image classifier see a different object; a slightly modified file evades an ML malware detector.

Why it works: models learn decision boundaries in high-dimensional space that do not perfectly match human perception. The attacker finds points near the boundary and nudges across it. Defenses include adversarial training (train on adversarial examples), input preprocessing, and ensemble models.

### 2.3 Model extraction / theft (breaks confidentiality)

By querying a model many times and observing outputs, an attacker reconstructs an equivalent model — stealing the intellectual property and the training investment without ever accessing the weights directly. Related: **model inversion**, where an attacker reconstructs training data from the model, breaking the confidentiality of that data (a serious issue if the model was trained on personal or sensitive information). Defenses: rate limiting, query monitoring, output perturbation, and differential privacy in training.

### 2.4 Prompt injection (LLM-specific, breaks integrity of behavior)

An LLM cannot reliably distinguish its instructions from the data it processes — both arrive as text. Prompt injection exploits this: hostile instructions hidden in user input or in retrieved content override the intended behavior.
- **Direct injection** — the user types "ignore previous instructions and..."
- **Indirect injection** — malicious instructions are planted in content the model will later read (a web page, a document, an email) and execute when the model processes it.

This is the AI-era analog of SQL injection: data is being interpreted as instructions. The root cause is the same (no separation of code and data), and there is no complete fix yet — mitigations include input/output filtering, privilege separation, and never granting the model unchecked authority over sensitive actions.

### 2.5 The OWASP LLM risk themes

Recurring LLM risks the exam draws from: prompt injection, insecure output handling (trusting model output as safe code/commands), training-data poisoning, model denial of service (expensive queries), supply-chain vulnerabilities, sensitive information disclosure, and excessive agency (giving the model too much autonomous power to act).

---

## §3. Securing AI Systems

### 3.1 Defense across the lifecycle

Security must apply at every stage because each stage has a distinct attack surface:
- **Data collection** — validate provenance, detect poisoning, control access to training data.
- **Training** — protect the pipeline, ensure reproducibility, secure the compute environment.
- **Deployment** — protect the model endpoint, authenticate callers, rate-limit.
- **Inference / runtime** — filter inputs and outputs, monitor for adversarial and extraction patterns.
- **Monitoring** — detect drift (the model degrading as real-world data shifts) and abuse.

### 3.2 Protecting the model endpoint

An exposed model API is an attack surface like any other service. Apply the classic controls: authentication, authorization, rate limiting (which also slows extraction attacks), input validation, and logging. The AI-specific addition is monitoring the *pattern* of queries — extraction and evasion attacks produce distinctive querying behavior.

### 3.3 Privacy-preserving techniques

- **Differential privacy** — add calibrated noise so the model cannot memorize any single training record, defeating model inversion and membership inference.
- **Federated learning** — train across decentralized data without centralizing it, reducing the exposure of raw data.
- **Data minimization** — do not train on more sensitive data than needed; you cannot leak what you never ingested.

### 3.4 Excessive agency — the autonomy risk

As models are given tools and the ability to act (send emails, run code, make purchases), the impact of manipulation grows. A prompt-injected model with the authority to move money is a far worse problem than one that only generates text. The control is least privilege applied to AI: grant the model the minimum capability required, require human confirmation for high-impact actions, and sandbox tool execution.

---

## §4. AI for Security Operations

### 4.1 Where AI genuinely helps defenders

- **Anomaly detection** — unsupervised models baseline normal behavior and flag deviations, catching novel attacks that signatures miss.
- **Alert triage** — models prioritize and cluster alerts, reducing analyst fatigue from false positives.
- **Threat intelligence** — LLMs summarize and correlate large volumes of intel.
- **Phishing detection** — classifiers analyze content and context beyond simple rules.
- **Automated response** — AI-driven playbooks accelerate containment.

### 4.2 The limits and risks of AI in SecOps

AI is not a replacement for judgment. It produces false positives and false negatives; it can be evaded; and over-reliance creates a single point of failure. An AI triage system that is poisoned or evaded becomes a blind spot. The defensive principle: AI augments analysts, and its outputs are verified, not blindly trusted — the same "insecure output handling" caution that applies to any model.

### 4.3 Explainability in operations

A detection you cannot explain is hard to act on and hard to defend in an audit. Explainable AI (XAI) techniques matter operationally because an analyst must understand *why* the model flagged something to decide the response, and a regulator may require the reasoning.

---

## §5. Governance, Ethics & Risk

### 5.1 Bias and fairness

A model learns the patterns in its data, including the biases. If the training data reflects historical bias, the model reproduces and can amplify it. In a security context this can mean unfair flagging of certain users or groups. Governance requires testing for bias, diverse training data, and ongoing fairness monitoring.

### 5.2 AI governance frameworks

- **NIST AI Risk Management Framework (AI RMF)** — a structured approach to identifying and managing AI risk across the lifecycle (govern, map, measure, manage).
- **Regulatory landscape** — emerging AI regulation imposes transparency, risk classification, and accountability requirements. The compliance logic mirrors data privacy: know what your system does, document it, and be accountable.

### 5.3 Accountability and human oversight

The core ethical control is meaningful human oversight for consequential decisions. An AI system should not make high-impact decisions autonomously without a human in or on the loop. This ties directly back to excessive agency: governance limits what the model is permitted to decide alone.

### 5.4 The unifying frame

Every SecAI+ topic reduces to a familiar question asked about a new kind of system: which security property is at risk (confidentiality, integrity, availability), where in the lifecycle (training or inference), and what control reduces it. AI changes the attack surface, not the fundamentals.

---

*Generated by the Learning Agents Framework V2.*
