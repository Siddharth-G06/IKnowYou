'use client';

import { useCallback, useRef, useState } from 'react';
import * as api from '@/lib/api';

export interface PersonMention {
  name: string | null;
  nickname: string | null;
  relation_raw: string | null;
  occupation: string | null;
  location: string | null;
}

export interface ExtractionResult {
  persons: PersonMention[];
  event: string | null;
  date_mentioned: string | null;
  notes: string | null;
  raw_text: string;
  extraction_success: boolean;
}

export interface PendingConfirmation {
  id: string;
  person_id: string;
  person_name: string;
  relation_raw: string;
}

export interface MemoryResponse {
  id: string;
  raw_text: string;
  extraction: ExtractionResult;
  person_ids: string[];
  created_at: string;
  pending_confirmations: PendingConfirmation[];
  warnings?: string[];
}

export interface MemoryFeedItem {
  id: string;
  raw_text: string;
  event: string | null;
  date_mentioned: string | null;
  created_at: string;
  persons: { id: string; name: string; nickname: string | null }[];
}

interface UseMemoriesState {
  memories: MemoryFeedItem[];
  isLogging: boolean;
  isFetching: boolean;
  extractionResult: MemoryResponse | null;
  error: string | null;
  logMemory: (raw_text: string) => Promise<MemoryResponse | null>;
  getMemories: () => Promise<void>;
  clearExtraction: () => void;
}

export function useMemories(): UseMemoriesState {
  const [memories, setMemories] = useState<MemoryFeedItem[]>([]);
  const [isLogging, setIsLogging] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [extractionResult, setExtractionResult] = useState<MemoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const logMemory = useCallback(async (raw_text: string): Promise<MemoryResponse | null> => {
    setIsLogging(true);
    setError(null);
    try {
      const data = await api.logMemory(raw_text) as unknown as MemoryResponse;
      setExtractionResult(data);
      // Refresh the feed
      const feed = await api.getMemories() as unknown as MemoryFeedItem[];
      setMemories(Array.isArray(feed) ? feed : []);
      return data;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Failed to log memory';
      setError(msg);
      return null;
    } finally {
      setIsLogging(false);
    }
  }, []);

  const getMemories = useCallback(async () => {
    setIsFetching(true);
    setError(null);
    try {
      const feed = await api.getMemories() as unknown as MemoryFeedItem[];
      setMemories(Array.isArray(feed) ? feed : []);
      hasFetched.current = true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Failed to fetch memories';
      setError(msg);
    } finally {
      setIsFetching(false);
    }
  }, []);

  const clearExtraction = useCallback(() => {
    setExtractionResult(null);
  }, []);

  return {
    memories,
    isLogging,
    isFetching,
    extractionResult,
    error,
    logMemory,
    getMemories,
    clearExtraction,
  };
}
