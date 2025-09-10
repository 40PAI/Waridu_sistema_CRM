import { useState, useEffect } from "react";
import { Employee } from "@/components/employees/EmployeeDialog";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      const formattedEmployees: Employee[] = (data || []).map((emp: any) => ({
        id: emp.id,
        name: emp.name,
        role: emp.role,
        email: emp.email,
        avatar: `/avatars/0${Math.floor(Math.random() * 4) + 1}.png`,
        status: emp.status,
        costPerDay: emp.cost_per_day
      }));

      setEmployees(formattedEmployees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      showError("Erro ao carregar funcionários.");
    } finally {
      setLoading(false);
    }
  };

  const saveEmployee = async (employeeData: Omit<Employee, 'id' | 'avatar'> & { id?: string }) => {
    try {
      if (employeeData.id) {
        // Update existing employee
        const { error } = await supabase
          .from('employees')
          .update({
            name: employeeData.name,
            role: employeeData.role,
            email: employeeData.email,
            status: employeeData.status,
            cost_per_day: employeeData.costPerDay
          })
          .eq('id', employeeData.id);

        if (error) throw error;
        showSuccess("Funcionário atualizado com sucesso!");
      } else {
        // Create new employee
        const { error } = await supabase
          .from('employees')
          .insert({
            name: employeeData.name,
            role: employeeData.role,
            email: employeeData.email,
            status: employeeData.status,
            cost_per_day: employeeData.costPerDay
          });

        if (error) throw error;
        showSuccess("Funcionário adicionado com sucesso!");
      }

      fetchEmployees(); // Refresh the list
    } catch (error) {
      console.error("Error saving employee:", error);
      showError("Erro ao salvar funcionário.");
    }
  };

  return {
    employees,
    loading,
    saveEmployee,
    refreshEmployees: fetchEmployees
  };
};