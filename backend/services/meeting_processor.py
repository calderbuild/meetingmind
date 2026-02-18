import json
import uuid
from datetime import datetime, timezone

from backend.models.schemas import (
    Commitment,
    CommitmentDirection,
    CommitmentStatus,
    MeetingStatus,
)


async def process_meeting(meeting_id: str, meetings_store: dict) -> None:
    """Background task: extract commitments and store memories."""
    meeting = meetings_store.get(meeting_id)
    if not meeting:
        return

    try:
        # 1. Store in EverMemOS
        from backend.services.evermemos_client import get_client

        client = get_client()
        for i, participant in enumerate(meeting.participants):
            await client.store_message(
                message_id=f"{meeting_id}_{i}",
                timestamp=meeting.meeting_date.isoformat(),
                sender_id=participant.lower().replace(" ", "_"),
                content=meeting.notes,
                meeting_id=meeting_id,
                meeting_name=meeting.title,
                sender_name=participant,
            )

        # 2. Extract commitments via LLM
        from backend.services.llm_client import extract_commitments

        raw_commitments = await extract_commitments(
            meeting.notes, meeting.participants
        )

        # 3. Store commitments
        from backend.routers.commitments import commitments_store

        for rc in raw_commitments:
            cid = str(uuid.uuid4())
            owner_lower = rc.get("owner", "").lower().strip()
            self_refs = {"me", "i", "user", "you", "myself"}
            direction = (
                CommitmentDirection.I_OWE
                if owner_lower in self_refs
                else CommitmentDirection.OWED_TO_ME
            )
            due_date = None
            if rc.get("due_date"):
                try:
                    due_date = datetime.fromisoformat(rc["due_date"])
                except (ValueError, TypeError):
                    pass

            commitments_store[cid] = Commitment(
                id=cid,
                description=rc.get("description", ""),
                owner=rc.get("owner", "Unknown"),
                recipient=rc.get("recipient", "Unknown"),
                direction=direction,
                due_date=due_date,
                status=CommitmentStatus.PENDING,
                meeting_id=meeting_id,
                meeting_title=meeting.title,
                created_at=datetime.now(timezone.utc),
            )

        # 4. Mark meeting as completed
        meeting.status = MeetingStatus.COMPLETED
        meetings_store[meeting_id] = meeting

    except Exception as e:
        print(f"Meeting processing failed: {e}")
        meeting.status = MeetingStatus.FAILED
        meetings_store[meeting_id] = meeting
