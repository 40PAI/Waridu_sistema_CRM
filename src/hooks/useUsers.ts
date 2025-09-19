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
  } | null;
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

      // 1) Buscar perfis (tabela public.profiles) - apenas colunas simples
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, role, banned_until, avatar_url")
        .order("first_name", { ascending: true });

      if (profilesError) throw profilesError;

      const profileIds: string[] = (profiles || []).map((p: any) => p.id).filter(Boolean);

      // 2) Buscar employees onde user_id IN (profileIds) — evita select aninhado problemático
      let employeesByUserId: Record<string, any> = {};
      if (profileIds.length > 0) {
        const { data: employees, error: empError } = await supabase
          .from("employees")
          .select("id, name, email, status, user_id")
          .in("user_id", profileIds);

        if (empError) {
          // não falhar totalmente só por causa do join: log e continue com profiles
          console.error("Warning: could not fetch employees relation:", empError);
        } else {
          employeesByUserId = (employees || []).reduce<Record<string, any>>((acc, emp: any) => {
            if (emp.user_id) acc[emp.user_id] = emp;
            return acc;
          }, {});
        }
      }

      // Mapear para formato consumido pela UI
      const formattedUsers: UserWithProfile[] = (profiles || []).map((prof: any) => {
        const now = new Date();
        const bannedUntil = prof.banned_until ? new Date(prof.banned_until) : null;
        let status: 'active' | 'banned' | 'deleted' = 'active';
        if (bannedUntil && bannedUntil > now) status = 'banned';

        const employeeRow = employeesByUserId[prof.id] || null;
        const emailFromEmployee = employeeRow?.email || "";

        return {
          id: prof.id,
          email: emailFromEmployee,
          first_name: prof.first_name,
          last_name: prof.last_name,
          role: prof.role,
          banned_until: prof.banned_until,
          avatar_url: prof.avatar_url,
          employee: employeeRow
            ? {
                id: employeeRow.id,
                name: employeeRow.name,
                email: employeeRow.email,
                status: employeeRow.status,
              }
            : null,
          status,
          last_sign_in_at: null,
        } as UserWithProfile;
      });

      setUsers(formattedUsers);
    } catch (err: any) {
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