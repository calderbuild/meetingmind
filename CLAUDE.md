# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Backend (FastAPI) -- run from project root
make backend
# or: cd backend && uvicorn backend.main:app --reload --port 8000

# Frontend (Next.js) -- requires Node 22
source ~/.nvm/nvm.sh && nvm use 22
make frontend
# or: cd frontend && npx next dev --port 3000

# Seed demo data (backend must be running)
make seed

# Frontend build check
cd frontend && npx next build

# Frontend lint
cd frontend && npx eslint .
```

No test suite exists yet. Use `next build` as the primary frontend correctness check.

## Architecture

```
Next.js 15 (App Router)  -->  FastAPI (async, port 8000)  -->  EverOS Cloud API
     |                            |                                |
  Tailwind v4               In-memory dicts                  api.evermind.ai/api/v0
  Framer Motion             SSE via sse-starlette            4 memory types
  Obsidian+Amber theme      BackgroundTasks for processing   4 retrieval methods
```

**Backend** serves a REST API at `/api/*`. Four routers: `meetings`, `commitments`, `briefings`, `search`. All data lives in Python dicts (`meetings_store`, `commitments_store`) -- no database, all state lost on restart. Meeting submission triggers background processing: store memories in EverOS, then extract commitments via LLM. After any backend code change that triggers hot-reload, run `make seed` again to repopulate data.

**Frontend** is a Next.js 15 App Router project with 6 pages. API calls go through `src/lib/api.ts` which points to `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`). Briefing page uses `EventSource` for SSE streaming.

**EverOS client** (`backend/services/everos_client.py`) has two modes controlled by `EVEROS_MODE` env var: `mock` (in-memory, no API keys needed) and `cloud` (real API calls to `api.evermind.ai`).

### Memory Integration

EverOS provides 4 memory types: `episodic_memory`, `profile`, `foresight`, `event_log`. Note: `foresight` and `event_log` only work in "assistant" scene mode, not the project's "Team Collaboration" scene.

4 retrieval methods with different latency/depth tradeoffs:
- `keyword`: exact match, <100ms
- `vector`: semantic similarity, 200-500ms
- `hybrid` (default for search): combined keyword+vector, 200-600ms
- `agentic` (used by briefings): LLM-guided query expansion, 2-5s

Search API accepts `retrieve_method` and `memory_types` (comma-separated) query params. Briefing generator uses agentic retrieval for episodic memories + hybrid for profile memories.

## Key Conventions

### Backend (Python)

- All imports use absolute module paths: `from backend.config import settings`, `from backend.routers import meetings`
- Uvicorn entry point is `backend.main:app` (run from project root, not from `backend/`)
- Pydantic Settings loads `.env` from project root via `env_file=".env"`
- API key validation: `_has_real_api_key()` in `llm_client.py` checks key starts with `sk-` and doesn't contain `"your"`. When no real key, mock functions are used automatically.

### Frontend (TypeScript)

- Tailwind v4: CSS-based configuration in `globals.css`, no `tailwind.config.ts`
- Theme uses oklch color space with CSS custom properties (amber primary on dark surface)
- Font stack: Geist Sans (body), Geist Mono (code), Instrument Serif (display headings)
- UI components in `src/components/ui/` use CVA (class-variance-authority) + tailwind-merge
- All TypeScript types in `src/lib/api.ts` must match `backend/models/schemas.py` field names exactly

### SSE Streaming

`sse-starlette` EventSourceResponse automatically adds the `data:` prefix to each event. The briefing generator yields plain JSON strings -- do NOT manually prepend `data:`.

## EverOS Cloud Gotchas

- Cloud search requires `user_id` or `group_ids`; omitting both returns 422. The search router returns `[]` in cloud mode when no contact is provided.
- Cloud search uses `group_ids` (array), not `group_id` (string).
- `flush: true` in store_message forces immediate memory extraction, but processing is still async server-side (~20s before searchable).
- Cloud returns `group_name: null` (key present, value None) -- use `item.get("group_name") or fallback`, not `item.get("group_name", fallback)`.
- `create_time` must not be in the future; `meeting_processor.py` caps it to `min(meeting_date, now)`.
- User IDs are normalized as `name.lower().replace(" ", "_")` for consistent storage/retrieval.

## Environment

Copy `.env.template` to `.env`. Set `EVEROS_MODE=mock` (default) to run without any API keys. Set `EVEROS_MODE=cloud` and provide `EVEROS_API_KEY` + `OPENAI_API_KEY` for real integrations.
