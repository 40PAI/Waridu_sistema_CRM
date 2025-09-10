import { useState } from "react";
import { Employee } from "@/components/employees/EmployeeDialog";

export const useEmployees = () => {
  const initialEmployees: Employee[] = [
    { id: 'EMP001', name: 'Ana Silva', role: 'Admin', email: 'ana.silva@email.com', avatar: '/avatars/01.png', status: 'Ativo', costPerDay: 500 },
    { id: 'EMP002', name: 'Carlos Souza', role: 'Técnico', email: 'carlos.souza@email.com', avatar: '/avatars/02.png', status: 'Ativo', costPerDay: 350 },
    { id: 'EMP003', name: 'Beatriz Costa', role: 'Coordenador', email: 'beatriz.costa@email.com', avatar: '/avatars/03.png', status: 'Inativo', costPerDay: 400 },
    { id: 'EMP004', name: 'Daniel Martins', role: 'Gestor de Material', email: 'daniel.martins@email.com', avatar: '/avatars/04.png', status: 'Ativo', costPerDay: 200 },
  ];

  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);

  const saveEmployee = (employeeData: Omit<Employee, 'id' | 'avatar'> & { id?: string }) => {
    if (employeeData.id) {
      setEmployees(prev => 
        prev.map(emp => 
          emp.id === employeeData.id ? { ...emp, ...employeeData } as Employee : emp
        )
      );
    } else {
      const newEmployee: Employee = {
        ...employeeData,
        id: `EMP${String(employees.length + 1).padStart(3, '0')}`,
        avatar: `/avatars/0${Math.floor(Math.random() * 4) + 1}.png`,
      };
      setEmployees(prev => [...prev, newEmployee]);
    }
  };

  return {
    employees,
    saveEmployee
  };
};