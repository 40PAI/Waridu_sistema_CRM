import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmployeeDialog, Employee } from "@/components/employees/EmployeeDialog";
import { showSuccess } from "@/utils/toast";

const initialEmployees: Employee[] = [
    { id: 'EMP001', name: 'Ana Silva', role: 'Gerente de Eventos', email: 'ana.silva@email.com', avatar: '/avatars/01.png' },
    { id: 'EMP002', name: 'Carlos Souza', role: 'Técnico de Som', email: 'carlos.souza@email.com', avatar: '/avatars/02.png' },
    { id: 'EMP003', name: 'Beatriz Costa', role: 'Coordenadora', email: 'beatriz.costa@email.com', avatar: '/avatars/03.png' },
    { id: 'EMP004', name: 'Daniel Martins', role: 'Assistente', email: 'daniel.martins@email.com', avatar: '/avatars/04.png' },
];

const EmployeesPage = () => {
  const [employees, setEmployees] = React.useState(initialEmployees);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingEmployee, setEditingEmployee] = React.useState<Employee | null>(null);

  const handleAddNew = () => {
    setEditingEmployee(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsDialogOpen(true);
  };

  const handleSave = (employeeData: Omit<Employee, 'id' | 'avatar'> & { id?: string }) => {
    if (employeeData.id) {
      setEmployees(prev => 
        prev.map(emp => 
          emp.id === employeeData.id ? { ...emp, ...employeeData } : emp
        )
      );
      showSuccess("Funcionário atualizado com sucesso!");
    } else {
      const newEmployee: Employee = {
        ...employeeData,
        id: `EMP${String(employees.length + 1).padStart(3, '0')}`,
        avatar: `/avatars/0${Math.floor(Math.random() * 4) + 1}.png`,
      };
      setEmployees(prev => [...prev, newEmployee]);
      showSuccess("Funcionário adicionado com sucesso!");
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
              <CardTitle>Funcionários</CardTitle>
              <CardDescription>
              Gerencie a equipe de funcionários da empresa.
              </CardDescription>
          </div>
          <Button onClick={handleAddNew}>Adicionar Funcionário</Button>
        </CardHeader>
        <CardContent>
          <Table>
              <TableHeader>
                  <TableRow>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {employees.map((employee) => (
                      <TableRow key={employee.id}>
                          <TableCell>
                              <div className="flex items-center gap-3">
                                  <Avatar>
                                      <AvatarImage src={employee.avatar} />
                                      <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                      <p className="font-medium">{employee.name}</p>
                                      <p className="text-sm text-muted-foreground">{employee.email}</p>
                                  </div>
                              </div>
                          </TableCell>
                          <TableCell>{employee.role}</TableCell>
                          <TableCell>Ativo</TableCell>
                          <TableCell className="text-right">
                              <Button variant="outline" size="sm" onClick={() => handleEdit(employee)}>Editar</Button>
                          </TableCell>
                      </TableRow>
                  ))}
              </TableBody>
          </Table>
        </CardContent>
      </Card>
      <EmployeeDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        employee={editingEmployee}
        onSave={handleSave}
      />
    </>
  );
};

export default EmployeesPage;