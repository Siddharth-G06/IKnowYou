'use client';

import { Person } from '@/lib/types';
import { Edit2, Trash2, GitBranch, Plus, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PersonCardProps {
  person: Person;
  onEdit?: (person: Person) => void;
  onDelete?: (person: Person) => void;
  onViewRelationships?: (person: Person) => void;
  onAddRelationship?: (person: Person) => void;
}

const categoryColors: Record<string, { bg: string; text: string }> = {
  family: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  friend: { bg: 'bg-indigo-500/20', text: 'text-indigo-400' },
  colleague: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  professional: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  acquaintance: { bg: 'bg-white/10', text: 'text-gray-300' },
  other: { bg: 'bg-white/5', text: 'text-gray-400' },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export default function PersonCard({
  person,
  onEdit,
  onDelete,
  onViewRelationships,
  onAddRelationship,
}: PersonCardProps) {
  const { name, tags = [], notes, avatarColor } = person;
  const initials = getInitials(name);

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col gap-4 relative group">
      <div className="flex justify-between items-start">
        {/* Avatar */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0"
          style={{
            backgroundColor: avatarColor ? `${avatarColor}22` : 'rgba(245, 158, 11, 0.1)',
            border: `1px solid ${avatarColor ? `${avatarColor}44` : 'rgba(245, 158, 11, 0.2)'}`,
            color: avatarColor ?? '#f59e0b',
          }}
        >
          {initials}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onAddRelationship && (
            <button
              onClick={() => onAddRelationship(person)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
              title="Add Relationship"
            >
              <Plus size={16} />
            </button>
          )}

          {/* Dropdown — base-ui Trigger renders its own <button>, don't nest another button */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
              aria-label="More options"
            >
              <MoreVertical size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 border-white/10"
              style={{ background: '#13151a' }}
            >
              {onEdit && (
                <DropdownMenuItem
                  onClick={() => onEdit(person)}
                  className="cursor-pointer text-gray-300 hover:text-white hover:bg-white/10 focus:bg-white/10 focus:text-white"
                >
                  <Edit2 size={14} className="mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onViewRelationships && (
                <DropdownMenuItem
                  onClick={() => onViewRelationships(person)}
                  className="cursor-pointer text-gray-300 hover:text-white hover:bg-white/10 focus:bg-white/10 focus:text-white"
                >
                  <GitBranch size={14} className="mr-2" />
                  View Relationships
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(person)}
                  className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-300"
                >
                  <Trash2 size={14} className="mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Name & Notes */}
      <div className="space-y-1">
        <h3 className="font-bold text-lg text-foreground truncate">{name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
          {notes || <span className="italic opacity-50">No notes yet</span>}
        </p>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mt-auto pt-2 border-t border-white/5">
        {(tags as string[]).slice(0, 3).map((tag) => {
          const key = String(tag).toLowerCase();
          const colors = categoryColors[key] ?? categoryColors.other;
          return (
            <span
              key={tag}
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} border border-white/5`}
            >
              {tag}
            </span>
          );
        })}
        {tags.length > 3 && (
          <span className="text-xs text-muted-foreground flex items-center pl-1">
            +{tags.length - 3} more
          </span>
        )}
        {tags.length === 0 && (
          <span className="text-xs text-muted-foreground italic">No tags</span>
        )}
      </div>
    </div>
  );
}
