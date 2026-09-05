# Agentic AI Engineering — Detailed Notes

Built from the smallest causal unit — the reason-act loop — up to multi-agent systems.

---

## §1. Agent Foundations

### 1.1 What makes a system "agentic"

A plain LLM call is a function: prompt in, text out, done. An agent adds three things that turn generation into action:
- **Goal-directedness** — it works toward an objective, not a single response.
- **Autonomy** — it decides its own next steps within bounds.
- **Tool use** — it can affect the world beyond generating text (query a database, call an API, run code).

The defining shift: a chatbot answers; an agent *acts, observes the result, and adjusts*. That feedback loop is the essence of agency.

### 1.2 The anatomy of an agent

- **The model (the reasoner)** — an LLM that plans and decides.
- **Instructions (the policy)** — the system prompt defining role, goals, and constraints.
- **Tools (the hands)** — functions the agent can invoke to perceive or act.
- **Memory (the continuity)** — state carried across steps and sessions.
- **The orchestration loop (the engine)** — the control flow that runs perceive-reason-act-observe repeatedly until done.

---

## §2. The Agent Loop

### 2.1 The core cycle

Nearly every agent architecture is a variation of one loop:
1. **Perceive** — take in the goal and current context/observations.
2. **Reason** — decide the next action (which tool, what arguments, or whether the goal is met).
3. **Act** — execute the chosen tool.
4. **Observe** — capture the tool's result and feed it back into context.
5. Repeat until the goal is achieved or a stop condition is hit.

### 2.2 ReAct — reasoning and acting interleaved

The ReAct pattern makes the model alternate explicit reasoning ("I need the current price, so I'll call the price tool") with actions. Interleaving matters because the reasoning conditions the action, and the observation conditions the next reasoning. This visible thought trace also aids debugging and reduces blind tool calls.

### 2.3 Planning

For complex goals, an agent may plan before acting: decompose the goal into sub-tasks, then execute them. Planning approaches range from simple (make a to-do list up front) to dynamic (re-plan after each observation). The trade-off: up-front planning is efficient but brittle if the world changes; dynamic re-planning is robust but costlier in model calls.

### 2.4 Stop conditions

An agent without a stop condition can loop forever or thrash. Engineering discipline requires explicit limits: goal achieved, max iterations reached, budget/cost cap, or an error threshold. This is a reliability control, not an afterthought.

---

## §3. Tools & Memory

### 3.1 Tools — how an agent affects the world

A tool is a function the model can call, described to it with a name, purpose, and parameters. The model does not run the tool — it emits a structured request ("call `get_weather` with city=Seattle"), the orchestration layer executes it, and the result returns as an observation.

Tool design principles:
- **Clear descriptions** — the model chooses tools from their descriptions, so ambiguity causes wrong choices.
- **Narrow, composable tools** — small single-purpose tools are easier for the model to use correctly than giant multi-purpose ones.
- **Validated inputs/outputs** — never trust model-generated arguments blindly; validate before executing.

### 3.2 Memory — types and purpose

- **Short-term (context) memory** — the current conversation/task state held in the context window. Bounded by the window size.
- **Long-term memory** — persisted knowledge across sessions, typically in a vector store, retrieved by relevance (the same embedding-based retrieval used in RAG).
- **Working memory / scratchpad** — intermediate results the agent records mid-task.

The engineering problem memory solves: the context window is finite, so an agent cannot "remember everything." Long-term memory + retrieval lets it recall the *relevant* past without holding all of it in context.

### 3.3 RAG as an agent capability

Retrieval is often itself a tool: the agent decides when it needs external knowledge and calls a retrieval tool to fetch it. This makes knowledge access a deliberate action rather than a fixed preprocessing step.

---

## §4. Orchestration Patterns

### 4.1 Single-agent

One agent with a set of tools handles the whole task. Simplest to build and reason about. Best when the task is coherent and the tool set is manageable. The limit: as tasks and tools grow, a single agent's decisions get noisier and its context fills.

### 4.2 Multi-agent

Multiple specialized agents collaborate. Common structures:
- **Orchestrator-worker (supervisor)** — a lead agent decomposes the task and delegates to specialist sub-agents, then synthesizes results. Mirrors how a manager assigns work.
- **Pipeline / sequential** — agents hand off in stages (research → draft → review).
- **Parallel** — independent sub-tasks run concurrently, results merged.

Why multi-agent: specialization improves quality (a focused agent with a narrow tool set makes better choices), and parallelism improves speed. The cost is coordination complexity and more points of failure.

### 4.3 Workflows vs agents

Not everything needs autonomy. A **workflow** follows predefined steps (deterministic, predictable). An **agent** decides its own path (flexible, less predictable). The engineering judgment: use a workflow when the steps are known and fixed; use an agent when the path must adapt to the situation. Many production systems are hybrids — deterministic workflows with agentic steps only where flexibility is required.

### 4.4 Human-in-the-loop

For consequential actions, insert human approval into the loop. The agent proposes, the human confirms before execution. This is the primary control against an agent taking a harmful autonomous action.

---

## §5. Reliability, Evaluation & Safety

### 5.1 Why agents are hard to make reliable

An agent compounds uncertainty: each step's output feeds the next, so an early error propagates and amplifies. A single wrong tool call can derail the whole trajectory. Reliability engineering focuses on constraining and checking each step.

### 5.2 Reliability techniques

- **Input/output validation** — check tool arguments before executing, check tool results before trusting.
- **Retries with backoff** — transient failures (a flaky API) should be retried, not fatal.
- **Guardrails** — constrain what the agent can say and do; filter unsafe outputs.
- **Stop conditions and budgets** — cap iterations and cost to prevent runaway loops.
- **Structured outputs** — force the model to emit machine-checkable formats (JSON schemas) so downstream steps are not parsing free text.

### 5.3 Evaluation

You cannot improve what you do not measure. Agent evaluation includes:
- **Task success rate** — did it achieve the goal.
- **Trajectory quality** — were the steps sensible, or did it wander.
- **Tool-use correctness** — right tool, right arguments.
- **Cost and latency** — steps and tokens consumed.
Evaluation uses curated test cases (representative tasks with known good outcomes) run repeatedly as the agent evolves — the same test-improve loop as software.

### 5.4 Safety and the agency risk

The more an agent can do, the more damage a mistake or manipulation causes. This is the excessive-agency principle from AI security applied to design:
- **Least privilege** — grant the minimum tools and permissions.
- **Sandboxing** — execute risky tools (code, shell) in isolated environments.
- **Human confirmation** — require approval for irreversible or high-impact actions.
- **Prompt-injection defense** — an agent that reads external content can be hijacked by instructions hidden in that content; constrain its authority so a hijack has limited blast radius.

### 5.5 The unifying frame

An agent's capability and its risk both come from the same source: the loop and the tools. Good agent engineering maximizes the capability while bounding the risk — clear tools, checked steps, explicit stop conditions, least privilege, and human oversight where it matters.

---

*Generated by the Learning Agents Framework V2.*
