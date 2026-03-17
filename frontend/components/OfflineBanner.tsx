'use client';

import React from 'react';
import { useStats } from '@/hooks/useStats';
import { AlertCircle } from 'lucide-react';

export default function OfflineBanner() {
  const { health } = useStats();

  if (!health || health.ollama) {
    return null;
  }

  return (
    <div style={{
      backgroundColor: 'var(--amber-glow)',
      color: 'var(--amber)',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      borderBottom: '1px solid var(--amber-dim)',
      fontSize: '14px',
      fontWeight: 500,
      zIndex: 40,
      position: 'relative'
    }}>
      <AlertCircle size={18} strokeWidth={2} />
      <span>AI extraction offline. You can still browse and manually add relationships.</span>
    </div>
  );
}
