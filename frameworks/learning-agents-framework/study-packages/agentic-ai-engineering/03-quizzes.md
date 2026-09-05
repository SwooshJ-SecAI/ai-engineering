# Agentic AI Engineering — Quizzes

Answer before reading the explanation.

---

## Domain: Agent Foundations & Loop

**Q1.** What most fundamentally distinguishes an agent from a single LLM call?
- A) A larger model
- B) A feedback loop of act-observe-adjust toward a goal
- C) A longer prompt
- D) Encryption

**Answer: B.** Agency is the loop — acting, observing results, and adjusting — not model size.

**Q2.** In the ReAct pattern, what is interleaved?
- A) Two models
- B) Explicit reasoning and actions
- C) Training and inference
- D) Encryption and decryption

**Answer: B.** ReAct alternates reasoning steps with actions so each conditions the other.

**Q3.** Why must an agent have explicit stop conditions?
- A) To reduce model size
- B) To prevent infinite loops, thrashing, and runaway cost
- C) To improve encryption
- D) They are optional

**Answer: B.** Without stop conditions (goal met, max iterations, budget cap) an agent can loop forever.

## Domain: Tools & Memory

**Q4.** When an agent "uses a tool," who actually executes it?
- A) The model runs it internally
- B) The orchestration layer executes it and returns the result as an observation
- C) The user
- D) No one; it is simulated

**Answer: B.** The model emits a structured call; the orchestration layer executes and returns the result.

**Q5.** Why are narrow, single-purpose tools preferred over broad multi-purpose ones?
- A) They use less memory
- B) The model chooses and calls them more correctly from clear descriptions
- C) They are encrypted
- D) They are cheaper to store

**Answer: B.** Narrow, well-described tools reduce ambiguity and argument errors in model tool selection.

**Q6.** What problem does long-term (retrieval-based) memory solve?
- A) The model is too small
- B) The context window is finite, so the agent retrieves only relevant past knowledge instead of holding everything
- C) Encryption overhead
- D) Slow inference

**Answer: B.** Retrieval-based memory gives effectively unbounded recall while keeping working context small.

**Q7.** Retrieval in an agent is fundamentally:
- A) Keyword matching
- B) Nearest-neighbor search in embedding space
- C) Fine-tuning
- D) A stop condition

**Answer: B.** Relevance-based retrieval is semantic nearest-neighbor search over embeddings.

## Domain: Orchestration

**Q8.** In an orchestrator-worker multi-agent pattern, the lead agent:
- A) Executes every tool itself
- B) Decomposes the task, delegates to specialists, and synthesizes results
- C) Only stores memory
- D) Replaces the model

**Answer: B.** The supervisor decomposes and delegates, then combines the specialists' outputs.

**Q9.** When should you choose a deterministic workflow over an agent?
- A) When the steps are known and fixed
- B) When the path must adapt unpredictably
- C) Always
- D) Never

**Answer: A.** Fixed, predictable steps favor a workflow; adaptive paths favor an agent.

**Q10.** The primary benefit of specialized multi-agent systems is:
- A) Lower cost always
- B) Better decisions from narrow scope, plus parallelism
- C) No coordination needed
- D) Smaller models

**Answer: B.** Specialization narrows each agent's choice space (better decisions); parallelism adds speed. The cost is coordination complexity.

**Q11.** The main downside of multi-agent architectures is:
- A) They cannot use tools
- B) Coordination complexity and more failure points
- C) They cannot be evaluated
- D) They require no memory

**Answer: B.** Every handoff between agents is a new failure point and cost.

## Domain: Reliability, Evaluation & Safety

**Q12.** Why do errors compound in an agent trajectory?
- A) The model shrinks each step
- B) Each step's output feeds the next, so an early error propagates and amplifies
- C) Encryption degrades
- D) Tools multiply

**Answer: B.** Sequential dependence means an early mistake derails later steps.

**Q13.** Forcing the model to emit JSON matching a schema is an example of:
- A) Fine-tuning
- B) Structured outputs for machine-checkable, reliable downstream handling
- C) A stop condition
- D) Memory retrieval

**Answer: B.** Structured outputs make results parseable and checkable, improving reliability.

**Q14.** An agent that reads external web content can be hijacked by hidden instructions in that content. This is:
- A) Data poisoning
- B) Indirect prompt injection
- C) Model inversion
- D) Drift

**Answer: B.** Malicious instructions planted in content the agent processes is indirect prompt injection.

**Q15.** The MOST important control to limit damage from a manipulated agent with powerful tools is:
- A) A bigger context window
- B) Least privilege plus human confirmation for high-impact actions
- C) Higher temperature
- D) More tools

**Answer: B.** Bounding authority and requiring human approval shrinks the blast radius of manipulation or error.

**Q16.** Agent evaluation should measure task success, trajectory quality, tool-use correctness, and:
- A) Model color
- B) Cost and latency
- C) Encryption strength
- D) Screen resolution

**Answer: B.** Cost/latency (steps and tokens) are core agent evaluation metrics alongside success and trajectory quality.

---

*Generated by the Learning Agents Framework V2.*
