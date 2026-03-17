'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Lightbulb } from 'lucide-react';
import { useSearch as useMemorySearch } from '@/hooks/useSearch';
import SearchResultCard from '@/components/SearchResultCard';

const SUGGESTED_QUERIES = [
  'Who did I meet last week?',
  'Family in Dubai',
  'College friends in Bangalore',
  'People from Rohit’s wedding',
];

function highlightSnippet(text: string, query: string): JSX.Element {
  const q = query.trim();
  if (!q) return <>{text}</>;

  const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, idx) =>
        regex.test(part) ? (
          <mark
            key={idx}
            className="bg-amber-200/60 dark:bg-amber-500/30 text-inherit px-0.5 rounded-sm"
          >
            {part}
          </mark>
        ) : (
          <span key={idx}>{part}</span>
        )
      )}
    </>
  );
}

function SearchContent() {
  const router = useRouter();
  const params = useSearchParams();
  const initialQ = params.get('q') || '';

  const [query, setQuery] = useState(initialQ);
  const { results, isSearching, error, search } = useMemorySearch(500);

  // Keep URL in sync with query
  useEffect(() => {
    const q = query.trim();
    const url = q ? `/search?q=${encodeURIComponent(q)}` : '/search';
    router.replace(url);
    search(q);
  }, [query, router, search]);

  const hasResults = results.length > 0;

  const renderedResults = useMemo(
    () =>
      results.map((r) => (
        <SearchResultCard
          key={`${r.person.id}-${r.similarityScore.toFixed(3)}`}
          person={r.person}
          memorySnippet={highlightSnippet(r.memorySnippet, query)}
          relationPath={r.relationPath}
          tamilName={r.tamilName}
          hindiName={r.hindiName}
          similarityScore={r.similarityScore}
        />
      )),
    [query, results]
  );

  return (
    <>
      <div className="mb-4 space-y-3">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="e.g. Who is dad's cousin in Dubai?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-background/60 py-2.5 pl-9 pr-3 text-sm text-foreground shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200/60"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            <Lightbulb className="h-3 w-3 text-amber-500" />
            Suggested
          </span>
          {SUGGESTED_QUERIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setQuery(q)}
              className="rounded-full border border-border bg-muted/60 px-2.5 py-1 text-[11px] text-muted-foreground hover:border-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <section className="mt-4 space-y-3">
        {isSearching && (
          <p className="text-xs text-muted-foreground">Searching memories…</p>
        )}
        {error && (
          <p className="text-xs text-red-500">
            {error}
          </p>
        )}

        {!isSearching && !hasResults && !error && query.trim() && (
          <p className="text-xs text-muted-foreground">
            No results for “{query}”.
          </p>
        )}

        {!query.trim() && (
          <p className="text-xs text-muted-foreground">
            Start typing a question or pick a suggested query above.
          </p>
        )}

        {hasResults && <div className="space-y-3">{renderedResults}</div>}
      </section>
    </>
  );
}

export default function SearchPage() {
  return (
    <div className="fade-in mx-auto max-w-3xl px-6 py-10 font-sans">
      <header className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <Search className="h-5 w-5 text-amber-500" strokeWidth={1.75} />
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Query
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Ask questions about your network and memories.
        </p>
      </header>

      <Suspense fallback={<p className="text-xs text-muted-foreground">Loading search...</p>}>
        <SearchContent />
      </Suspense>
    </div>
  );
}

