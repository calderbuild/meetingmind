"""EverMemOS client with Cloud API and Mock mode support."""

import json
from datetime import datetime, timezone
from typing import Protocol

import httpx

from backend.config import settings


class EverMemOSClient(Protocol):
    async def store_message(
        self,
        message_id: str,
        timestamp: str,
        sender_id: str,
        content: str,
        meeting_id: str,
        meeting_name: str = "",
        sender_name: str = "",
    ) -> dict: ...

    async def search(
        self,
        query: str,
        user_id: str | None = None,
        group_id: str | None = None,
        retrieve_method: str = "hybrid",
        memory_types: list[str] | None = None,
        top_k: int = 10,
    ) -> dict: ...

    async def get_memories(
        self,
        user_id: str | None = None,
        memory_type: str = "episodic_memory",
        limit: int = 40,
    ) -> dict: ...


class CloudClient:
    """EverMemOS Cloud API client (api.evermind.ai/api/v0)."""

    def __init__(self):
        self.base_url = f"{settings.evermemos_base_url}/api/v0"
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.evermemos_api_key}",
        }

    async def store_message(self, **kwargs) -> dict:
        payload = {
            "message_id": kwargs["message_id"],
            "create_time": kwargs["timestamp"],
            "sender": kwargs["sender_id"],
            "content": kwargs["content"],
            "group_id": kwargs["meeting_id"],
            "group_name": kwargs.get("meeting_name", ""),
            "sender_name": kwargs.get("sender_name", ""),
            "role": "user",
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.base_url}/memories",
                headers=self.headers,
                json=payload,
                timeout=30.0,
            )
            resp.raise_for_status()
            return resp.json()

    async def search(self, **kwargs) -> dict:
        payload = {"query": kwargs["query"], "top_k": kwargs.get("top_k", 10)}
        if kwargs.get("retrieve_method"):
            payload["retrieve_method"] = kwargs["retrieve_method"]
        if kwargs.get("user_id"):
            payload["user_id"] = kwargs["user_id"]
        if kwargs.get("group_id"):
            payload["group_id"] = kwargs["group_id"]
        if kwargs.get("memory_types"):
            payload["memory_types"] = kwargs["memory_types"]

        # EverMemOS uses GET + body (non-standard)
        async with httpx.AsyncClient() as client:
            resp = await client.request(
                "GET",
                f"{self.base_url}/memories/search",
                headers=self.headers,
                json=payload,
                timeout=30.0,
            )
            resp.raise_for_status()
            return resp.json()

    async def get_memories(self, **kwargs) -> dict:
        params = {
            "memory_type": kwargs.get("memory_type", "episodic_memory"),
            "limit": kwargs.get("limit", 40),
        }
        if kwargs.get("user_id"):
            params["user_id"] = kwargs["user_id"]

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/memories",
                headers=self.headers,
                params=params,
                timeout=30.0,
            )
            resp.raise_for_status()
            return resp.json()


class MockClient:
    """In-memory mock for development without EverMemOS."""

    def __init__(self):
        self._memories: list[dict] = []

    async def store_message(self, **kwargs) -> dict:
        memory = {
            "message_id": kwargs["message_id"],
            "timestamp": kwargs["timestamp"],
            "sender": kwargs["sender_id"],
            "sender_name": kwargs.get("sender_name", ""),
            "content": kwargs["content"],
            "group_id": kwargs["meeting_id"],
            "group_name": kwargs.get("meeting_name", ""),
            "memory_type": "episodic_memory",
        }
        self._memories.append(memory)
        return {"status": "ok", "result": {"count": 1, "status_info": "mock"}}

    async def search(self, **kwargs) -> dict:
        query_lower = kwargs["query"].lower()
        query_words = query_lower.split()
        user_id = kwargs.get("user_id")

        matches = []
        for mem in self._memories:
            score = 0
            content_lower = mem["content"].lower()
            group_lower = mem.get("group_name", "").lower()
            sender_lower = mem.get("sender_name", "").lower()
            # Match any query word against content, title, or sender
            for word in query_words:
                if word in content_lower:
                    score += 2
                if word in group_lower:
                    score += 1
                if word in sender_lower:
                    score += 1
            if user_id and user_id.lower() in sender_lower:
                score += 1
            if score > 0:
                matches.append((score, mem))

        matches.sort(key=lambda x: x[0], reverse=True)
        top_k = kwargs.get("top_k", 10)

        items = [
            {
                "summary": m["content"][:200],
                "episode": m["content"],
                "timestamp": m["timestamp"],
                "group_name": m["group_name"],
                "participants": [m["sender_name"]],
                "memory_type": "episodic_memory",
            }
            for _, m in matches[:top_k]
        ]

        return {
            "status": "ok",
            "result": {
                "memories": [{"episodic_memory": items}] if items else [],
                "total_count": len(items),
            },
        }

    async def get_memories(self, **kwargs) -> dict:
        limit = kwargs.get("limit", 40)
        return {
            "status": "ok",
            "result": {"memories": self._memories[:limit]},
        }


_instance: EverMemOSClient | None = None


def get_client() -> EverMemOSClient:
    global _instance
    if _instance is None:
        if settings.evermemos_mode == "cloud":
            _instance = CloudClient()
        else:
            _instance = MockClient()
    return _instance
