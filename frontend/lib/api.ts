const BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Person types ─────────────────────────────────────────────────────────────

export interface PersonPayload {
  name: string;
  nickname?: string;
  gender?: string;
  /** Frontend sends `categories` array; we map it to `tags` for the backend */
  categories?: string[];
  notes?: string;
}

export interface RelationshipPayload {
  from_id: string;
  to_id: string;
  type: string;
  indian_name?: string;
}

// ─── People / Persons ─────────────────────────────────────────────────────────

/** GET /persons — list all people */
export async function getPersons() {
  return request<unknown[]>(`${BASE}/persons`);
}

/** POST /persons — create a new person */
export async function createPerson(payload: PersonPayload) {
  return request<unknown>(`${BASE}/persons`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: payload.name,
      nickname: payload.nickname ?? null,
      gender: payload.gender ?? null,
      tags: payload.categories ?? [],
      notes: payload.notes ?? null,
    }),
  });
}

/** GET /persons/:id — get a single person */
export async function getPerson(id: string) {
  return request<unknown>(`${BASE}/persons/${id}`);
}

/** DELETE /persons/:id — delete a person */
export async function deletePerson(id: string) {
  return request<unknown>(`${BASE}/persons/${id}`, { method: "DELETE" });
}

/** PATCH /persons/:id — update a person */
export async function updatePerson(id: string, payload: Partial<PersonPayload>) {
  return request<unknown>(`${BASE}/persons/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/** GET /persons/search?q=... — search people by name */
export async function searchPeople(q: string) {
  return request<unknown[]>(
    `${BASE}/persons?q=${encodeURIComponent(q)}`
  );
}

// ─── Relationships ────────────────────────────────────────────────────────────

/** POST /relationships — create a relationship */
export async function createRelationship(payload: RelationshipPayload) {
  return request<unknown>(`${BASE}/relationships`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      from_person_id: payload.from_id,
      to_person_id: payload.to_id,
      relation_type: payload.type,
      relation_label: payload.indian_name ?? null,
    }),
  });
}

/** GET /relationships — list all relationships */
export async function getRelationships() {
  return request<unknown[]>(`${BASE}/relationships`);
}

/** DELETE /relationships/:id */
export async function deleteRelationship(id: string) {
  return request<unknown>(`${BASE}/relationships/${id}`, { method: "DELETE" });
}

// ─── Graph ────────────────────────────────────────────────────────────────────

/** GET /graph/full — full graph for D3 visualization */
export async function getFullGraph() {
  return request<unknown>(`${BASE}/graph/full`);
}

/** GET /graph/stats — dashboard statistics */
export async function getGraphStats() {
  return request<unknown>(`${BASE}/graph/stats`);
}

/** GET /graph/path?from_id=&to_id= — shortest relationship path */
export async function getRelationPath(fromId: string, toId: string) {
  return request<unknown>(
    `${BASE}/graph/path?from_id=${encodeURIComponent(fromId)}&to_id=${encodeURIComponent(toId)}`
  );
}

// ─── Memories ─────────────────────────────────────────────────────────────────

/** POST /memories/log — log a text memory */
export async function logMemory(raw_text: string) {
  return request<unknown>(`${BASE}/memories/log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raw_text }),
  });
}

/** POST /memories/voice — log a voice memory */
export async function logVoiceMemory(audioBlob: Blob) {
  const formData = new FormData();
  formData.append("file", audioBlob, "recording.wav");
  return request<unknown>(`${BASE}/memories/voice`, {
    method: "POST",
    body: formData,
  });
}

/** GET /memories — recent memories feed */
export async function getRecentMemories(limit = 20) {
  // Backend returns all memories in descending order.
  return request<unknown[]>(`${BASE}/memories`);
}

// ─── Search ───────────────────────────────────────────────────────────────────

/** POST /memories/search — semantic vector search */
export async function semanticSearch(q: string, k = 5) {
  return request<unknown[]>(`${BASE}/memories/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: q, limit: k }),
  });
}

// ─── Legacy object export (keep backward compat) ──────────────────────────────

export const api = {
  logMemory,
  logVoiceMemory,
  getRecentMemories,
  searchPeople,
  semanticSearch,
  getPersons,
  createPerson,
  getPerson,
  updatePerson,
  deletePerson,
  createRelationship,
  getRelationships,
  deleteRelationship,
  getFullGraph,
  getGraphStats,
  getRelationPath,
  getHealth,
};

// ─── Health ───────────────────────────────────────────────────────────────────

export async function getHealth() {
  return request<any>(`${BASE}/health`);
}
