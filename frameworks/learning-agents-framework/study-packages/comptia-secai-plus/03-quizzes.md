# CompTIA SecAI+ (CY0-001) — Quizzes

Answer before reading the explanation.

---

## Domain: AI Threats & Attacks

**Q1.** An attacker injects mislabeled samples into a training set so the model learns to classify a specific malware family as benign. This is:
- A) Evasion attack
- B) Data poisoning (backdoor)
- C) Model extraction
- D) Prompt injection

**Answer: B.** Manipulating training data to implant targeted misbehavior is backdoor poisoning. Evasion happens at inference; extraction steals the model; prompt injection targets LLM instructions.

**Q2.** Small, human-imperceptible changes to an image cause a classifier to misidentify it. Which attack and which lifecycle stage?
- A) Poisoning; training
- B) Evasion; inference
- C) Inversion; training
- D) Extraction; inference

**Answer: B.** Adversarial/evasion attacks occur at inference by perturbing input across the decision boundary.

**Q3.** A hostile instruction is embedded in a web page that an LLM agent later reads and acts upon. This is:
- A) Direct prompt injection
- B) Indirect prompt injection
- C) Model inversion
- D) Availability poisoning

**Answer: B.** Instructions planted in content the model will process later is indirect prompt injection.

**Q4.** By querying a deployed model thousands of times and observing outputs, an attacker rebuilds an equivalent model. This primarily breaks which property?
- A) Availability
- B) Integrity
- C) Confidentiality
- D) Non-repudiation

**Answer: C.** Model extraction steals intellectual property — a confidentiality breach.

**Q5.** Why is prompt injection often compared to SQL injection?
- A) Both require physical access
- B) Both exploit data being interpreted as instructions
- C) Both only affect databases
- D) Both are fully solved by encryption

**Answer: B.** The shared root cause is the absence of separation between data and instructions.

## Domain: Securing AI Systems

**Q6.** Which technique adds calibrated noise during training so the model cannot memorize any single record?
- A) Federated learning
- B) Differential privacy
- C) Adversarial training
- D) Rate limiting

**Answer: B.** Differential privacy bounds any single record's influence, defeating inversion and membership inference.

**Q7.** An LLM-based agent can send emails and execute code. What is the MOST important control to limit manipulation impact?
- A) A larger model
- B) Least privilege plus human confirmation for high-impact actions
- C) Faster inference
- D) More training data

**Answer: B.** This is the excessive-agency risk; cap authority and require human approval for consequential actions.

**Q8.** Rate limiting a model API primarily defends against which two AI attacks?
- A) Poisoning and bias
- B) Extraction and evasion probing
- C) Injection and inversion only
- D) Drift and explainability loss

**Answer: B.** Both extraction and evasion require many queries; rate limiting and query monitoring slow and expose them.

**Q9.** Adversarial training defends against evasion by:
- A) Encrypting the model weights
- B) Training on adversarial examples to harden the decision boundary
- C) Removing all training data
- D) Adding a firewall

**Answer: B.** Exposing the model to adversarial examples during training makes its boundary more robust.

**Q10.** A pre-trained foundation model is downloaded from a public hub and integrated without verification. This is primarily a:
- A) Availability risk
- B) Supply-chain risk
- C) Bias risk
- D) Explainability risk

**Answer: B.** Unverified imported components are a supply-chain risk; the model could carry a backdoor.

## Domain: AI for Security Operations

**Q11.** Unsupervised learning is especially useful in security operations for:
- A) Encrypting logs
- B) Anomaly detection against a learned baseline
- C) Replacing all analysts
- D) Generating passwords

**Answer: B.** Unsupervised models baseline normal behavior and flag deviations, including novel attacks.

**Q12.** Why should AI-generated detections not be blindly trusted as executable actions?
- A) They are always wrong
- B) Insecure output handling — model output may be manipulated or incorrect
- C) They are too slow
- D) They cannot be logged

**Answer: B.** Treating model output as inherently safe/correct is the insecure-output-handling risk; verify before acting.

**Q13.** An over-reliance on a single AI triage system creates what classic risk?
- A) A single point of failure / blind spot if poisoned or evaded
- B) Improved redundancy
- C) Lower false positives permanently
- D) Guaranteed compliance

**Answer: A.** Concentrating detection in one AI system means its compromise becomes a blind spot.

## Domain: Governance, Ethics & Risk

**Q14.** A model trained on historically biased data flags certain groups unfairly. The root cause is:
- A) The model is broken
- B) The model learned the bias present in its training data
- C) Encryption failure
- D) Rate limiting

**Answer: B.** Models reproduce the patterns — including biases — in their training data. Fix with diverse data and fairness testing.

**Q15.** Which framework provides structured AI risk management across govern, map, measure, and manage functions?
- A) PCI DSS
- B) NIST AI Risk Management Framework
- C) OWASP Top 10 (web)
- D) SOC 2

**Answer: B.** The NIST AI RMF structures AI-specific risk management.

**Q16.** Meaningful human oversight for consequential AI decisions primarily addresses which risk?
- A) Slow inference
- B) Excessive agency / autonomous high-impact decisions
- C) Model size
- D) Data storage cost

**Answer: B.** Human-in/on-the-loop limits the model's authority to decide alone — the governance side of excessive agency.

---

*Generated by the Learning Agents Framework V2.*
