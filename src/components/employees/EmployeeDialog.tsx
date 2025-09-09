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

export interface Employee {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar: string;
}

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
  onSave: (employeeData: Omit<Employee, 'id' | 'avatar'> & { id?: string }) => void;
}

export function EmployeeDialog({ open, onOpenChange, employee, onSave }: EmployeeDialogProps) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState("");

  const isEditing = !!employee;

  React.useEffect(() => {
    if (employee) {
      setName(employee.name);
      setEmail(employee.email);
      setRole(employee.role);
    } else {
      setName("");
      setEmail("");
      setRole("");
    }
  }, [employee, open]);

  const handleSubmit = () => {
    if (!name || !email || !role) {
      // Em uma aplicação real, você usaria um toast de erro aqui.
      console.error("Todos os campos são obrigatórios.");
      return;
    }

    const employeeData = {
      id: employee?.id,
      name,
      email,
      role,
    };

    onSave(employeeData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Funcionário" : "Adicionar Novo Funcionário"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Atualize as informações do funcionário." 
              : "Preencha os dados para cadastrar um novo funcionário."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Função
            </Label>
            <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleSubmit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}