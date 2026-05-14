from fastapi import APIRouter

from backend.config import settings
from backend.models.schemas import SearchRequest, SearchResult
from backend.services.everos_client import get_client

router = APIRouter()


def _normalize_user_id(name: str) -> str:
    return name.lower().replace(" ", "_")


@router.get("", response_model=list[SearchResult])
async def search_memories(
    query: str,
    contact: str | None = None,
    retrieve_method: str = "hybrid",
    memory_types: str | None = None,
):
    client = get_client()
    user_id = _normalize_user_id(contact) if contact else None
    # Cloud API requires user_id or group_ids
    if settings.everos_mode == "cloud" and not user_id:
        return []
    types_list = memory_types.split(",") if memory_types else None
    results = await client.search(
        query=query,
        user_id=user_id,
        retrieve_method=retrieve_method,
        memory_types=types_list,
        top_k=15,
    )
    return _format_results(results)


@router.get("/profiles/{contact_name}", response_model=list[SearchResult])
async def get_contact_profiles(contact_name: str):
    """Retrieve profile memories for a specific contact from EverOS."""
    client = get_client()
    user_id = _normalize_user_id(contact_name)
    results = await client.search(
        query=contact_name,
        user_id=user_id,
        retrieve_method="hybrid",
        memory_types=["profile"],
        top_k=10,
    )
    return _format_results(results)


def _flatten_memories(raw_results: dict) -> list[tuple[str, dict]]:
    """Extract (memory_type, item) pairs from either cloud or mock response format."""
    memories = raw_results.get("result", {}).get("memories", [])
    if not memories:
        return []
    first = memories[0]
    # Cloud format: flat list of dicts with "memory_type" key
    if isinstance(first, dict) and "memory_type" in first:
        return [(m.get("memory_type", "episodic_memory"), m) for m in memories]
    # Mock format: list of {type: [items]} groups
    pairs = []
    for group in memories:
        if isinstance(group, dict):
            for mem_type, items in group.items():
                if isinstance(items, list):
                    for item in items:
                        pairs.append((mem_type, item))
    return pairs


def _enrich_from_local(group_id: str, participants: list[str]) -> tuple[str, list[str]]:
    """Look up meeting title and map user_ids to display names from local store."""
    from backend.routers.meetings import meetings_store

    meeting = meetings_store.get(group_id)
    title = meeting.title if meeting else group_id
    if meeting:
        participants = list(meeting.participants)
    else:
        participants = [p.replace("_", " ").title() for p in participants]
    return title, participants


def _format_results(raw_results: dict) -> list[SearchResult]:
    formatted = []
    seen = set()
    for mem_type, item in _flatten_memories(raw_results):
        content = item.get("summary", item.get("episode", ""))
        group_id = item.get("group_id") or ""
        meeting_title = item.get("group_name") or group_id or "Unknown meeting"
        participants = item.get("participants", [])
        if not participants:
            sender = item.get("sender_name", item.get("user_id", ""))
            participants = [sender] if sender else []
        # Enrich with local meeting data or cloud subject field
        if not item.get("group_name") and group_id:
            meeting_title, participants = _enrich_from_local(group_id, participants)
        if meeting_title == group_id and item.get("subject"):
            meeting_title = item["subject"]
        dedup_key = content[:200]
        if dedup_key in seen:
            continue
        seen.add(dedup_key)
        formatted.append(
            SearchResult(
                content=content,
                meeting_title=meeting_title,
                meeting_date=item.get("timestamp", "2026-01-01T00:00:00"),
                participants=participants,
                memory_type=mem_type,
                relevance_score=None,
            )
        )
    return formatted
