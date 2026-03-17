export type TagCategory =
  | 'family'
  | 'friend'
  | 'colleague'
  | 'acquaintance'
  | 'mentor'
  | 'neighbor'
  | 'other';

export interface Tag {
  label: string;
  category: TagCategory;
}

export interface Person {
  id: string;
  name: string;
  relation?: string;
  tags: Tag[];
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
