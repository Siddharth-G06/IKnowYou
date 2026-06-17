'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Users, GitBranch, BookOpen, Edit2, Trash2, Plus, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { getPerson, getPersons, deletePerson } from '@/lib/api';
import AddRelationshipModal from '@/components/AddRelationshipModal';
import { useRouter } from 'next/navigation';

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  family:       { bg: 'bg-amber-500/20',  text: 'text-amber-400',  border: 'border-amber-500/30' },
  friend:       { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  professional: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  colleague:    { bg: 'bg-emerald-500/20',text: 'text-emerald-400',border: 'border-emerald-500/30' },
};

export default function PersonPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [person, setPerson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRelModalOpen, setIsRelModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getPerson(params.id)
      .then((data: any) => setPerson(data))
      .catch(() => setError('Could not load person. They may not exist.'))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm(`Delete ${person?.name}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deletePerson(params.id);
      router.push('/people');
    } catch {
      alert('Failed to delete person.');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-16 flex justify-center">
        <Loader2 size={32} className="text-amber-500 animate-spin" />
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
        <AlertTriangle size={48} className="mx-auto text-red-400" />
        <p className="text-lg text-white font-semibold">{error ?? 'Person not found'}</p>
        <Link href="/people" className="inline-flex items-center gap-2 text-sm text-amber-500 hover:underline">
          <ArrowLeft size={14} /> Back to People
        </Link>
      </div>
    );
  }

  const tags: string[] = Array.isArray(person.tags) ? person.tags : [];
  const initials = getInitials(person.name);

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16 fade-in">
      {/* Back link */}
      <Link href="/people" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors">
        <ArrowLeft size={14} /> All People
      </Link>

      {/* Hero card */}
      <div className="glass-panel rounded-3xl p-8 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-30 bg-amber-500/30 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-start">
          {/* Avatar */}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black shrink-0"
            style={{
              background: person.avatarColor ? `${person.avatarColor}22` : 'rgba(245,158,11,0.1)',
              border: `2px solid ${person.avatarColor ? `${person.avatarColor}44` : 'rgba(245,158,11,0.3)'}`,
              color: person.avatarColor ?? '#f59e0b',
            }}
          >
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white truncate">{person.name}</h1>
              {person.nickname && (
                <p className="text-gray-400 text-sm mt-0.5">aka <span className="text-gray-300 italic">"{person.nickname}"</span></p>
              )}
            </div>

            {/* Meta chips */}
            <div className="flex flex-wrap gap-2">
              {person.gender && (
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-white/10 text-gray-300 border border-white/10 capitalize">
                  {person.gender}
                </span>
              )}
              {tags.map((tag: string) => {
                const key = tag.toLowerCase();
                const c = categoryColors[key] ?? { bg: 'bg-white/10', text: 'text-gray-300', border: 'border-white/10' };
                return (
                  <span key={tag} className={`px-3 py-1 text-xs font-semibold rounded-full border ${c.bg} ${c.text} ${c.border}`}>
                    {tag}
                  </span>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => setIsRelModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-400 text-sm font-semibold transition-all"
              >
                <Plus size={14} /> Add Relationship
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-semibold transition-all disabled:opacity-50"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {person.notes && (
        <div className="glass-card rounded-2xl p-6 space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
            <BookOpen size={12} /> Notes
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed">{person.notes}</p>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Relationships', icon: GitBranch, value: '—', color: 'text-indigo-400' },
          { label: 'Memories', icon: BookOpen, value: '—', color: 'text-emerald-400' },
          { label: 'Connections', icon: Users, value: '—', color: 'text-amber-400' },
        ].map(({ label, icon: Icon, value, color }) => (
          <div key={label} className="glass-card rounded-2xl p-5 text-center space-y-2">
            <Icon size={20} className={`mx-auto ${color}`} />
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Relationship Modal */}
      {isRelModalOpen && (
        <AddRelationshipModal
          isOpen={isRelModalOpen}
          onClose={() => setIsRelModalOpen(false)}
          toPerson={{ id: params.id, name: person.name }}
          onSuccess={() => setIsRelModalOpen(false)}
        />
      )}
    </div>
  );
}
