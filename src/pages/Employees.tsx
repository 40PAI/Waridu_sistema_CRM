import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmployeeDialog, Employee } from "@/components/employees/EmployeeDialog";
import { showSuccess } from "@/utils/toast";
import { Role } from "@/App";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface EmployeesPageProps {
  roles: Role[];
  employees: Employee[];
  onSaveEmployee: (employeeData: Omit<Employee, 'id' | 'avatar'> & { id?: string }) => void;
}

const EmployeesPage = ({ roles, employees, onSaveEmployee }: EmployeesPageProps) => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingEmployee, setEditingEmployee] = React.useState<Employee | null>(null);
  
  const [nameFilter, setNameFilter] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const handleAddNew = () => {
    setEditingEmployee(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsDialogOpen(true);
  };

  const filteredEmployees = React.useMemo(() => {
    return employees.filter(employee => {
      const nameMatch = employee.name.toLowerCase().includes(nameFilter.toLowerCase());
      const roleMatch = roleFilter === 'all' || employee.role === roleFilter;
      const statusMatch = statusFilter === 'all' || employee.status === statusFilter;
      return nameMatch && roleMatch && statusMatch;
    });
  }, [employees, nameFilter, roleFilter, statusFilter]);

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
          <div className="flex items-center gap-4 mb-6">
            <Input 
              placeholder="Filtrar por nome..."
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="max-w-sm"
            />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Funções</SelectItem>
                {roles.map(role => <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                  {filteredEmployees.map((employee) => (
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
                          <TableCell>
                            <Badge variant={employee.status === 'Ativo' ? 'default' : 'secondary'}>
                              {employee.status}
                            </Badge>
                          </TableCell>
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
        onSave={onSaveEmployee}
        roles={roles}
      />
    </>
  );
};

export default EmployeesPage;