from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

from backend.services.briefing_generator import stream_briefing

router = APIRouter()


@router.get("/{contact_name}")
async def generate_briefing(contact_name: str):
    return EventSourceResponse(
        stream_briefing(contact_name),
        media_type="text/event-stream",
    )
