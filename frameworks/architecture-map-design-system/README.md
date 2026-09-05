# Architecture Map Design System

The diagram design language used across every architecture map in this portfolio. It exists to make system diagrams that a non-engineer stakeholder can read in seconds, while remaining precise enough for an engineer to trust.

Most technical diagrams fail one of two audiences: they are either so abstract they say nothing, or so implementation-detailed (function names, API paths, class diagrams) that only their author can read them. This system is tuned for the middle: the level at which a diagram communicates *how a system works* to anyone who needs to understand it.

---

## The Problem It Solves

A diagram is a communication tool, and its job is to transfer a mental model of the system as fast as possible. Two common styles undermine that job:

- **The flowchart-of-code.** Boxes labeled with function names and arrows labeled with API calls. Accurate, but unreadable to anyone who is not already in the codebase. It documents implementation, not understanding.
- **The abstract blob.** Three vague clouds and an arrow. Readable, but it conveys nothing actionable.

This system defines a consistent middle style — labeled component blocks in plain language, sequential data flow, and clear infrastructure boundaries — so every map in the portfolio reads the same way and communicates to both audiences at once.

---

## Design Principles

### Visual Language
- **Dark theme.** Background `#0d1117`, primary text `#e6edf3`, muted borders and secondary elements `#30363d`. Dark backgrounds reduce visual noise and let the labeled components carry the attention.
- **Card-based components.** Each system component is a card with a subtle shadow, not a bare rectangle. The shadow creates a soft depth cue that separates components from the background without hard lines.
- **Zone-based layout.** A three-column or zone-based structure, typically flowing input on the left, processing in the middle, output on the right. Related components share a zone.

### Labeling
- **Plain-English labels only.** A component is labeled by what it *does* ("Enrich against watchlist"), never by how it is implemented ("enrich_watchlist()") and never by an API path. If a stakeholder cannot read a label aloud and understand it, the label is wrong.
- **Numbered or lettered sequential steps.** The primary data flow is numbered (1, 2, 3...) or lettered so the reader has an explicit path to follow rather than guessing the order.
- **Muted uppercase section headers.** Zone and section headers are set in a muted uppercase treatment so they organize the diagram without competing with the component labels.

### Flow and Structure
- **Clean directional arrows.** Arrows show data flow with a single, consistent arrowhead style. Direction is always meaningful — an arrow means something moves along it.
- **Shared infrastructure bar.** Cross-cutting infrastructure (shared services, data stores, integrations that many components touch) is drawn as a bar along the bottom, rather than being wired to every component individually. This keeps the main flow uncluttered while still showing the shared foundation.
- **Version stamp.** Every map carries a version stamp so a reader knows which iteration they are looking at and diagrams can be revised with a clear history.

---

## Anatomy of a Map

```
+-----------------------------------------------------------+
|  MAP TITLE                                      v3.1      |
+-----------------------------------------------------------+
|  INPUT ZONE      |  PROCESSING ZONE   |  OUTPUT ZONE      |
|                  |                    |                   |
|  [1] Component ->|  [2] Component  -> |  [3] Component    |
|      card        |      card          |      card         |
|                  |                    |                   |
+-----------------------------------------------------------+
|  SHARED INFRASTRUCTURE:  service  |  store  |  integration |
+-----------------------------------------------------------+
```

- Title and version stamp anchor the top.
- Zones run left to right following the data flow.
- Numbered cards give the reader an explicit path.
- The shared infrastructure bar collects cross-cutting dependencies at the bottom.

---

## Why These Choices

Every rule in the system serves readability under time pressure — the reality that a diagram is usually looked at for a few seconds in a meeting, not studied.

- Plain-English labels mean no translation step for a non-engineer.
- Numbered steps remove the guesswork of reading order.
- The infrastructure bar prevents the "spaghetti" that makes shared-dependency diagrams unreadable.
- The consistent dark theme and card style mean that once a reader has seen one map in the portfolio, every other map is immediately familiar — the design language itself becomes a form of documentation.

---

## Application

This design system is applied across all architecture maps in the portfolio — the agent maps in the [cybersecurity-projects](https://github.com/SwooshJ-SecAI/cybersecurity-projects) and [ai-engineering](https://github.com/SwooshJ-SecAI/ai-engineering) repositories all follow it. A new map is produced by following these principles rather than inventing a fresh style each time, which is what keeps the portfolio visually coherent.

---

*Part of the [SwooshJ-SecAI](https://github.com/SwooshJ-SecAI) portfolio. Built with Amazon Quick.*
