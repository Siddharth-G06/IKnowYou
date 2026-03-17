'use client';

import { Person } from '@/lib/types';
import { MoreVertical, Edit2, Trash2, GitBranch, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PeopleListRowProps {
  person: Person;
  onEdit?: (person: Person) => void;
  onDelete?: (person: Person) => void;
  onViewRelationships?: (person: Person) => void;
  onAddRelationship?: (person: Person) => void;
}

const categoryColors: Record<string, { bg: string; text: string }> = {
  family: { bg: 'var(--amber-glow)', text: 'var(--amber)' },
  friend: { bg: 'var(--indigo-glow)', text: 'var(--indigo)' },
  colleague: { bg: 'var(--emerald-glow)', text: 'var(--emerald)' },
  acquaintance: { bg: 'rgba(107,99,100,0.15)', text: 'var(--text-secondary)' },
  other: { bg: 'rgba(100,116,139,0.15)', text: 'var(--text-muted)' },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export default function PeopleListRow({
  person,
  onEdit,
  onDelete,
  onViewRelationships,
  onAddRelationship,
}: PeopleListRowProps) {
  const { name, tags, notes, avatarColor } = person;
  const initials = getInitials(name);

  return (
    <div
      className="group flex items-center gap-4 py-3 px-4 rounded-xl border border-transparent hover:border-border hover:bg-muted/30 transition-all cursor-pointer"
      onClick={() => onViewRelationships?.(person)}
    >
      {/* Avatar */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: avatarColor ? `${avatarColor}22` : 'var(--amber-glow)',
          border: `1px solid ${avatarColor ? `${avatarColor}44` : 'var(--amber-dim)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontFamily: 'var(--font-heading)',
          fontSize: '14px',
          fontWeight: 700,
          color: avatarColor ?? 'var(--amber)',
        }}
      >
        {initials}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground truncate">{name}</p>
      </div>

      {/* Tags */}
      <div className="hidden md:flex flex-1 gap-2 overflow-hidden">
        {tags.slice(0, 2).map((tag) => {
          const colors = categoryColors[tag.category] ?? categoryColors.other;
          return (
            <span
              key={tag.label}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap"
              style={{ backgroundColor: colors.bg, color: colors.text }}
            >
              {tag.label}
            </span>
          );
        })}
        {tags.length > 2 && (
          <span className="text-[10px] text-muted-foreground flex items-center">
            +{tags.length - 2}
          </span>
        )}
      </div>

      {/* Notes */}
      <div className="hidden lg:flex flex-[2] truncate">
        <p className="text-xs text-muted-foreground truncate italic">
          {notes || 'No notes available'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {onAddRelationship && (
          <button
            onClick={() => onAddRelationship(person)}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-amber-glow hover:text-amber transition-colors"
            title="Add Relationship"
          >
            <Plus size={16} />
          </button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger render={<button className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" />}>
            <MoreVertical size={16} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(person)}>
                <Edit2 size={14} className="mr-2" />
                Edit
              </DropdownMenuItem>
            )}
            {onViewRelationships && (
              <DropdownMenuItem onClick={() => onViewRelationships(person)}>
                <GitBranch size={14} className="mr-2" />
                View Relationships
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                onClick={() => onDelete(person)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 size={14} className="mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
