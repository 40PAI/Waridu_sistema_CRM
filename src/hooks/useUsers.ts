import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";

export interface UserWithProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  banned_until: string | null;
  avatar_url: string | null;
  employee?: {
    id: string;
    name: string;
    email: string;
    status: string;
  };
  status: 'active' | 'banned' | 'deleted';
  last_sign_in_at: string | null;
}

export const useUsers = () => {
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          role,
          banned_until,
          avatar_url,
          employees!user_id(id, name, email, status),
          auth.users!id(email, last_sign_in_at)
        `)
        .order('first_name', { ascending: true });

      if (error) throw error;

      const formattedUsers: UserWithProfile[] = (data || []).map((user: any) => {
        const now = new Date();
        const bannedUntil = user.banned_until ? new Date(user.banned_until) : null;
        let status: 'active' | 'banned' | 'deleted' = 'active';
        if (bannedUntil && bannedUntil > now) status = 'banned';
        // Note: 'deleted' seria se o user fosse removido de auth.users, mas aqui assumimos ativo

        return {
          id: user.id,
          email: user['auth.users']?.email || '',
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          banned_until: user.banned_until,
          avatar_url: user.avatar_url,
          employee: user.employees ? {
            id: user.employees.id,
            name: user.employees.name,
            email: user.employees.email,
            status: user.employees.status,
          } : undefined,
          status,
          last_sign_in_at: user['auth.users']?.last_sign_in_at || null,
        };
      });

      setUsers(formattedUsers);
    } catch (err) {
      console.error("Error fetching users:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao carregar usuários.";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    users,
    loading,
    error,
    refreshUsers: fetchUsers,
  };
};