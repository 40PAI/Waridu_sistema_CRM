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

/**
 * Fetches users with their profiles and employee data.
 * @param roleFilter - Optional role to filter users by (e.g., 'Comercial'). If null/undefined, returns all users.
 */
export const useUsers = (roleFilter?: string | null) => {
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]); // Re-fetch if roleFilter changes

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build the query with optional role filter
      let query = supabase
        .from("profiles")
        .select("id, first_name, last_name, role, banned_until, avatar_url")
        .order("first_name", { ascending: true });

      if (roleFilter) {
        query = query.eq("role", roleFilter);
      }

      const { data: profiles, error: profilesError } = await query;

      if (profilesError) throw profilesError;

      const profileIds: string[] = (profiles || []).map((p: any) => p.id).filter(Boolean);

      // Fetch employees where user_id IN (profileIds)
      let employeesByUserId: Record<string, any> = {};
      if (profileIds.length > 0) {
        const { data: employees, error: empError } = await supabase
          .from("employees")
          .select("id, name, email, status, user_id")
          .in("user_id", profileIds);

        if (empError) {
          console.error("Warning: could not fetch employees relation:", empError);
        } else {
          employeesByUserId = (employees || []).reduce<Record<string, any>>((acc, emp: any) => {
            if (emp.user_id) acc[emp.user_id] = emp;
            return acc;
          }, {});
        }
      }

      // Map to the expected format
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