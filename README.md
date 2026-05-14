# MeetingMind

An AI meeting memory agent that ensures nothing from your meetings falls through the cracks. Built on [EverOS](https://github.com/EverMind-AI/EverOS) for the Memory Genesis Competition 2026.

**Demo Video:** [Watch on YouTube](https://youtu.be/LOcvUe3Rhg4)

## 1. Features

- **Meeting Notes Ingestion** -- Submit meeting notes with participants and dates. MeetingMind stores them as persistent episodic memories in EverOS and automatically generates summaries.
- **Automatic Commitment Extraction** -- An LLM analyzes each meeting to extract commitments: who owes what to whom, with due dates. Commitments are tracked with pending/completed/overdue status.
- **Contact Profiles** -- Each contact has a dedicated page showing meeting history, open commitments, and profile insights from EverOS memory.
- **Pre-Meeting Briefing** -- Before meeting someone, generate a streaming briefing that pulls together past discussions, open commitments, and relationship context. Delivered via real-time SSE streaming.
- **Semantic Memory Search** -- Search across all stored memories with three retrieval modes:
  - **Quick** (keyword, <100ms) -- exact match
  - **Smart** (hybrid, ~300ms) -- combined keyword + vector
  - **Deep** (agentic, 2-5s) -- LLM-guided query expansion for complex questions
- **Memory Type Visualization** -- Search results display color-coded badges for different EverOS memory types (Episode, Profile, Foresight, Event).

## 2. How We Use EverOS Memory

MeetingMind integrates deeply with the EverOS Cloud API across three dimensions:

### Memory Storage
When a meeting is submitted, each participant's notes are stored as messages via `store_message` with `flush: true` for immediate memory extraction. EverOS processes these into episodic memories that capture the semantic essence of discussions.

### Memory Retrieval (4 methods)
- **Keyword retrieval** -- Fast exact-match search for known terms (used in Quick search mode)
- **Vector retrieval** -- Semantic similarity search that understands meaning, not just words
- **Hybrid retrieval** -- Combines keyword + vector for balanced results (default for search, used for profile queries)
- **Agentic retrieval** -- LLM-powered query expansion that breaks complex questions into sub-queries, retrieves from multiple angles, and synthesizes results (used for briefing generation)

### Memory Types
- **Episodic Memory** -- Records of what happened in meetings: discussions, decisions, action items
- **Profile Memory** -- Accumulated knowledge about contacts: communication preferences, interests, working style
- **Foresight / Event Log** -- Future-oriented predictions and structured event records (supported in search display)

### Architecture Flow
```
Meeting Notes --> store_message (EverOS) --> Episodic Memory Formation
                                            --> Profile Memory Consolidation

Briefing Request --> agentic retrieval (episodic) + hybrid retrieval (profile)
                --> LLM generates contextual briefing via SSE streaming

Search Query --> user-selected retrieval method --> formatted results with memory type badges
```

## 3. How Memory Helps Users

**Problem:** People forget what was discussed in meetings, lose track of promises made, and walk into follow-up meetings without context.

**Solution with EverOS memory:**

1. **Never lose meeting context** -- Every discussion is stored as persistent episodic memory. Unlike simple note-taking, EverOS extracts the semantic meaning, so searching for "budget concerns" finds relevant discussions even if the word "budget" was never used.

2. **Track commitments automatically** -- Instead of manually maintaining a task list from meetings, MeetingMind extracts commitments with owner, recipient, and due dates. Users see at a glance what they owe others and what others owe them.

3. **Walk into meetings prepared** -- The briefing feature uses agentic retrieval to pull together everything relevant about a contact: past discussions, open commitments, and relationship insights. This takes 2-5 seconds instead of 30 minutes of manual note review.

4. **Build relationship memory over time** -- As more meetings are recorded, EverOS builds profile memories that capture communication preferences and working patterns. The system gets more useful with every meeting.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), Tailwind v4, Framer Motion |
| Backend | FastAPI (async), SSE via sse-starlette |
| Memory | EverOS Cloud API (api.evermind.ai) |
| LLM | OpenAI GPT for commitment extraction and briefing generation |
| Theme | Dark Obsidian + Amber, oklch color space |

## Getting Started

```bash
# 1. Clone and setup
git clone https://github.com/calderbuild/meetingmind.git
cd meetingmind
cp .env.template .env

# 2. Start backend (Python 3.11+)
make backend    # runs on port 8000

# 3. Start frontend (Node 22)
make frontend   # runs on port 3000

# 4. Seed demo data
make seed
```

Set `EVEROS_MODE=mock` in `.env` to run without API keys (default). Set `EVEROS_MODE=cloud` with `EVEROS_API_KEY` and `OPENAI_API_KEY` for full EverOS integration.

## License

MIT
