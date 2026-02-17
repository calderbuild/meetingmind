from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.routers import briefings, commitments, meetings, search


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"Starting {settings.app_name} (EverMemOS mode: {settings.evermemos_mode})")
    yield
    print("Shutting down")


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meetings.router, prefix="/api/meetings", tags=["meetings"])
app.include_router(briefings.router, prefix="/api/briefings", tags=["briefings"])
app.include_router(commitments.router, prefix="/api/commitments", tags=["commitments"])
app.include_router(search.router, prefix="/api/search", tags=["search"])


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "evermemos_mode": settings.evermemos_mode,
    }
