import type { Metadata } from 'next';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import OfflineBanner from '@/components/OfflineBanner';
import { Toaster } from 'react-hot-toast';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'IKnowYou — Memory Graph',
  description: 'Your intelligent relationship and memory graph. Remember everyone you meet.',
  keywords: ['relationship graph', 'memory', 'people', 'connections'],
};

// Prevent flash: set data-theme before React hydrates
const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('iknowyou-theme');
    if (stored === 'light' || stored === 'dark') {
      document.documentElement.setAttribute('data-theme', stored);
    } else {
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  } catch(e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <head>
        {/* Anti-flash script runs synchronously before any paint */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ErrorBoundary>
          <ThemeProvider>
            <Toaster position="bottom-right" />
            <div
              style={{
                display: 'flex',
                minHeight: '100vh',
                backgroundColor: 'var(--bg)',
              }}
            >
              <Sidebar />
              <main
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  marginLeft: 'var(--sidebar-width)',
                  minHeight: '100vh',
                  backgroundColor: 'var(--bg)',
                  transition: 'background-color 0.25s ease',
                }}
                className="main-content"
              >
                <OfflineBanner />
                <div style={{ flex: 1 }}>
                  {children}
                </div>
              </main>
            </div>
          </ThemeProvider>
        </ErrorBoundary>

        <style>{`
          @media (max-width: 767px) {
            .main-content {
              margin-left: 0 !important;
              padding-bottom: 80px;
            }
          }
        `}</style>
      </body>
    </html>
  );
}

