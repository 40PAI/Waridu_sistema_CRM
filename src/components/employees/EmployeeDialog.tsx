import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Role } from "@/types";
import { showError } from "@/utils/toast";
import { useAutoId } from "@/hooks/useAutoId";

export type EmployeeStatus = 'Ativo' | 'Inativo';

export interface Employee {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar: string;
  status: EmployeeStatus;
  technicianCategoryId?: string | null;
  userId?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}

type TechnicianCategory = {
  id: string;
  categoryName: string;
  dailyRate: number;
};

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
  onSave: (employeeData: Omit<Employee, 'id' | 'avatar'> & { id?: string }) => void;
  roles: Role[];
  categories: TechnicianCategory[];
  canAssignCategory: boolean;
}

export function EmployeeDialog({ open, onOpenChange, employee, onSave, roles, categories, canAssignCategory }: EmployeeDialogProps) {
  // Generate unique IDs for form fields
  const getId = useAutoId('employee-dialog');
  
  // Ref for first field focus
  const firstFieldRef = React.useRef<HTMLInputElement>(null);
  
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState("");
  const [status, setStatus] = React.useState<EmployeeStatus>("Ativo");
  const [technicianCategoryId, setTechnicianCategoryId] = React.useState<string>("");

  const isEditing = !!employee;

  React.useEffect(() => {
    if (open) {
      if (employee) {
        setName(employee.name);
        setEmail(employee.email);
        setRole(employee.role);
        setStatus(employee.status);
        setTechnicianCategoryId(employee.technicianCategoryId || "");
      } else {
        setName("");
        setEmail("");
        setRole("");
        setStatus("Ativo");
        setTechnicianCategoryId("");
      }
      
      // Focus first field for accessibility
      setTimeout(() => {
        firstFieldRef.current?.focus();
      }, 100);
    }
  }, [employee, open]);

  const handleSubmit = () => {
    if (!name || !email || !role) {
      showError("Nome, email e função são obrigatórios.");
      return;
    }

    const formattedName = name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    const employeeData = {
      id: employee?.id,
      name: formattedName,
      email,
      role,
      status,
      technicianCategoryId: technicianCategoryId || undefined,
    };

    onSave(employeeData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[425px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={getId('title')}
        aria-describedby={getId('description')}
      >
        <DialogHeader>
          <DialogTitle id={getId('title')}>{isEditing ? "Editar Funcionário" : "Adicionar Novo Funcionário"}</DialogTitle>
          <DialogDescription id={getId('description')}>
            {isEditing 
              ? "Atualize as informações do funcionário." 
              : "Preencha os dados para cadastrar um novo funcionário."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor={getId('name')} className="text-right">
              Nome
            </Label>
            <Input 
              id={getId('name')} 
              name="employee-name"
              autoComplete="name"
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="col-span-3"
              ref={firstFieldRef}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor={getId('email')} className="text-right">
              Email
            </Label>
            <Input 
              id={getId('email')} 
              name="employee-email"
              autoComplete="email"
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="col-span-3" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor={getId('role')} id={getId('role-label')} className="text-right">
              Função
            </Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger 
                id={getId('role')} 
                className="col-span-3"
                aria-labelledby={getId('role-label')}
              >
                <SelectValue placeholder="Selecione uma função" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.name}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor={getId('status')} id={getId('status-label')} className="text-right">
              Status
            </Label>
            <Select value={status} onValueChange={(value) => setStatus(value as EmployeeStatus)}>
              <SelectTrigger 
                id={getId('status')} 
                className="col-span-3"
                aria-labelledby={getId('status-label')}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor={getId('category')} id={getId('category-label')} className="text-right">Categoria</Label>
            <Select
              value={technicianCategoryId}
              onValueChange={setTechnicianCategoryId}
              disabled={!canAssignCategory}
            >
              <SelectTrigger 
                id={getId('category')} 
                className="col-span-3"
                aria-labelledby={getId('category-label')}
              >
                <SelectValue placeholder={canAssignCategory ? "Selecione a categoria" : "Sem permissão para alterar"} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.categoryName} — AOA {c.dailyRate.toLocaleString("pt-AO")}/dia
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleSubmit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}