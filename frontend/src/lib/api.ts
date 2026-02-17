const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// --- Meetings ---

export interface MeetingInput {
  title: string;
  participants: string[];
  meeting_date: string;
  notes: string;
}

export interface Meeting {
  id: string;
  title: string;
  participants: string[];
  meeting_date: string;
  notes: string;
  status: "processing" | "completed" | "failed";
  created_at: string;
}

export async function submitMeeting(data: MeetingInput) {
  return request<{ meeting_id: string; status: string }>("/api/meetings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMeetings() {
  return request<Meeting[]>("/api/meetings");
}

export async function getMeeting(id: string) {
  return request<Meeting>(`/api/meetings/${id}`);
}

// --- Commitments ---

export interface Commitment {
  id: string;
  description: string;
  owner: string;
  recipient: string;
  direction: "i_owe" | "owed_to_me";
  due_date: string | null;
  status: "pending" | "completed" | "overdue";
  meeting_id: string;
  meeting_title: string;
  created_at: string;
  completed_at: string | null;
}

export async function getCommitments(params?: { status?: string; contact?: string }) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.contact) query.set("contact", params.contact);
  const qs = query.toString();
  return request<Commitment[]>(`/api/commitments${qs ? `?${qs}` : ""}`);
}

export async function updateCommitment(id: string, data: { status?: string; due_date?: string }) {
  return request<Commitment>(`/api/commitments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// --- Briefings (SSE) ---

export function streamBriefing(
  contactName: string,
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (err: Error) => void
) {
  const url = `${API_BASE}/api/briefings/${encodeURIComponent(contactName)}`;
  const eventSource = new EventSource(url);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "token") {
        onToken(data.content);
      } else if (data.type === "done") {
        onDone();
        eventSource.close();
      }
    } catch {
      onError(new Error("Failed to parse SSE data"));
      eventSource.close();
    }
  };

  eventSource.onerror = () => {
    onError(new Error("SSE connection failed"));
    eventSource.close();
  };

  return () => eventSource.close();
}

// --- Search ---

export interface SearchResult {
  content: string;
  meeting_title: string;
  meeting_date: string;
  participants: string[];
  memory_type: string;
  relevance_score: number | null;
}

export async function searchMemories(query: string, contact?: string) {
  const params = new URLSearchParams({ query });
  if (contact) params.set("contact", contact);
  return request<SearchResult[]>(`/api/search?${params.toString()}`);
}
