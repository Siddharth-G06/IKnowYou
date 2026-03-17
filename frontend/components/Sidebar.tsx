'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GitBranch,
  Search,
  Settings,
  BookOpen,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useStats } from '@/hooks/useStats';

const navItems = [
  { href: '/', label: 'Home', icon: LayoutDashboard },
  { href: '/people', label: 'People', icon: Users },
  { href: '/graph', label: 'Family Tree', icon: GitBranch },
  { href: '/memories', label: 'Memories', icon: BookOpen },
  { href: '/search', label: 'Search', icon: Search },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { stats, health } = useStats();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="sidebar-desktop"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 'var(--sidebar-width)',
          height: '100vh',
          backgroundColor: 'var(--bg-elevated)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          overflow: 'hidden',
        }}
      >
        {/* Wordmark */}
        <div
          style={{
            padding: '28px 20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Tree/Network SVG Icon */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'var(--amber-glow)',
                border: '1px solid var(--amber-dim)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Root node */}
                <circle cx="10" cy="4" r="2" fill="var(--amber)" />
                {/* Left child */}
                <circle cx="4" cy="14" r="2" fill="var(--amber)" opacity="0.7" />
                {/* Right child */}
                <circle cx="16" cy="14" r="2" fill="var(--amber)" opacity="0.7" />
                {/* Center child */}
                <circle cx="10" cy="14" r="2" fill="var(--amber)" opacity="0.5" />
                {/* Connecting lines */}
                <line x1="10" y1="6" x2="4" y2="12" stroke="var(--amber)" strokeWidth="1.2" opacity="0.6" />
                <line x1="10" y1="6" x2="10" y2="12" stroke="var(--amber)" strokeWidth="1.2" opacity="0.6" />
                <line x1="10" y1="6" x2="16" y2="12" stroke="var(--amber)" strokeWidth="1.2" opacity="0.6" />
              </svg>
            </div>
            <div>
              <h1
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                }}
              >
                IKnowYou
              </h1>
              <p
                style={{
                  fontSize: '10px',
                  color: 'var(--amber)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                  marginTop: 1,
                }}
              >
                Memory Graph
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav
          style={{
            flex: 1,
            padding: '16px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: active ? 500 : 400,
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  backgroundColor: active ? 'var(--bg-hover)' : 'transparent',
                  borderLeft: active ? '2px solid var(--amber)' : '2px solid transparent',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  paddingLeft: active ? '14px' : '12px',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    const el = e.currentTarget as HTMLElement;
                    el.style.backgroundColor = 'var(--bg-hover)';
                    el.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    const el = e.currentTarget as HTMLElement;
                    el.style.backgroundColor = 'transparent';
                    el.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <Icon
                  size={17}
                  color={active ? 'var(--amber)' : 'currentColor'}
                  strokeWidth={active ? 2 : 1.75}
                />
                <span>{label}</span>
                {label === 'Memories' && (stats?.pending_confirmations ?? 0) > 0 && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      minWidth: 18,
                      height: 18,
                      borderRadius: 999,
                      backgroundColor: 'var(--amber-glow)',
                      color: 'var(--amber)',
                      fontSize: 11,
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 6px',
                    }}
                  >
                    {stats?.pending_confirmations}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: Theme toggle + Settings + System status */}
        <div
          style={{
            padding: '12px 10px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <ThemeToggle />
          <Link
            href="/settings"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '13px',
              color: 'var(--text-muted)',
              transition: 'all 0.15s ease',
              borderLeft: '2px solid transparent',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.backgroundColor = 'var(--bg-hover)';
              el.style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.backgroundColor = 'transparent';
              el.style.color = 'var(--text-muted)';
            }}
          >
            <Settings size={16} strokeWidth={1.75} />
            <span>Settings</span>
          </Link>

          {/* System status indicator */}
          <div
            style={{
              marginTop: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 11,
              color: 'var(--text-muted)',
            }}
            title={
              health
                ? `Neo4j: ${health.neo4j ? 'up' : 'down'} | Ollama: ${
                    health.ollama ? 'up' : 'down'
                  } | Chroma: ${health.chroma ? 'up' : 'down'}`
                : 'System status unavailable'
            }
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '999px',
                  backgroundColor: (() => {
                    if (!health) return 'var(--border)';
                    if (!health.neo4j) return '#ef4444'; // red
                    if (!health.ollama || !health.chroma) return '#f59e0b'; // amber
                    return '#22c55e'; // green
                  })(),
                }}
              />
              <span>System</span>
            </span>
            {health && (
              <span style={{ opacity: 0.8 }}>
                {health.status === 'healthy' ? 'Healthy' : 'Degraded'}
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav
        className="sidebar-mobile"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'var(--bg-elevated)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '8px 0 max(8px, env(safe-area-inset-bottom))',
          zIndex: 50,
        }}
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                padding: '6px 16px',
                textDecoration: 'none',
                fontSize: '11px',
                fontWeight: active ? 500 : 400,
                color: active ? 'var(--amber)' : 'var(--text-muted)',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={20} strokeWidth={active ? 2 : 1.75} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <style>{`
        @media (min-width: 768px) {
          .sidebar-mobile { display: none !important; }
        }
        @media (max-width: 767px) {
          .sidebar-desktop { display: none !important; }
        }
      `}</style>
    </>
  );
}
