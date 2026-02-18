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
Next.js 15 (App Router)  -->  FastAPI (async, port 8000)  -->  EverMemOS Cloud API
     |                            |                                |
  Tailwind v4               In-memory dicts                  api.evermind.ai/api/v0
  Framer Motion             SSE via sse-starlette            Episodic memory storage
  Obsidian+Amber theme      BackgroundTasks for processing   Hybrid semantic search
```

**Backend** serves a REST API at `/api/*`. Four routers: `meetings`, `commitments`, `briefings`, `search`. All data lives in Python dicts (`meetings_store`, `commitments_store`) -- no database. Meeting submission triggers background processing: store memories in EverMemOS, then extract commitments via LLM.

**Frontend** is a Next.js 15 App Router project with 6 pages. API calls go through `src/lib/api.ts` which points to `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`). Briefing page uses `EventSource` for SSE streaming.

**EverMemOS client** (`backend/services/evermemos_client.py`) has two modes controlled by `EVERMEMOS_MODE` env var: `mock` (in-memory, no API keys needed) and `cloud` (real API calls to `api.evermind.ai`).

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

## Environment

Copy `.env.template` to `.env`. Set `EVERMEMOS_MODE=mock` (default) to run without any API keys. Set `EVERMEMOS_MODE=cloud` and provide `EVERMEMOS_API_KEY` + `OPENAI_API_KEY` for real integrations.
