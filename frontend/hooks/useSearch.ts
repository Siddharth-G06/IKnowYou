'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PersonResponse } from '@/types/api';

export interface BackendSearchPerson {
  id: string;
  name: string;
  nickname?: string;
}

export interface BackendSearchResult {
  memory_id: string;
  raw_text: string;
  metadata: Record<string, any>;
  similarity_score: number;
  persons: BackendSearchPerson[];
}

export interface EnrichedSearchResult {
  person: PersonResponse;
  memorySnippet: string;
  relationPath: string;
  tamilName: string;
  hindiName: string;
  similarityScore: number;
}

interface UseSearchState {
  results: EnrichedSearchResult[];
  isSearching: boolean;
  error: string | null;
  search: (query: string) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with ${res.status}`);
  }
  return res.json();
}

export function useSearch(debounceMs = 500): UseSearchState {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<EnrichedSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      setIsSearching(false);
      setError(null);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      // 1. Search memories
      const backendResults = await fetchJSON<BackendSearchResult[]>(
        `${API_BASE}/memories/search`,
        {
          method: 'POST',
          body: JSON.stringify({ query: trimmed, limit: 5 }),
        }
      );

      // 2. For each result, enrich with relation-name (self -> person)
      const enriched: EnrichedSearchResult[] = [];

      for (const r of backendResults) {
        const topPerson = r.persons[0];
        if (!topPerson) {
          continue;
        }

        // Fetch relation name (graph API already returns language names)
        const relationResp = await fetchJSON<{
          path: string[];
          relation: string;
          english: string;
          tamil?: string | null;
          hindi?: string | null;
        }>(
          `${API_BASE}/graph/relation-name?from=self&to=${encodeURIComponent(
            topPerson.id
          )}`
        );

        const primary =
          relationResp.english ||
          relationResp.relation ||
          'Your connection';

        const tamil = relationResp.tamil || '';
        const hindi = relationResp.hindi || '';

        const person: PersonResponse = {
          id: topPerson.id,
          name: topPerson.name,
          nickname: topPerson.nickname,
          gender: 'unknown',
          tags: [],
          categories: [],
          notes: undefined,
          photo: undefined,
        };

        enriched.push({
          person,
          memorySnippet: r.raw_text,
          relationPath: primary,
          tamilName: tamil,
          hindiName: hindi,
          similarityScore: r.similarity_score,
        });
      }

      setResults(enriched);
    } catch (e: any) {
      setError(e.message ?? 'Search failed');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const search = useCallback(
    (q: string) => {
      setQuery(q);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        performSearch(q);
      }, debounceMs);
    },
    [performSearch, debounceMs]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return useMemo(
    () => ({
      results,
      isSearching,
      error,
      search,
    }),
    [results, isSearching, error, search]
  );
}

