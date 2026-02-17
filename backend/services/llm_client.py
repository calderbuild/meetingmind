import json
from typing import AsyncGenerator

from openai import AsyncOpenAI

from backend.config import settings

_client: AsyncOpenAI | None = None


def _get_openai() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _client


EXTRACT_COMMITMENTS_PROMPT = """\
You are a meeting analyst. Extract commitments (action items, promises, deadlines) from the meeting notes below.

Participants: {participants}

For each commitment, provide:
- description: What was promised
- owner: Who made the promise (use exact participant name, or "User" if it's the note-taker)
- recipient: Who it was promised to
- due_date: ISO 8601 date if mentioned, null otherwise

Return a JSON array of commitments. If no commitments found, return [].

<meeting>
{notes}
</meeting>

Return ONLY valid JSON array, no other text."""

BRIEFING_PROMPT = """\
You are a meeting preparation assistant. Generate a concise pre-meeting briefing based on the following memories about {contact_name}.

Structure the briefing in 4 sections:
1. **Last Meeting Summary** - What was discussed most recently
2. **Open Commitments** - Pending promises (both directions: what I owe them, what they owe me)
3. **Relationship Profile** - Communication style, key interests, preferences
4. **Related Context** - Relevant information from other meetings or participants

Keep each section to 2-4 sentences. Be specific and actionable.

Memories:
{memories}

Commitments:
{commitments}"""


def _has_real_api_key() -> bool:
    key = settings.openai_api_key
    return bool(key and key.startswith("sk-") and "your" not in key)


async def extract_commitments(notes: str, participants: list[str]) -> list[dict]:
    """Extract commitments from meeting notes using LLM."""
    if not _has_real_api_key():
        return _mock_extract_commitments(notes, participants)

    client = _get_openai()
    prompt = EXTRACT_COMMITMENTS_PROMPT.format(
        participants=", ".join(participants),
        notes=notes,
    )

    response = await client.chat.completions.create(
        model=settings.llm_model_analysis,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=2000,
    )

    text = response.choices[0].message.content or "[]"
    # Strip markdown code fences if present
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        print(f"LLM returned invalid JSON: {text[:200]}")
        return []


async def stream_briefing_text(
    contact_name: str,
    memories_text: str,
    commitments_text: str,
) -> AsyncGenerator[str, None]:
    """Stream briefing generation via LLM."""
    if not _has_real_api_key():
        async for chunk in _mock_stream_briefing(contact_name):
            yield chunk
        return

    client = _get_openai()
    prompt = BRIEFING_PROMPT.format(
        contact_name=contact_name,
        memories=memories_text,
        commitments=commitments_text,
    )

    stream = await client.chat.completions.create(
        model=settings.llm_model_stream,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=800,
        stream=True,
    )

    async for chunk in stream:
        delta = chunk.choices[0].delta
        if delta.content:
            yield delta.content


def _mock_extract_commitments(notes: str, participants: list[str]) -> list[dict]:
    """Fallback when no OpenAI key is configured. Generates realistic mock commitments."""
    if len(participants) < 2:
        return [
            {
                "description": "Follow up on action items from meeting",
                "owner": participants[0] if participants else "User",
                "recipient": "Team",
                "due_date": None,
            }
        ]
    return [
        {
            "description": f"Share meeting summary with {participants[1]}",
            "owner": participants[0],
            "recipient": participants[1],
            "due_date": None,
        },
        {
            "description": f"Review and send feedback on the discussed proposal",
            "owner": participants[1],
            "recipient": participants[0],
            "due_date": "2026-02-28T00:00:00Z",
        },
    ]


async def _mock_stream_briefing(contact_name: str) -> AsyncGenerator[str, None]:
    """Fallback mock streaming for development."""
    import asyncio

    sections = [
        f"## Last Meeting Summary\n\nYou last met with {contact_name} to discuss project progress. Key topics included timeline adjustments and resource allocation.\n\n",
        f"## Open Commitments\n\n**You owe {contact_name}:**\n- Competitive analysis report (overdue)\n\n**{contact_name} owes you:**\n- Design team feedback\n\n",
        f"## Relationship Profile\n\n{contact_name} prefers data-driven discussions and values concise updates. They tend to focus on performance metrics and deadlines.\n\n",
        f"## Related Context\n\nIn a separate meeting, the team discussed related budget approvals that may affect your discussion with {contact_name}.\n",
    ]

    for section in sections:
        for char in section:
            yield char
            await asyncio.sleep(0.01)
        await asyncio.sleep(0.3)
