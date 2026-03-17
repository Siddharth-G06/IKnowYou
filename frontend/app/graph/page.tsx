import { GitBranch } from 'lucide-react';
import FamilyGraph from '@/components/FamilyGraph';

export default function GraphPage() {
  return (
    <div
      style={{
        padding: '40px 36px',
        maxWidth: '960px',
        margin: '0 auto',
        fontFamily: 'var(--font-body)',
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
      }}
      className="fade-in"
    >
      <header style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <GitBranch size={22} color="var(--amber)" strokeWidth={1.75} />
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            Family Tree
          </h1>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          Visualize your relationship network
        </p>
      </header>

      {/* Graph Area */}
      <FamilyGraph />
    </div>
  );
}
