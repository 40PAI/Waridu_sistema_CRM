import Employees from "@/pages/Employees";
import { useRoles } from "@/hooks/useRoles";
import { useEmployees } from "@/hooks/useEmployees";

export default function EmployeesWrapper() {
  const { roles } = useRoles();
  const { employees, saveEmployee, refreshEmployees } = useEmployees();
  return <Employees roles={roles || []} employees={employees} onSaveEmployee={saveEmployee} onDeleteEmployee={refreshEmployees} />;
}
