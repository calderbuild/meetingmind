# Repository Guidelines

## Project Structure & Module Organization
- `backend/`: FastAPI service (`backend.main:app`) with routers in `backend/routers/`, schemas in `backend/models/schemas.py`, and integrations/business logic in `backend/services/`.
- `frontend/`: Next.js App Router app. Routes live in `frontend/src/app/`, shared UI in `frontend/src/components/`, and API/types in `frontend/src/lib/api.ts`.
- `scripts/`: utility scripts, including `scripts/seed_demo.py` for demo data.
- Root docs/config: `README.md`, `Makefile`, `.env.template`.

## Build, Test, and Development Commands
Run from repository root unless noted.
- `make backend`: starts FastAPI on `:8000` with reload.
- `make frontend`: starts Next.js dev server on `:3000`.
- `make seed`: seeds demo meetings (backend must be running).
- `cd frontend && npm run lint`: runs ESLint (Next.js + TypeScript rules).
- `cd frontend && npm run build`: production build check.

## Coding Style & Naming Conventions
- Python: PEP 8, 4-space indentation, type hints where practical, `snake_case` for modules/functions, and absolute imports like `from backend.routers import meetings`.
- TypeScript/React: follow existing 2-space indentation and ESLint guidance; components/types use `PascalCase`, variables/functions use `camelCase`.
- Routes/files: keep Next.js route folders and UI component filenames consistent with existing `kebab-case` patterns.

## Testing Guidelines
- No automated test suite is currently configured.
- Minimum validation before PR: `npm run lint` and `npm run build` in `frontend/`, plus a backend health check (`GET /health`) and key API flow smoke test (submit meeting, view commitments, run briefing stream).
- If adding tests, place them near the feature or under dedicated `tests/` folders and use clear names reflecting behavior.

## Commit & Pull Request Guidelines
- Follow Conventional Commit style seen in history: `feat(frontend): ...`, `feat(backend): ...`, `docs: ...`, `chore: ...`.
- Keep commits focused and scoped; use imperative summaries.
- PRs should include:
  - what changed and why,
  - manual verification steps/commands,
  - linked issue (if applicable),
  - screenshots for UI changes.

## Security & Configuration Tips
- Copy `.env.template` to `.env`; never commit secrets.
- Use `EVEROS_MODE=mock` for local/dev without external keys.
- Use `EVEROS_MODE=cloud` only when `EVEROS_API_KEY` and `OPENAI_API_KEY` are set.
