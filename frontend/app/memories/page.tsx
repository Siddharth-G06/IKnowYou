'use client';

import { useEffect } from 'react';
import { BookOpen, Clock, AlertCircle, User } from 'lucide-react';
import { useMemories } from '@/hooks/useMemories';
import MemoryLogger from '@/components/MemoryLogger';
import Link from 'next/link';

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function MemoriesPage() {
  const {
    memories,
    isLogging,
    isFetching,
    extractionResult,
    error,
    logMemory,
    getMemories,
    clearExtraction,
  } = useMemories();

  // Fetch memory feed on mount
  useEffect(() => {
    getMemories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingCount = extractionResult?.pending_confirmations?.length ?? 0;

  return (
    <div
      style={{
        maxWidth: '760px',
        margin: '0 auto',
        padding: '40px 28px',
        fontFamily: 'var(--font-body)',
      }}
      className="fade-in"
    >
      {/* Page Header */}
      <header style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <BookOpen size={20} color="var(--amber)" strokeWidth={1.75} />
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '26px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            Memories
          </h1>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Log interactions and let AI extract connections for you.
        </p>
      </header>

      {/* Memory Logger */}
      <MemoryLogger
        onMemoryLogged={logMemory}
        isLogging={isLogging}
        extractionResult={extractionResult}
        onClearExtraction={clearExtraction}
      />

      {/* Pending Confirmations Banner */}
      {pendingCount > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--amber-glow)',
            border: '1px solid var(--amber-dim)',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '20px',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} color="var(--amber)" />
            <span style={{ fontSize: '13px', color: 'var(--amber)', fontWeight: 500 }}>
              {pendingCount} relationship{pendingCount > 1 ? 's' : ''} pending confirmation
            </span>
          </div>
          <Link
            href="/search"
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--amber)',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
              cursor: 'pointer',
            }}
          >
            Review
          </Link>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            backgroundColor: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: '13px',
            color: '#ef4444',
          }}
        >
          {error}
        </div>
      )}

      {/* Memory Feed */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Clock size={14} color="var(--amber)" strokeWidth={2} />
          <h2
            style={{
              fontSize: '11px',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
            }}
          >
            Memory Feed
          </h2>
        </div>

        {isFetching && memories.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                style={{
                  height: '90px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  animation: 'pulse 1.6s ease-in-out infinite',
                  opacity: 0.5,
                }}
              />
            ))}
          </div>
        )}

        {!isFetching && memories.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 0',
              color: 'var(--text-muted)',
              fontSize: '14px',
            }}
          >
            <BookOpen size={40} strokeWidth={1} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <p>No memories yet. Log your first one above!</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {memories.map((mem) => (
            <div
              key={mem.id}
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '16px 18px',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--amber-dim)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Memory text */}
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  lineHeight: 1.6,
                  marginBottom: '10px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {mem.raw_text}
              </p>

              {/* Footer row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                {/* Person chips */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  {(mem.persons || [])
                    .filter((p) => p && p.name)
                    .slice(0, 4)
                    .map((p) => (
                      <span
                        key={p.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          backgroundColor: 'var(--bg)',
                          border: '1px solid var(--border)',
                          fontSize: '11px',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <User size={10} />
                        {p.name}
                      </span>
                    ))}
                  {mem.event && (
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '999px',
                        backgroundColor: 'var(--amber-glow)',
                        border: '1px solid var(--amber-dim)',
                        fontSize: '11px',
                        color: 'var(--amber)',
                        fontWeight: 500,
                      }}
                    >
                      {mem.event}
                    </span>
                  )}
                </div>

                {/* Timestamp */}
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {mem.created_at ? timeAgo(mem.created_at) : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.25; }
        }
        @media (max-width: 600px) {
          .fade-in { padding: 20px 14px !important; }
        }
      `}</style>
    </div>
  );
}
