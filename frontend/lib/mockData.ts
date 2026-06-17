import { Person, DashboardStats } from './types';

export const mockPeople: Person[] = [
  {
    id: '1',
    name: 'Ramesh Uncle',
    relation: 'Family Friend',
    tags: ['Family', 'Dubai'],
    location: "Rohit's Wedding",
    metAt: "Rohit's Wedding",
    lastMet: '2h ago',
    notes: 'Works in Dubai, knows Dad since college. Very warm person.',
    avatarColor: '#d48b3a',
  },
  {
    id: '2',
    name: 'Priya Krishnan',
    relation: 'Colleague',
    tags: ['Colleague', 'Design'],
    location: 'Office — Bangalore',
    metAt: 'Startup Summit 2024',
    lastMet: 'Yesterday',
    notes: 'Senior designer at the office. Into photography and travel.',
    avatarColor: '#8b5cf6',
  },
  {
    id: '3',
    name: 'Anand Sharma',
    relation: 'Mentor',
    tags: ['Mentor', 'Tech'],
    location: 'IIT Alumni Meet',
    metAt: 'IIT Alumni Meet',
    lastMet: '3 days ago',
    notes: 'CTO at fintech startup. Introduced me to AI/ML field.',
    avatarColor: '#10b981',
  },
  {
    id: '4',
    name: 'Sarah Chen',
    relation: 'Friend',
    tags: ['Friend', 'Badminton'],
    location: 'Community Club',
    metAt: 'Badminton Club',
    lastMet: 'Last week',
    notes: 'Met at badminton club. Works in biotech.',
    avatarColor: '#e11d48',
  },
];

export const mockStats: DashboardStats = {
  people: 47,
  relationships: 124,
  memories: 312,
};
