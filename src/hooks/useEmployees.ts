import { useState, useEffect, useMemo } from "react";
import { Employee } from "@/components/employees/EmployeeDialog";
import { showError, showSuccess } from "@/utils/toast";
import * as employeesService from "@/services/employeesService";

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
        };
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
    fetchEmployees();
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