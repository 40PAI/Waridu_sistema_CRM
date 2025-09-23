import { useCallback } from "react";
import {
  QueryClient,
  useQuery,
  useMutation,
  useQueryClient,
  QueryKey,
  QueryClientConfig,
} from "@tanstack/react-query";

// Create a default client factory (used in main)
export const createDefaultQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // No caching between page loads, always fetch fresh
        cacheTime: 0,
        staleTime: 0,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: "always",
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
};

// Generic server-state hook using react-query
export function useServerState<TData>(
  key: QueryKey,
  fetcher: () => Promise<TData>,
  options?: {
    enabled?: boolean;
    keepPreviousData?: boolean;
  }
) {
  // Ensure fetcher is always a fresh call to server (no client caching flags here).
  const query = useQuery<TData>({
    queryKey: key,
    queryFn: async () => {
      // Ensure no accidental fetch-level cache by using low-level fetch options when applicable.
      // The fetcher (e.g., supabase client) is expected to perform server requests.
      const res = await fetcher();
      return res as TData;
    },
    enabled: options?.enabled ?? true,
    keepPreviousData: options?.keepPreviousData ?? false,
    staleTime: 0,
    cacheTime: 0,
  });

  return query;
}

// Mutation helper that invalidates one or multiple query keys after success
export function useMutationWithInvalidation<TData = unknown, TVariables = unknown>(
  mutationFn: (vars: TVariables) => Promise<TData>,
  invalidateKeys: QueryKey[] | QueryKey
) {
  const qc = useQueryClient();

  const mutation = useMutation<TData, unknown, TVariables>({
    mutationFn,
    onSuccess: async () => {
      const keys = Array.isArray(invalidateKeys) ? invalidateKeys : [invalidateKeys];
      await Promise.all(keys.map((k) => qc.invalidateQueries({ queryKey: k, refetchType: "all" })));
    },
  });

  // convenience wrapper to call mutateAsync + return result
  const mutateAndInvalidate = useCallback(
    async (vars: TVariables) => {
      const res = await mutation.mutateAsync(vars);
      return res;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return {
    ...mutation,
    mutateAndInvalidate,
  };
}