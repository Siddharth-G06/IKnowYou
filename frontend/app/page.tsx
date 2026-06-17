'use client';

import { Users, GitBranch, BookOpen, Plus, Search, ArrowRight, Clock } from 'lucide-react';
import PersonCard from '@/components/PersonCard';
import { Person } from '@/lib/types';
import Link from 'next/link';
import * as React from 'react';
import AddPersonModal from '@/components/AddPersonModal';
import AddRelationshipModal from '@/components/AddRelationshipModal';
import { useStats } from '@/hooks/useStats';
import { usePersons } from '@/hooks/usePersons';
import { mockPeople } from '@/lib/mockData';

export default function DashboardPage() {
  const [isAddPersonOpen, setIsAddPersonOpen] = React.useState(false);
  const [isAddRelOpen, setIsAddRelOpen] = React.useState(false);
  const [selectedPersonForRel, setSelectedPersonForRel] = React.useState<Person | null>(null);
  const { stats } = useStats();
  const { people, isLoading: isPeopleLoading } = usePersons();

  // Prefer real data, fallback to mock, and map to Person type
  const displayPeople = React.useMemo(() => {
    if (people && people.length > 0) {
      return (people as any[]).map(p => ({
        id: p.id,
        name: p.name,
        relation: p.relation || '',
        tags: Array.isArray(p.categories) && p.categories.length > 0 
          ? p.categories 
          : Array.isArray(p.tags) ? p.tags : [],
        notes: p.notes || '',
        avatarColor: p.avatarColor || '#d48b3a'
      })) as Person[];
    }
    return mockPeople;
  }, [people]);

  const handleAddRelationship = (person: Person) => {
    setSelectedPersonForRel(person);
    setIsAddRelOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-16">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-baseline gap-3">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">Hi Sid,</h1>
          <span className="text-3xl animate-bounce">👋</span>
        </div>
        <p className="text-lg text-muted-foreground font-medium">Who did you meet today?</p>
      </header>

      {/* Stats Row */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              label: 'People in network',
              value: stats?.total_persons ?? 0,
              icon: Users,
              color: 'text-amber-500',
              bgColor: 'bg-amber-500/10',
              glow: 'bg-amber-500/20',
            },
            {
              label: 'Relationships mapped',
              value: stats?.total_relationships ?? 0,
              icon: GitBranch,
              color: 'text-indigo-500',
              bgColor: 'bg-indigo-500/10',
              glow: 'bg-indigo-500/20',
            },
            {
              label: 'Memories logged',
              value: stats?.total_memories ?? 0,
              icon: BookOpen,
              color: 'text-emerald-500',
              bgColor: 'bg-emerald-500/10',
              glow: 'bg-emerald-500/20',
            },
          ].map(({ label, value, icon: Icon, color, bgColor, glow }) => (
            <div key={label} className="glass-card relative overflow-hidden rounded-2xl p-6 group cursor-default">
              {/* Decorative Glow Blob */}
              <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 ${glow}`} />
              
              <div className="flex items-center justify-between mb-6 relative z-10">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgColor}`}>
                  <Icon className={`${color}`} size={20} strokeWidth={2} />
                </div>
              </div>
              <p className={`text-5xl font-black tracking-tighter relative z-10 ${color}`}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setIsAddPersonOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-bold shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all duration-300 hover:-translate-y-0.5"
          >
            <Plus size={18} strokeWidth={3} />
            Add Person
          </button>

          <Link href="/search" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white font-medium transition-all duration-300">
            <Search size={18} strokeWidth={2} />
            Search
          </Link>

          <Link href="/graph" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white font-medium transition-all duration-300">
            <GitBranch size={18} strokeWidth={2} />
            View Tree
          </Link>
        </div>
      </section>

      {/* Recent People */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-amber-500" strokeWidth={2.5} />
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent People</h2>
          </div>
          <Link href="/people" className="text-sm font-semibold text-amber-500 hover:text-amber-400 hover:underline transition-all flex items-center gap-1">
            View All <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayPeople.map((person) => (
            <PersonCard 
              key={person.id} 
              person={person} 
              onAddRelationship={handleAddRelationship}
            />
          ))}
        </div>
      </section>

      {/* Modals */}
      <AddPersonModal
        isOpen={isAddPersonOpen}
        onClose={() => setIsAddPersonOpen(false)}
        onSuccess={() => {
          console.log('Person added, refreshing...');
        }}
      />

      {selectedPersonForRel && (
        <AddRelationshipModal
          isOpen={isAddRelOpen}
          onClose={() => setIsAddRelOpen(false)}
          toPerson={selectedPersonForRel}
          onSuccess={() => {
            console.log('Relationship added');
          }}
        />
      )}
    </div>
  );
}
