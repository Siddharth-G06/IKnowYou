import { Person } from '@/lib/types';
import { Plus, MoreVertical, Edit2, Trash2, GitBranch } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PersonCardProps {
  person: Person;
  onAddRelationship?: (person: Person) => void;
  onEdit?: (person: Person) => void;
  onDelete?: (person: Person) => void;
  onViewRelationships?: (person: Person) => void;
}

const categoryColors: Record<string, { bg: string; text: string }> = {
  family: { bg: 'var(--amber-glow)', text: 'var(--amber)' },
  friend: { bg: 'var(--indigo-glow)', text: 'var(--indigo)' },
  colleague: { bg: 'var(--emerald-glow)', text: 'var(--emerald)' },
  acquaintance: { bg: 'rgba(107,99,100,0.15)', text: 'var(--text-secondary)' },
  mentor: { bg: 'var(--indigo-glow)', text: 'var(--indigo)' },
  neighbor: { bg: 'var(--amber-glow)', text: 'var(--amber)' },
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

export default function PersonCard({ 
  person, 
  onAddRelationship,
  onEdit,
  onDelete,
  onViewRelationships
}: PersonCardProps) {
  const { name, relation, tags, notes, avatarColor } = person;
  const initials = getInitials(name);

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = 'translateY(-4px)';
        el.style.boxShadow = 'var(--shadow-card), 0 0 0 1px var(--amber-dim)';
        el.style.borderColor = 'var(--amber-dim)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = 'none';
        el.style.borderColor = 'var(--border)';
      }}
    >
      {/* Subtle top gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${avatarColor ?? 'var(--amber)'}, transparent)`,
          opacity: 0.4,
        }}
      />

      {/* Avatar + Name row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: avatarColor ? `${avatarColor}22` : 'var(--amber-glow)',
            border: `1px solid ${avatarColor ? `${avatarColor}44` : 'var(--amber-dim)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontFamily: 'var(--font-heading)',
            fontSize: '17px',
            fontWeight: 700,
            color: avatarColor ?? 'var(--amber)',
            letterSpacing: '-0.02em',
          }}
        >
          {initials}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '15.5px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.3,
            }}
          >
            {name}
          </p>
          {relation && (
            <p
              style={{
                fontSize: '12.5px',
                color: 'var(--text-muted)',
                marginTop: '1px',
                fontWeight: 400,
              }}
            >
              {relation}
            </p>
          )}
        </div>

        {/* Action Menu */}
        {(onEdit || onDelete || onViewRelationships) && (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    style={{
                      padding: '4px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    className="hover:bg-muted hover:text-foreground"
                  />
                }
              >
                <MoreVertical size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-popover border-border">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(person)}>
                    <Edit2 size={14} className="mr-2" />
                    Edit Person
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
                    Delete Person
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {tags.map((tag) => {
            const colors = categoryColors[tag.category] ?? categoryColors.other;
            return (
              <span
                key={tag.label}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '3.5px 10px',
                  borderRadius: '100px',
                  fontSize: '11px',
                  fontWeight: 500,
                  letterSpacing: '0.01em',
                  backgroundColor: colors.bg,
                  color: colors.text,
                  border: '1px solid transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                {tag.label}
              </span>
            );
          })}
        </div>
      )}

      {/* Notes preview */}
      {notes && (
        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            lineHeight: 1.55,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
            marginBottom: onAddRelationship ? '8px' : '0',
          }}
        >
          {notes}
        </p>
      )}

      {/* Action footer */}
      {onAddRelationship && (
        <div style={{ marginTop: 'auto', paddingTop: '10px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddRelationship(person);
            }}
            className="add-rel-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--amber-dim)',
              backgroundColor: 'var(--amber-glow)',
              color: 'var(--amber)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Plus size={12} strokeWidth={2.5} />
            Add Relationship
          </button>
        </div>
      )}
      <style>{`
        .add-rel-btn:hover {
          background-color: var(--amber) !important;
          color: white !important;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
