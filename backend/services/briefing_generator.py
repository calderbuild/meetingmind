import json
from typing import AsyncGenerator

from backend.services.evermemos_client import get_client
from backend.services.llm_client import stream_briefing_text


async def stream_briefing(contact_name: str) -> AsyncGenerator[str, None]:
    """Orchestrate briefing generation: retrieve memories, then stream LLM output."""
    # 1. Retrieve episodic memories via agentic retrieval (deeper context)
    client = get_client()
    user_id = contact_name.lower().replace(" ", "_")
    memories_raw = await client.search(
        query=f"{contact_name} discussions commitments decisions",
        user_id=user_id,
        retrieve_method="agentic",
        top_k=15,
    )

    # 1b. Retrieve profile memories (communication style, preferences)
    profile_raw = await client.search(
        query=f"{contact_name} preferences habits communication style",
        user_id=user_id,
        retrieve_method="hybrid",
        memory_types=["profile"],
        top_k=5,
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
    episodic_text = _format_memories(memories_raw)
    profile_text = _format_memories(profile_raw)
    memories_text = episodic_text
    if profile_text and profile_text != "No previous memories found.":
        memories_text += f"\n\n--- Profile Insights ---\n{profile_text}"
    commitments_text = _format_commitments(open_commitments)

    # 4. Stream LLM briefing
    async for chunk in stream_briefing_text(
        contact_name, memories_text, commitments_text
    ):
        yield json.dumps({"type": "token", "content": chunk})

    yield json.dumps({"type": "done"})


def _format_memories(raw: dict) -> str:
    from backend.routers.search import _flatten_memories

    lines = []
    for mem_type, item in _flatten_memories(raw):
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
