'use client';

import { FC } from 'react';
import { CheckCircle, AlertCircle, MapPin, Users } from 'lucide-react';
import type { ExtractionResult, PendingConfirmation } from '@/hooks/useMemories';

interface ExtractionPreviewProps {
  extraction: ExtractionResult;
  pendingConfirmations: PendingConfirmation[];
  onConfirm: () => void;
  onEdit: () => void;
}

const ExtractionPreview: FC<ExtractionPreviewProps> = ({
  extraction,
  pendingConfirmations,
  onConfirm,
  onEdit,
}) => {
  const hasPeople = extraction.persons.length > 0;

  return (
    <div
      style={{
        border: '1px solid var(--amber-dim)',
        borderRadius: '12px',
        padding: '16px 18px',
        backgroundColor: 'var(--amber-glow)',
        marginTop: '12px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        {extraction.extraction_success ? (
          <CheckCircle size={16} color="var(--amber)" />
        ) : (
          <AlertCircle size={16} color="var(--amber)" />
        )}
        <span
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--amber)',
          }}
        >
          {extraction.extraction_success ? 'Found in your memory:' : 'Saved as raw note'}
        </span>
      </div>

      {!extraction.extraction_success && (
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          We couldn't extract details. Saved as a raw note.
        </p>
      )}

      {/* People */}
      {hasPeople && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Users size={13} color="var(--text-muted)" />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              People detected
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {extraction.persons.map((p, i) => {
              const pc = pendingConfirmations.find(
                (c) => c.person_name.toLowerCase() === (p.name || p.nickname || '').toLowerCase()
              );
              return (
                <span
                  key={i}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{p.name || p.nickname || 'Unknown'}</span>
                  {p.relation_raw && (
                    <span
                      style={{
                        fontSize: '10px',
                        color: 'var(--amber)',
                        backgroundColor: 'var(--amber-glow)',
                        padding: '1px 6px',
                        borderRadius: '999px',
                        fontWeight: 500,
                      }}
                    >
                      {p.relation_raw}
                    </span>
                  )}
                  {pc ? (
                    <span style={{ fontSize: '10px', color: '#ef4444' }}>New</span>
                  ) : (
                    <span style={{ fontSize: '10px', color: '#22c55e' }}>✓</span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Relationships pending */}
      {pendingConfirmations.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>
            Relationships to confirm
          </p>
          {pendingConfirmations.map((c) => (
            <div
              key={c.id}
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                padding: '4px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>You</span>
              <span style={{ color: 'var(--amber)' }}>→</span>
              <span style={{ fontStyle: 'italic' }}>{c.relation_raw}</span>
              <span style={{ color: 'var(--amber)' }}>→</span>
              <span style={{ fontWeight: 500 }}>{c.person_name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Event */}
      {extraction.event && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            marginBottom: '10px',
          }}
        >
          <MapPin size={13} color="var(--amber)" />
          <span>{extraction.event}</span>
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button
          onClick={onConfirm}
          style={{
            flex: 1,
            padding: '9px 16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#22c55e',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          Got it — close preview
        </button>
        <button
          onClick={onEdit}
          style={{
            padding: '9px 16px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          Edit
        </button>
      </div>
    </div>
  );
};

export default ExtractionPreview;
