import { 
  PersonCreate, 
  PersonResponse, 
  RelationshipCreate, 
  RelationshipResponse, 
  GraphData, 
  PathResponse, 
  RelationNameResponse,
  ApiError,
  GraphStats,
  HealthResponse,
} from '@/types/api';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

function mapPerson(person: Record<string, unknown>): PersonResponse {
  const tags = ((person.tags as string[] | undefined) ?? (person.categories as string[] | undefined) ?? []);
  return {
    id: String(person.id),
    name: String(person.name),
    nickname: person.nickname ? String(person.nickname) : undefined,
    gender: person.gender ? String(person.gender) : undefined,
    tags,
    categories: tags,
    notes: person.notes ? String(person.notes) : undefined,
    photo: person.photo ? String(person.photo) : undefined,
    created_at: person.created_at ? String(person.created_at) : undefined,
  };
}

function normalizeTags(tags?: string[]): string[] {
  return (tags ?? []).map((tag) => tag.toLowerCase());
}

async function handleResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    // Server returned non-JSON (e.g. plain-text "Internal Server Error")
    if (!response.ok) {
      throw { message: text || `HTTP ${response.status}`, status: response.status } as ApiError;
    }
    throw { message: 'Server returned an unexpected non-JSON response', status: response.status } as ApiError;
  }

  if (!response.ok) {
    const payload = data as Record<string, unknown>;
    const error: ApiError = {
      message: (payload?.detail as string) || (payload?.message as string) || `HTTP ${response.status}`,
      status: response.status,
    };
    throw error;
  }
  return data as T;
}

// Persons
export async function createPerson(data: PersonCreate): Promise<PersonResponse> {
  const response = await fetch(`${BASE_URL}/persons`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: data.name,
      nickname: data.nickname,
      gender: data.gender ? String(data.gender).toLowerCase() : undefined,
      tags: normalizeTags(data.tags ?? data.categories),
      notes: data.notes,
    }),
  });
  const result = await handleResponse<Record<string, unknown>>(response);
  return mapPerson(result);
}

export async function getPersons(): Promise<PersonResponse[]> {
  const response = await fetch(`${BASE_URL}/persons`);
  const result = await handleResponse<Record<string, unknown>[]>(response);
  return result.map(mapPerson);
}

export async function getPerson(id: string): Promise<PersonResponse> {
  const response = await fetch(`${BASE_URL}/persons/${id}`);
  const result = await handleResponse<Record<string, unknown>>(response);
  return mapPerson(result);
}

export async function updatePerson(id: string, data: Partial<PersonCreate>): Promise<PersonResponse> {
  const response = await fetch(`${BASE_URL}/persons/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.nickname !== undefined ? { nickname: data.nickname } : {}),
      ...(data.gender !== undefined ? { gender: String(data.gender).toLowerCase() } : {}),
      ...(data.tags !== undefined || data.categories !== undefined ? { tags: normalizeTags(data.tags ?? data.categories) } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
    }),
  });
  const result = await handleResponse<Record<string, unknown>>(response);
  return mapPerson(result);
}

export async function deletePerson(id: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/persons/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const data = await response.json();
    const error: ApiError = {
      message: data.detail || data.message || 'Failed to delete person',
      status: response.status,
    };
    throw error;
  }
}

// Relationships
export async function createRelationship(data: RelationshipCreate): Promise<RelationshipResponse> {
  const response = await fetch(`${BASE_URL}/relationships`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from_person_id: data.from_person_id ?? data.from_id,
      to_person_id: data.to_person_id ?? data.to_id,
      relation_type: data.relation_type ?? data.type,
      relation_label: data.relation_label ?? data.indian_name,
    }),
  });
  return handleResponse<RelationshipResponse>(response);
}

export async function getRelationships(): Promise<RelationshipResponse[]> {
  const response = await fetch(`${BASE_URL}/relationships`);
  return handleResponse<RelationshipResponse[]>(response);
}

export async function deleteRelationship(id: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/relationships/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const data = await response.json();
    const error: ApiError = {
      message: data.detail || data.message || 'Failed to delete relationship',
      status: response.status,
    };
    throw error;
  }
}

// Graph
export async function getFullGraph(): Promise<GraphData> {
  const response = await fetch(`${BASE_URL}/graph/full`);
  const result = await handleResponse<GraphData>(response);
  return {
    nodes: result.nodes.map((node) => ({
      ...node,
      tags: node.tags ?? node.categories ?? [],
      categories: node.categories ?? node.tags ?? [],
    })),
    links: result.links,
  };
}

export async function getRelationPath(fromId: string, toId: string): Promise<PathResponse> {
  const response = await fetch(`${BASE_URL}/graph/path?from=${fromId}&to=${toId}`);
  return handleResponse<PathResponse>(response);
}

export async function getRelationName(fromId: string, toId: string): Promise<RelationNameResponse> {
  const response = await fetch(`${BASE_URL}/graph/relation-name?from=${fromId}&to=${toId}`);
  return handleResponse<RelationNameResponse>(response);
}

// Stats & health
export async function getGraphStats(): Promise<GraphStats> {
  const response = await fetch(`${BASE_URL}/graph/stats`);
  return handleResponse<GraphStats>(response);
}

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${BASE_URL}/health`);
  return handleResponse<HealthResponse>(response);
}

// Memories
export async function logMemory(
  raw_text: string,
  manual_person_ids?: string[]
): Promise<Record<string, unknown>> {
  const response = await fetch(`${BASE_URL}/memories/log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_text, manual_person_ids }),
  });
  return handleResponse<Record<string, unknown>>(response);
}

export async function getMemories(): Promise<Record<string, unknown>[]> {
  const response = await fetch(`${BASE_URL}/memories`);
  return handleResponse<Record<string, unknown>[]>(response);
}

export async function confirmRelationship(
  confId: string,
  body: {
    from_person_id: string;
    to_person_id: string;
    relation_type: string;
    relation_label?: string;
  }
): Promise<Record<string, unknown>> {
  const response = await fetch(`${BASE_URL}/confirmations/${confId}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse<Record<string, unknown>>(response);
}

