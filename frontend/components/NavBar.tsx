'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, BookOpen, GitBranch, Search, Menu, X } from 'lucide-react';
import { useState } from 'react';

const NAV_LINKS = [
  { href: '/',         label: 'Dashboard', icon: LayoutDashboard, accent: '#f59e0b' },
  { href: '/people',   label: 'People',    icon: Users,            accent: '#f59e0b' },
  { href: '/memories', label: 'Memories',  icon: BookOpen,         accent: '#10b981' },
  { href: '/graph',    label: 'Tree',      icon: GitBranch,        accent: '#6366f1' },
  { href: '/search',   label: 'Search',    icon: Search,           accent: '#ffffff' },
];

export default function NavBar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-white/5 shadow-lg"
        style={{ background: 'rgba(10, 11, 14, 0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-screen-xl mx-auto flex h-16 items-center justify-between px-4 md:px-8">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', boxShadow: '0 0 16px rgba(245,158,11,0.3)' }}>
              <span className="font-black text-black text-sm leading-none">IK</span>
            </div>
            <span className="font-extrabold text-xl tracking-tight"
              style={{ background: 'linear-gradient(90deg, #ffffff, #9ca3af)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              IKnowYou
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon, accent }) => {
              const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{
                    color: isActive ? accent : '#6b7280',
                    background: isActive ? `${accent}15` : 'transparent',
                    borderBottom: isActive ? `2px solid ${accent}` : '2px solid transparent',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.color = '#d1d5db';
                  }}
                  onMouseLeave={e => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.color = '#6b7280';
                  }}
                >
                  <Icon size={14} />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            onClick={() => setMobileOpen(o => !o)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/5 px-4 py-3 space-y-1"
            style={{ background: 'rgba(10, 11, 14, 0.95)' }}>
            {NAV_LINKS.map(({ href, label, icon: Icon, accent }) => {
              const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{
                    color: isActive ? accent : '#9ca3af',
                    background: isActive ? `${accent}12` : 'transparent',
                  }}
                >
                  <Icon size={16} style={{ color: isActive ? accent : '#6b7280' }} />
                  {label}
                </Link>
              );
            })}
          </div>
        )}
      </header>
    </>
  );
}
