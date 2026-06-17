export type TagCategory =
  | 'family'
  | 'friend'
  | 'colleague'
  | 'acquaintance'
  | 'mentor'
  | 'neighbor'
  | 'professional'
  | 'other';

export interface Tag {
  label: string;
  category: TagCategory;
}

/**
 * Person as returned by the backend.
 * `tags` is a plain string array (e.g. ["Family", "Friend"]).
 * `categories` is an alias for the same data (also populated by the backend).
 */
export interface Person {
  id: string;
  name: string;
  nickname?: string;
  gender?: string;
  /** Backend returns these as plain strings */
  tags: string[];
  /** Alias – same data as tags, populated by graph route */
  categories?: string[];
  relation?: string;
  location?: string;
  metAt?: string;
  lastMet?: string;
  notes?: string;
  avatarColor?: string;
}

export interface DashboardStats {
  people: number;
  relationships: number;
  memories: number;
}
