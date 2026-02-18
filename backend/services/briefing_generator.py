import json
from typing import AsyncGenerator

from backend.services.evermemos_client import get_client
from backend.services.llm_client import stream_briefing_text


async def stream_briefing(contact_name: str) -> AsyncGenerator[str, None]:
    """Orchestrate briefing generation: retrieve memories, then stream LLM output."""
    # 1. Retrieve memories from EverMemOS
    client = get_client()
    memories_raw = await client.search(
        query=f"{contact_name} discussions commitments decisions",
        retrieve_method="hybrid",
        top_k=15,
    )

    # 2. Get local commitments (pending + overdue)
    from backend.routers.commitments import commitments_store, _apply_overdue

    contact_lower = contact_name.lower()
    contact_commitments = [
        _apply_overdue(c)
        for c in commitments_store.values()
        if contact_lower in c.owner.lower()
        or contact_lower in c.recipient.lower()
    ]
    open_commitments = [
        c for c in contact_commitments
        if c.status.value in ("pending", "overdue")
    ]

    # 3. Format context for LLM
    memories_text = _format_memories(memories_raw)
    commitments_text = _format_commitments(open_commitments)

    # 4. Stream LLM briefing
    async for chunk in stream_briefing_text(
        contact_name, memories_text, commitments_text
    ):
        yield json.dumps({"type": "token", "content": chunk})

    yield json.dumps({"type": "done"})


def _format_memories(raw: dict) -> str:
    lines = []
    memories = raw.get("result", {}).get("memories", [])
    for group in memories:
        for mem_type, items in group.items():
            for item in items:
                summary = item.get("summary", item.get("episode", ""))
                timestamp = item.get("timestamp", "")
                lines.append(f"[{mem_type}] ({timestamp}) {summary}")
    return "\n".join(lines) if lines else "No previous memories found."


def _format_commitments(commitments: list) -> str:
    if not commitments:
        return "No pending commitments."
    lines = []
    for c in commitments:
        due = f" (due: {c.due_date.strftime('%Y-%m-%d')})" if c.due_date else ""
        status_tag = f" [OVERDUE]" if c.status.value == "overdue" else ""
        direction = "You owe" if c.direction.value == "i_owe" else "They owe you"
        lines.append(f"- [{direction}] {c.description} (owner: {c.owner} -> {c.recipient}){due}{status_tag}")
    return "\n".join(lines)
