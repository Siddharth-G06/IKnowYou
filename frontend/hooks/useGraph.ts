import useSWR from 'swr';
import { getFullGraph, getRelationName, getRelationPath } from '@/lib/api';

export function useFullGraph() {
  const { data, error, isLoading, mutate } = useSWR('/api/graph/full', getFullGraph);

  return {
    graphData: data,
    error,
    isLoading,
    refresh: mutate,
  };
}

export function useRelationName(fromId: string | null, toId: string | null) {
  const { data, error, isLoading } = useSWR(
    fromId && toId ? `/api/graph/relation-name?from=${fromId}&to=${toId}` : null,
    () => (fromId && toId ? getRelationName(fromId, toId) : null)
  );

  return {
    relation: data?.english ?? data?.relation,
    error,
    isLoading,
  };
}

export function useRelationPath(fromId: string | null, toId: string | null) {
  const { data, error, isLoading } = useSWR(
    fromId && toId ? `/api/graph/path?from=${fromId}&to=${toId}` : null,
    () => (fromId && toId ? getRelationPath(fromId, toId) : null)
  );

  return {
    pathResult: data,
    error,
    isLoading,
  };
}
