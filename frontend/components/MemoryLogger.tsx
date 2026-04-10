'use client';

import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Feather, Loader2 } from 'lucide-react';
import ExtractionPreview from '@/components/ExtractionPreview';
import type { MemoryResponse } from '@/hooks/useMemories';

interface MemoryLoggerProps {
  onMemoryLogged: (raw_text: string) => Promise<MemoryResponse | null>;
  isLogging: boolean;
  extractionResult: MemoryResponse | null;
  onClearExtraction: () => void;
}

const PLACEHOLDER_EXAMPLES = [
  'Met Ramesh uncle at Rohit\'s wedding. He\'s dad\'s cousin. Works in Dubai logistics...',
  'Priya mentioned she\'s in second year MBBS at Madras Medical College...',
  'Ran into Karthik at the airport. He\'s Anand\'s brother-in-law. Moving to Canada next month.',
  'Sunita aunty called — she\'s staying with Grandma for a month. Lives in Mysore...',
];

const MemoryLogger: FC<MemoryLoggerProps> = ({
  onMemoryLogged,
  isLogging,
  extractionResult,
  onClearExtraction,
}) => {
  const [text, setText] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Cycle placeholder every 3.5s
  useEffect(() => {
    const id = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % PLACEHOLDER_EXAMPLES.length);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || isLogging) return;
    await onMemoryLogged(trimmed);
    setText('');
  }, [text, isLogging, onMemoryLogged]);

  // Cmd/Ctrl + Enter keyboard shortcut
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    };
    el.addEventListener('keydown', handler);
    return () => el.removeEventListener('keydown', handler);
  }, [handleSubmit]);

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '20px 22px',
        marginBottom: '28px',
      }}
    >
      {/* Heading */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '14px',
        }}
      >
        <Feather size={16} color="var(--amber)" strokeWidth={1.75} />
        <h2
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}
        >
          Log a Memory
        </h2>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={PLACEHOLDER_EXAMPLES[placeholderIdx]}
        rows={4}
        style={{
          width: '100%',
          resize: 'vertical',
          backgroundColor: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '12px 14px',
          fontSize: '14px',
          fontFamily: 'var(--font-body)',
          color: 'var(--text-primary)',
          lineHeight: 1.6,
          outline: 'none',
          transition: 'border-color 0.2s',
          boxSizing: 'border-box',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--amber-dim)'; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
      />

      {/* Character count + shortcut hint */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '6px',
          marginBottom: '12px',
        }}
      >
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {text.length > 0 ? `${text.length} chars` : ''}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          ⌘↩ to save
        </span>
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!text.trim() || isLogging}
        style={{
          width: '100%',
          padding: '11px',
          borderRadius: '10px',
          border: 'none',
          backgroundColor: isLogging || !text.trim() ? 'var(--amber-dim)' : 'var(--amber)',
          color: '#0f0e0d',
          fontSize: '14px',
          fontWeight: 600,
          fontFamily: 'var(--font-body)',
          cursor: isLogging || !text.trim() ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'background-color 0.2s, opacity 0.2s',
        }}
      >
        {isLogging ? (
          <>
            <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
            Extracting…
          </>
        ) : (
          'Extract & Save Memory'
        )}
      </button>

      {/* Extraction preview */}
      {extractionResult && (
        <ExtractionPreview
          extraction={extractionResult.extraction}
          pendingConfirmations={extractionResult.pending_confirmations ?? []}
          onConfirm={onClearExtraction}
          onEdit={onClearExtraction}
        />
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default MemoryLogger;
