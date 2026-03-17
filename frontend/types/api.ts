export interface PersonCreate {
  name: string;
  nickname?: string;
  gender?: 'male' | 'female' | 'other' | string;
  tags?: string[];
  categories?: string[];
  notes?: string;
  photo?: string;
}

export interface PersonResponse {
  id: string;
  name: string;
  nickname?: string;
  gender?: 'male' | 'female' | 'other' | string;
  tags: string[];
  categories: string[];
  notes?: string;
  photo?: string;
  created_at?: string;
}

export interface RelationshipCreate {
  from_id?: string;
  to_id?: string;
  type?: string;
  indian_name?: string;
  from_person_id?: string;
  to_person_id?: string;
  relation_type?: string;
  relation_label?: string;
}

export interface RelationshipResponse {
  id: string;
  from_person_id: string;
  to_person_id: string;
  relation_type: string;
  from_person_name: string;
  to_person_name: string;
}

export interface GraphNode {
  id: string;
  name: string;
  gender?: string;
  tags: string[];
  categories: string[];
  notes?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  relation: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface GraphStats {
  total_persons: number;
  total_relationships: number;
  total_memories: number;
  pending_confirmations: number;
  recent_persons: { id: string; name: string; created_at: string }[];
}

export interface HealthResponse {
  status: 'healthy' | 'degraded';
  neo4j: boolean;
  ollama: boolean;
  chroma: boolean;
  timestamp: string;
}

export interface PathResponse {
  path: string[];
  node_ids?: string[];
  node_names?: string[];
  relation_name: string;
}

export interface RelationNameResponse {
  path: string[];
  relation: string;
  english: string;
  tamil?: string;
  hindi?: string;
  note?: string;
}

export interface ApiError {
  message: string;
  status: number;
}
