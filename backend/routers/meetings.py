import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks

from backend.models.schemas import (
    Meeting,
    MeetingInput,
    MeetingResponse,
    MeetingStatus,
)
from backend.services.meeting_processor import process_meeting

router = APIRouter()

# In-memory store (sufficient for hackathon demo)
meetings_store: dict[str, Meeting] = {}


@router.post("", response_model=MeetingResponse, status_code=201)
async def create_meeting(
    meeting: MeetingInput,
    background_tasks: BackgroundTasks,
):
    meeting_id = str(uuid.uuid4())
    meetings_store[meeting_id] = Meeting(
        id=meeting_id,
        title=meeting.title,
        participants=meeting.participants,
        meeting_date=meeting.meeting_date,
        notes=meeting.notes,
        status=MeetingStatus.PROCESSING,
        created_at=datetime.now(timezone.utc),
    )
    background_tasks.add_task(process_meeting, meeting_id, meetings_store)
    return MeetingResponse(meeting_id=meeting_id, status=MeetingStatus.PROCESSING)


@router.get("", response_model=list[Meeting])
async def list_meetings(participant: str | None = None):
    results = list(meetings_store.values())
    if participant:
        p_lower = participant.lower()
        results = [
            m for m in results
            if any(p_lower in p.lower() for p in m.participants)
        ]
    return sorted(results, key=lambda m: m.meeting_date, reverse=True)


@router.get("/{meeting_id}", response_model=Meeting)
async def get_meeting(meeting_id: str):
    from fastapi import HTTPException

    meeting = meetings_store.get(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting
