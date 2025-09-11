import { useState, useEffect, useMemo } from "react";
import { Employee } from "@/components/employees/EmployeeDialog";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

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

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      // If your employees table contains a real avatar column (e.g. avatar_url),
      // prefer it. Otherwise we provide a stable fallback based on id.
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
        };
      });

      setEmployees(formattedEmployees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao carregar funcionários.";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const saveEmployee = async (employeeData: Omit<Employee, 'id' | 'avatar'> & { id?: string }) => {
    try {
      if (employeeData.id) {
        const { error } = await supabase
          .from('employees')
          .update({
            name: employeeData.name,
            role: employeeData.role,
            email: employeeData.email,
            status: employeeData.status,
            technician_category: employeeData.technicianCategoryId || null,
          })
          .eq('id', employeeData.id);

        if (error) throw error;
        showSuccess("Funcionário atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from('employees')
          .insert({
            name: employeeData.name,
            role: employeeData.role,
            email: employeeData.email,
            status: employeeData.status,
            technician_category: employeeData.technicianCategoryId || null,
          });

        if (error) throw error;
        showSuccess("Funcionário adicionado com sucesso!");
      }

      fetchEmployees(); // Refresh the list
    } catch (error) {
      console.error("Error saving employee:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao salvar funcionário.";
      showError(errorMessage);
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