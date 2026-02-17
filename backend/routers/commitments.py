from fastapi import APIRouter, HTTPException

from backend.models.schemas import Commitment, CommitmentStatus, CommitmentUpdate

router = APIRouter()

# In-memory store (shared with meeting processor)
commitments_store: dict[str, Commitment] = {}


@router.get("", response_model=list[Commitment])
async def list_commitments(
    status: CommitmentStatus | None = None,
    contact: str | None = None,
):
    results = list(commitments_store.values())
    if status:
        results = [c for c in results if c.status == status]
    if contact:
        contact_lower = contact.lower()
        results = [
            c
            for c in results
            if contact_lower in c.owner.lower()
            or contact_lower in c.recipient.lower()
        ]
    return sorted(results, key=lambda c: c.due_date or c.created_at)


@router.patch("/{commitment_id}", response_model=Commitment)
async def update_commitment(commitment_id: str, update: CommitmentUpdate):
    commitment = commitments_store.get(commitment_id)
    if not commitment:
        raise HTTPException(status_code=404, detail="Commitment not found")

    if update.status is not None:
        commitment.status = update.status
        if update.status == CommitmentStatus.COMPLETED:
            from datetime import datetime, timezone

            commitment.completed_at = datetime.now(timezone.utc)
    if update.due_date is not None:
        commitment.due_date = update.due_date

    commitments_store[commitment_id] = commitment
    return commitment
