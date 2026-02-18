from fastapi import APIRouter

from backend.models.schemas import SearchRequest, SearchResult
from backend.services.evermemos_client import get_client

router = APIRouter()


@router.get("", response_model=list[SearchResult])
async def search_memories(query: str, contact: str | None = None):
    client = get_client()
    results = await client.search(
        query=query,
        user_id=contact,
        retrieve_method="hybrid",
        top_k=15,
    )
    return _format_results(results)


def _format_results(raw_results: dict) -> list[SearchResult]:
    formatted = []
    seen = set()
    memories = raw_results.get("result", {}).get("memories", [])
    for group in memories:
        for mem_type, items in group.items():
            for item in items:
                content = item.get("summary", item.get("episode", ""))
                meeting_title = item.get("group_name", "Unknown meeting")
                dedup_key = (content[:200], meeting_title)
                if dedup_key in seen:
                    # Merge participants into existing result
                    for existing in formatted:
                        if existing.content[:200] == content[:200] and existing.meeting_title == meeting_title:
                            sender = item.get("sender_name", "")
                            if sender and sender not in existing.participants:
                                existing.participants.append(sender)
                            break
                    continue
                seen.add(dedup_key)
                formatted.append(
                    SearchResult(
                        content=content,
                        meeting_title=meeting_title,
                        meeting_date=item.get("timestamp", "2026-01-01T00:00:00"),
                        participants=item.get("participants", []),
                        memory_type=mem_type,
                        relevance_score=None,
                    )
                )
    return formatted
