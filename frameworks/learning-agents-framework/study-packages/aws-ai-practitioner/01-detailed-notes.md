# AWS Certified AI Practitioner (AIF-C01) — Detailed Notes

Concepts built from fundamentals, mapped to AWS services.

---

## §1. Fundamentals of AI and ML

### 1.1 The nesting: AI > ML > DL > GenAI

Understand the containment relationship and the confusion disappears:
- **Artificial Intelligence (AI)** — the broad field of machines performing tasks that require human-like intelligence.
- **Machine Learning (ML)** — a subset of AI where systems learn patterns from data instead of being explicitly programmed.
- **Deep Learning (DL)** — a subset of ML using multi-layered neural networks; excels at unstructured data (images, audio, text).
- **Generative AI** — a subset of DL that generates new content (text, images, code) rather than only classifying or predicting.

### 1.2 Learning paradigms

- **Supervised** — labeled data; the model learns input-to-output mapping. Classification and regression.
- **Unsupervised** — unlabeled data; the model finds structure. Clustering, dimensionality reduction, anomaly detection.
- **Reinforcement** — an agent learns via reward/penalty through trial and interaction.

### 1.3 The ML workflow

The lifecycle the exam expects: collect data, prepare/clean data, engineer features, train, evaluate, deploy, monitor. The heaviest real-world effort is data preparation — models are only as good as their data.

### 1.4 Core AWS ML services

- **Amazon SageMaker** — the end-to-end managed platform to build, train, and deploy ML models. The anchor service for custom ML.
- **Amazon Bedrock** — managed access to foundation models (from multiple providers) via API; the anchor for generative AI without managing infrastructure.
- **Pre-built AI services** (no ML expertise required):
  - **Rekognition** — image/video analysis.
  - **Transcribe** — speech to text.
  - **Polly** — text to speech.
  - **Comprehend** — natural language processing (sentiment, entities, PII detection).
  - **Translate** — language translation.
  - **Textract** — document text/data extraction.
  - **Lex** — conversational chatbots.
  - **Personalize** — recommendations.
  - **Forecast** — time-series forecasting.

The decision logic: use a pre-built AI service if one fits the task (fastest, no ML skill needed); use Bedrock for generative tasks; use SageMaker when you need a custom model.

---

## §2. Fundamentals of Generative AI

### 2.1 Foundation models and LLMs

A **foundation model (FM)** is a large model pre-trained on broad data, adaptable to many tasks. **Large Language Models** are FMs for text. They work by predicting the next token given prior context — that single mechanism, at scale, produces coherent generation.

### 2.2 Key generative concepts

- **Tokens** — the units of text a model processes; billing and context limits are measured in tokens.
- **Context window** — how much text the model can consider at once; exceeding it truncates or fails.
- **Prompt** — the input that steers the model.
- **Inference parameters** — **temperature** (higher = more random/creative, lower = more deterministic), **top-p / top-k** (control the sampling pool). Lower temperature for factual tasks; higher for creative ones.
- **Embeddings** — numerical vector representations of text capturing semantic meaning; the basis for semantic search and RAG.

### 2.3 Amazon Bedrock capabilities

Bedrock provides FM access plus: **Knowledge Bases** (managed RAG), **Agents** (multi-step task execution with tools), **Guardrails** (content filtering and safety), and fine-tuning/customization. It is serverless — no infrastructure to manage.

---

## §3. Applications of Foundation Models

### 3.1 The three ways to adapt an FM to your needs

This is the most exam-critical decision. Ordered from cheapest/fastest to most expensive:

1. **Prompt engineering** — craft better prompts. No training, no cost beyond inference. Techniques: zero-shot (just ask), few-shot (provide examples in the prompt), chain-of-thought (ask the model to reason step by step).
2. **Retrieval-Augmented Generation (RAG)** — retrieve relevant documents at query time and add them to the prompt so the model answers from your data. Solves the "the model does not know your private/current information" problem without retraining. Uses embeddings + a vector store.
3. **Fine-tuning** — further train the FM on your labeled data to change its behavior/style/domain knowledge. Most expensive; used when prompt engineering and RAG are insufficient.

The decision logic: try prompt engineering first; add RAG when the model needs your specific or current data; fine-tune only when you need to durably change behavior and the cheaper options fall short.

### 3.2 Why RAG matters so much

An FM's knowledge is frozen at training time and it has no access to your private data. RAG bridges both gaps: it injects current, private, relevant context at query time. It also reduces hallucination by grounding answers in retrieved source material. This is why "the model gives outdated or generic answers about our internal data" points to RAG, not fine-tuning.

### 3.3 Evaluating generative output

Metrics differ from classic ML. Human evaluation, benchmark datasets, and task-specific metrics (e.g., BLEU/ROUGE for translation/summarization) apply. The practical concern the exam raises: hallucination (confident but false output) and how RAG and guardrails mitigate it.

---

## §4. Responsible AI

### 4.1 The dimensions of responsible AI

- **Fairness** — avoid biased outcomes across groups.
- **Explainability / interpretability** — understand why the model produced an output.
- **Robustness** — reliable performance, resistant to manipulation.
- **Privacy** — protect personal data used or produced.
- **Transparency** — disclose AI use and limitations.
- **Governance** — accountability and oversight.

### 4.2 Bias and its sources

Bias enters through unrepresentative training data, flawed labeling, or feature choices. Because models learn the patterns in their data, they reproduce and can amplify existing bias. Mitigation: diverse and representative data, bias testing, and monitoring.

### 4.3 AWS responsible AI tooling

- **SageMaker Clarify** — detects bias in data and models, and explains predictions (feature importance).
- **SageMaker Model Monitor** — detects drift in production (data quality, model quality) so degradation is caught.
- **Bedrock Guardrails** — enforces content policies, blocks harmful topics, filters PII.

### 4.4 Hallucination and its handling

An LLM generates plausible text, which sometimes means confidently wrong text. Responsible deployment grounds outputs (RAG), constrains them (guardrails), and — for consequential uses — keeps a human in the loop.

---

## §5. Security, Compliance & Governance for AI

### 5.1 The shared responsibility model applied to AI

As with all AWS, the provider secures the infrastructure; you secure your data, access, and configuration. For AI specifically: you control who can invoke models, what data is sent, and how outputs are used.

### 5.2 Core AWS security services in the AI context

- **IAM** — least-privilege access to AI services and data. Who can call Bedrock, who can access training data.
- **KMS** — encryption key management for data at rest.
- **VPC / PrivateLink** — keep model traffic on private networks.
- **CloudTrail** — audit logging of API calls, including model invocations, for accountability.
- **Macie** — discovers and protects sensitive data (PII) in S3, relevant to protecting training data.

### 5.3 Data governance for AI

Know what data trains and prompts your models. Sensitive data sent to a model is a disclosure risk; data used to fine-tune can be memorized and leaked. Controls: data classification, minimization, encryption, access control, and (in Bedrock) not using customer data to train the base models.

### 5.4 Compliance

AWS provides compliance certifications and artifacts (via AWS Artifact). Your obligation is to use the services in a compliant configuration and to document how personal or regulated data flows through your AI systems.

### 5.5 The unifying frame

AIF-C01 rewards two reflexes: match the problem to the right service, and choose the right adaptation method (prompt → RAG → fine-tune) by cost and need. Everything in responsible AI and security is the familiar discipline applied to a model as the new asset.

---

*Generated by the Learning Agents Framework V2.*
