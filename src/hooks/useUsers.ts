import { useState, useCallback } from 'react';

export type ListedUser = {
  id: string;
  email: string;
  role: string;
  status: 'active' | 'banned' | 'invited';
  avatar_url?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  employee?: { id: string } | null;
};

export const useUsers = () => {
  const [users, setUsers] = useState<ListedUser[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshUsers = useCallback(async () => {
    // Intentionally left minimal; can be implemented later via edge function.
    setLoading(true);
    try {
      setUsers([]); // keep empty list for now
    } finally {
      setLoading(false);
    }
  }, []);

  return { users, loading, refreshUsers };
};