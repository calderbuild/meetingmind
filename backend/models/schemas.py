from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


# --- Meeting ---

class MeetingInput(BaseModel):
    title: str = Field(..., max_length=200)
    participants: list[str] = Field(..., max_length=50)
    meeting_date: datetime
    notes: str = Field(..., max_length=50000)


class MeetingStatus(str, Enum):
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Meeting(BaseModel):
    id: str
    title: str
    participants: list[str]
    meeting_date: datetime
    notes: str
    summary: str | None = None
    status: MeetingStatus = MeetingStatus.PROCESSING
    created_at: datetime


class MeetingResponse(BaseModel):
    meeting_id: str
    status: MeetingStatus


# --- Commitment ---

class CommitmentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    OVERDUE = "overdue"


class CommitmentDirection(str, Enum):
    I_OWE = "i_owe"       # I promised someone
    OWED_TO_ME = "owed_to_me"  # Someone promised me


class Commitment(BaseModel):
    id: str
    description: str
    owner: str  # Who made the promise
    recipient: str  # Who it was promised to
    direction: CommitmentDirection
    due_date: datetime | None = None
    status: CommitmentStatus = CommitmentStatus.PENDING
    meeting_id: str
    meeting_title: str
    created_at: datetime
    completed_at: datetime | None = None


class CommitmentUpdate(BaseModel):
    status: CommitmentStatus | None = None
    due_date: datetime | None = None


# --- Briefing ---

class BriefingRequest(BaseModel):
    contact_name: str = Field(..., max_length=100)


# --- Search ---

class SearchRequest(BaseModel):
    query: str = Field(..., max_length=1000)
    contact: str | None = Field(None, max_length=100)


class SearchResult(BaseModel):
    content: str
    meeting_title: str
    meeting_date: datetime
    participants: list[str]
    memory_type: str  # episodic_memory, foresight, event_log, etc.
    relevance_score: float | None = None


# --- Memory types for UI display ---

class MemoryType(str, Enum):
    COMMITMENT = "commitment"
    DECISION = "decision"
    FACT = "fact"
    RELATIONSHIP = "relationship"


class ExtractedMemory(BaseModel):
    type: MemoryType
    content: str
    participants: list[str] = []
