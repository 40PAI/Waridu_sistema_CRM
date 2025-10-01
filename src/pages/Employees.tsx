import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmployeeDialog, Employee } from "@/components/employees/EmployeeDialog";
import { ViewEmployeeDialog } from "@/components/employees/ViewEmployeeDialog";
import type { Role } from "@/types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { hasActionPermission } from "@/config/roles";
import { useTechnicianCategories } from "@/hooks/useTechnicianCategories";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { deleteEmployee } from "@/services/employeesService";
import { showSuccess, showError } from "@/utils/toast";

interface EmployeesPageProps {
  roles: Role[];
  employees: Employee[];
  onSaveEmployee: (employeeData: Omit<Employee, 'id' | 'avatar'> & { id?: string }) => void;
  onDeleteEmployee?: () => void;
}

const EmployeesPage = ({ roles, employees, onSaveEmployee, onDeleteEmployee }: EmployeesPageProps) => {
  const { user } = useAuth();
  const userRole = user?.profile?.role;
  const canWrite = userRole ? hasActionPermission(userRole, 'employees:write') : false;
  const canAssignCategory = userRole ? hasActionPermission(userRole, 'employees:assign_category') : false;

  const { categories } = useTechnicianCategories();
  const categoryMap = React.useMemo(() => {
    const map: Record<string, { name: string; rate: number }> = {};
    categories.forEach(c => { map[c.id] = { name: c.categoryName, rate: c.dailyRate }; });
    return map;
  }, [categories]);

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingEmployee, setEditingEmployee] = React.useState<Employee | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false);
  const [viewingEmployee, setViewingEmployee] = React.useState<Employee | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [deletingEmployee, setDeletingEmployee] = React.useState<Employee | null>(null);
  
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

  const handleView = (employee: Employee) => {
    setViewingEmployee(employee);
    setIsViewDialogOpen(true);
  };

  const handleDeleteClick = (employee: Employee) => {
    setDeletingEmployee(employee);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEmployee) return;
    
    try {
      await deleteEmployee(deletingEmployee.id);
      showSuccess(`Funcionário ${deletingEmployee.name} eliminado com sucesso.`);
      setIsDeleteDialogOpen(false);
      setDeletingEmployee(null);
      if (onDeleteEmployee) {
        onDeleteEmployee();
      }
    } catch (error) {
      console.error("Erro ao eliminar funcionário:", error);
      showError("Erro ao eliminar funcionário. Tente novamente.");
    }
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
          {canWrite && <Button onClick={handleAddNew}>Adicionar Funcionário</Button>}
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
                      <TableHead>Categoria</TableHead>
                      <TableHead>Valor/Dia</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {filteredEmployees.map((employee) => {
                    const cat = employee.technicianCategoryId ? categoryMap[employee.technicianCategoryId] : undefined;
                    return (
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
                          <TableCell>{cat ? cat.name : '—'}</TableCell>
                          <TableCell>{cat ? `AOA ${cat.rate.toLocaleString('pt-AO')}` : '—'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleView(employee)}
                                title="Visualizar"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canWrite && (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleEdit(employee)}
                                    title="Editar"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleDeleteClick(employee)}
                                    title="Eliminar"
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                      </TableRow>
                    );
                  })}
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
        categories={categories}
        canAssignCategory={canAssignCategory}
      />
      <ViewEmployeeDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        employee={viewingEmployee}
        categories={categories}
      />
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Eliminação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja eliminar o funcionário <strong>{deletingEmployee?.name}</strong>? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EmployeesPage;