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
    memories = raw_results.get("result", {}).get("memories", [])
    for group in memories:
        for mem_type, items in group.items():
            for item in items:
                formatted.append(
                    SearchResult(
                        content=item.get("summary", item.get("episode", "")),
                        meeting_title=item.get("group_name", "Unknown meeting"),
                        meeting_date=item.get("timestamp", "2026-01-01T00:00:00"),
                        participants=item.get("participants", []),
                        memory_type=mem_type,
                        relevance_score=None,
                    )
                )
    return formatted
