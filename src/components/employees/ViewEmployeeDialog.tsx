import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Employee } from "./EmployeeDialog";

type TechnicianCategory = {
  id: string;
  categoryName: string;
  dailyRate: number;
};

interface ViewEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  categories: TechnicianCategory[];
}

export function ViewEmployeeDialog({ open, onOpenChange, employee, categories }: ViewEmployeeDialogProps) {
  if (!employee) return null;

  const category = employee.technicianCategoryId 
    ? categories.find(c => c.id === employee.technicianCategoryId)
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Detalhes do Funcionário</DialogTitle>
          <DialogDescription>
            Visualize as informações do funcionário.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={employee.avatar} />
              <AvatarFallback className="text-lg">{employee.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">{employee.name}</h3>
              <p className="text-sm text-muted-foreground">{employee.email}</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label className="text-muted-foreground">Função</Label>
              <div className="col-span-2 font-medium">{employee.role}</div>
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <Label className="text-muted-foreground">Status</Label>
              <div className="col-span-2">
                <Badge variant={employee.status === 'Ativo' ? 'default' : 'secondary'}>
                  {employee.status}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <Label className="text-muted-foreground">Categoria</Label>
              <div className="col-span-2 font-medium">
                {category ? category.categoryName : '—'}
              </div>
            </div>

            {category && (
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-muted-foreground">Valor/Dia</Label>
                <div className="col-span-2 font-medium">
                  AOA {category.dailyRate.toLocaleString('pt-AO')}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
