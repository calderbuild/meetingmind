# MeetingMind

AI-powered meeting memory agent built on [EverMemOS](https://www.evermind.ai/). Submit meeting transcripts, automatically extract commitments, and generate pre-meeting briefings for any contact.

**Track:** Agent + Memory | **Competition:** Memory Genesis Competition 2026

## Features

- **Meeting Processing** -- Submit transcripts, AI extracts commitments and stores episodic memories in EverMemOS
- **Commitment Tracking** -- Bidirectional tracking (what you owe / what's owed to you) with status management
- **Contact Briefings** -- Real-time streamed briefings with last meeting summary, open commitments, and relationship context
- **Semantic Search** -- Hybrid search across all stored meeting memories via EverMemOS retrieval API

## Architecture

```
Next.js 15 (App Router)  -->  FastAPI (async)  -->  EverMemOS Cloud API
     |                            |                       |
  Tailwind v4               OpenAI GPT-4o           Memory Storage
  Framer Motion             SSE Streaming           Hybrid Retrieval
  Obsidian+Amber Theme      Mock Mode               Episodic Memory
```

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+ (22 recommended)
- OpenAI API key (optional, mock mode works without it)
- EverMemOS API key (optional, mock mode works without it)

### Setup

```bash
# Clone
git clone https://github.com/calderbuild/meetingmind.git
cd meetingmind

# Environment
cp .env.template .env
# Edit .env to add your API keys (or leave empty for mock mode)

# Backend
pip install -r backend/requirements.txt

# Frontend
cd frontend && npm install && cd ..
```

### Run

```bash
# Terminal 1: Backend
make backend

# Terminal 2: Frontend
make frontend

# Terminal 3: Seed demo data
make seed
```

Open http://localhost:3000

## Project Structure

```
backend/
  config.py                 # Pydantic settings from .env
  main.py                   # FastAPI app with CORS and routers
  models/schemas.py         # Data models (Meeting, Commitment, Search)
  routers/
    meetings.py             # POST submit, GET list/detail
    commitments.py          # GET list, PATCH status
    briefings.py            # GET SSE streaming briefing
    search.py               # GET semantic search
  services/
    evermemos_client.py     # EverMemOS Cloud + Mock client
    llm_client.py           # OpenAI extraction + streaming
    meeting_processor.py    # Background: store memories + extract commitments
    briefing_generator.py   # Orchestrate retrieval + LLM streaming

frontend/
  src/app/
    page.tsx                # Dashboard
    meetings/new/page.tsx   # Submit meeting
    meetings/[id]/page.tsx  # Meeting detail + commitments
    briefings/[contact]/    # Streaming contact briefing
    commitments/page.tsx    # Commitment tracker
    search/page.tsx         # Memory search
  src/components/
    layout/sidebar.tsx      # App navigation
    ui/                     # Button, Card, Badge, Input, Textarea, Separator

scripts/
  seed_demo.py              # Seed 3 demo meetings with realistic transcripts
```

## EverMemOS Integration

MeetingMind uses the EverMemOS Cloud API (`api.evermind.ai/api/v0`) for:

| Endpoint | Usage |
|----------|-------|
| `POST /memories` | Store meeting messages as episodic memories |
| `GET /memories/search` | Hybrid semantic search for briefing context |
| `GET /memories` | Retrieve stored memories by type |

Set `EVERMEMOS_MODE=cloud` in `.env` and provide your API key to enable.
Default `EVERMEMOS_MODE=mock` uses an in-memory store for development.

## License

MIT
