'use client';

import useSWR from 'swr';
import { useEffect, useState } from 'react';
import { getGraphStats, getHealth } from '@/lib/api';
import type { GraphStats, HealthResponse } from '@/types/api';

interface UseStatsResult {
  stats: GraphStats | null;
  health: HealthResponse | null;
  isLoading: boolean;
}

export function useStats(): UseStatsResult {
  const { data: stats, error: statsError, isLoading: statsLoading } = useSWR(
    '/api/graph/stats',
    getGraphStats,
    { refreshInterval: 30_000 }
  );

  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getHealth()
      .then((h) => {
        if (!cancelled) {
          setHealth(h);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHealth(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setHealthLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isLoading = statsLoading || healthLoading;

  return {
    stats: statsError ? null : stats ?? null,
    health,
    isLoading,
  };
}

