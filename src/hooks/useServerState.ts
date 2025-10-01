import { useCallback } from "react";
import {
  QueryClient,
  useQuery,
  useMutation,
  useQueryClient,
  QueryKey,
  QueryClientConfig,
  UseQueryOptions, // Import UseQueryOptions
} from "@tanstack/react-query";

// Create a default client factory (used in main)
export const createDefaultQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // No caching between page loads, always fetch fresh
        gcTime: 0,
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
  // Explicitly define the type for useQuery options
  const queryOptions: UseQueryOptions<TData, Error, TData, QueryKey> = { // Corrected type arguments
    queryKey: key,
    queryFn: async () => {
      const res = await fetcher();
      return res;
    },
    enabled: options?.enabled ?? true,
    // keepPreviousData is deprecated in v5, use placeholderData or select instead if needed
    // For now, removing it as it's causing a type error and might not be strictly necessary for this use case
    // If previous data behavior is critical, consider migrating to placeholderData or a custom solution.
    staleTime: 0,
    gcTime: 0,
  };

  const query = useQuery<TData, Error, TData, QueryKey>(queryOptions);

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