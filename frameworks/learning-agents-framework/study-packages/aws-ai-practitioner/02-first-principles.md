# AWS AI Practitioner (AIF-C01) — First Principles

The concepts candidates most often confuse, reasoned from the ground up.

---

## 1. Why RAG usually beats fine-tuning for "the model doesn't know our data"

Candidates reflexively reach for fine-tuning whenever a model lacks knowledge. Reason about what each method actually changes.

Fine-tuning adjusts the model's weights by further training. It durably changes behavior and style, but it is expensive, requires labeled data, and — critically — it bakes knowledge in at training time. If your data changes tomorrow, the fine-tuned model is already stale, and you must retrain. Fine-tuning also does not cleanly "teach facts"; it shapes behavior. It is poor at "know this specific, changing information."

RAG changes nothing about the model. At query time, it retrieves the relevant documents and places them in the prompt, so the model answers from fresh, specific source material it can read right now. Update a document and the next query reflects it immediately — no retraining. It also grounds the answer, reducing hallucination.

So the decision rule falls out of the mechanics: if the need is "answer from our current/private information," that is a knowledge-access problem, and RAG solves it directly and cheaply. Fine-tuning is for when you need to change *how the model behaves* (tone, format, domain style), not *what current facts it can see*.

## 2. Why temperature controls creativity

An LLM predicts the next token as a probability distribution over the vocabulary. Temperature reshapes that distribution before sampling.

At low temperature, the distribution is sharpened — the highest-probability token dominates, so the model almost always picks the "safest" continuation. Output is deterministic and factual-leaning. At high temperature, the distribution is flattened — lower-probability tokens get a real chance, so the model takes more surprising paths. Output is varied and creative, but more prone to drift and error.

This is why the exam pairs low temperature with factual/deterministic tasks (extraction, classification, code) and high temperature with creative tasks (brainstorming, marketing copy). You are literally tuning how much randomness you allow into the next-token choice.

## 3. Why the AI service hierarchy exists (pre-built vs Bedrock vs SageMaker)

Reason about effort versus control. These three tiers trade one for the other.

Pre-built AI services (Rekognition, Comprehend, Transcribe) solve a fixed, common problem with zero ML skill and zero infrastructure — you call an API. The cost is zero flexibility: you get what the service does, nothing custom.

Bedrock sits in the middle for generative tasks: managed foundation models via API, with adaptation options (prompt, RAG, guardrails, fine-tuning) but no infrastructure to run. You get generative flexibility without operating servers.

SageMaker gives full control: build, train, and deploy any custom model. The cost is that you need ML expertise and you manage more of the lifecycle.

The decision logic the exam tests: pick the highest tier that still solves the problem, because effort and required expertise rise as you go down. If Comprehend does sentiment analysis, do not build a custom model in SageMaker. If you need a custom fraud model on your own data, a pre-built service cannot do it.

## 4. Why embeddings make semantic search possible

Keyword search matches characters; it fails when the same idea uses different words ("car" vs "automobile"). Reason toward the fix: you need to compare *meaning*, not spelling.

Embeddings solve this by mapping text into a high-dimensional vector where distance encodes semantic similarity — texts about similar concepts land near each other regardless of exact words. To search, you embed the query, then find the nearest document vectors. "Automobile" and "car" sit close together, so the query finds both.

This is the engine under RAG: retrieval is nearest-neighbor search in embedding space. Understanding this makes RAG concrete rather than magic — it is "find the semantically closest documents, then hand them to the model."

## 5. Why hallucination is inherent, not a bug

An LLM generates the most probable next token given context. It has no built-in notion of truth — only of plausibility learned from training text. When the true answer is outside its knowledge or the prompt is ambiguous, it still produces the most *plausible-sounding* continuation, which can be confidently false.

So hallucination is not a defect to be patched away; it is a consequence of the generate-plausible-text mechanism. That reframes the mitigations: you cannot make the model "know it is wrong," so you (a) ground it with retrieved facts (RAG), (b) constrain it with guardrails, and (c) keep humans in the loop for consequential outputs. You are managing an inherent property, not fixing a bug — which is exactly how the exam frames responsible deployment.

---

*Generated by the Learning Agents Framework V2.*
