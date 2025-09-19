import { useState, useEffect, useMemo } from "react";
import { Employee } from "@/components/employees/EmployeeDialog";
import { showError, showSuccess } from "@/utils/toast";
import * as employeesService from "@/services/employeesService";
import { supabase } from "@/integrations/supabase/client";

/**
 * Deterministic hash function to produce an integer from a string id.
 * Used to choose a stable fallback avatar image per employee.
 */
function hashToIndex(id: string, max: number) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % max;
}

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await employeesService.fetchEmployees();

      const formattedEmployees: Employee[] = (data || []).map((emp: any) => {
        const fallbackIndex = hashToIndex(String(emp.id), 4) + 1;
        const fallbackAvatar = `/avatars/0${fallbackIndex}.png`;
        return {
          id: emp.id,
          name: emp.name,
          role: emp.role,
          email: emp.email,
          avatar: emp.avatar || emp.avatar_url || fallbackAvatar,
          status: emp.status,
          technicianCategoryId: emp.technician_category || null,
          userId: emp.user_id || null,
          first_name: emp.first_name || null,
          last_name: emp.last_name || null,
        } as Employee;
      });

      setEmployees(formattedEmployees);
    } catch (err: any) {
      console.error("Error fetching employees:", err);
      const msg = err instanceof Error ? err.message : "Erro ao carregar funcionários.";
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    let subscription: any = null;

    const init = async () => {
      try {
        // Check if there's an active session first — avoids RLS returning empty results
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          // session exists, fetch immediately
          await fetchEmployees();
          return;
        }

        // No session yet: subscribe to auth changes and fetch when a session appears
        const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (!mounted) return;
          if (session?.user) {
            try {
              await fetchEmployees();
            } catch (e) {
              // fetchEmployees already logs
            }
          } else {
            // If signed out, clear employees to reflect auth state
            setEmployees([]);
          }
        });
        subscription = listener;
      } catch (err) {
        console.error("Unexpected error initializing employees hook:", err);
        if (mounted) {
          setError(err instanceof Error ? err.message : "Erro inesperado");
        }
      }
    };

    init();

    return () => {
      mounted = false;
      if (subscription && subscription.subscription) {
        try {
          subscription.subscription.unsubscribe();
        } catch {
          // ignore
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveEmployee = async (employeeData: Omit<Employee, 'id' | 'avatar'> & { id?: string }) => {
    try {
      await employeesService.upsertEmployee(employeeData);
      showSuccess("Funcionário salvo com sucesso!");
      await fetchEmployees();
    } catch (err) {
      console.error("Error saving employee:", err);
      const msg = err instanceof Error ? err.message : "Erro ao salvar funcionário.";
      showError(msg);
    }
  };

  const activeEmployees = useMemo(() => employees.filter(e => e.status === 'Ativo'), [employees]);

  return {
    employees,
    activeEmployees,
    loading,
    error,
    saveEmployee,
    refreshEmployees: fetchEmployees
  };
};