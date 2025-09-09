import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

// Mock data - in a real app, this would come from an API
const employees = [
    { id: 'EMP001', name: 'Ana Silva', role: 'Gerente de Eventos' },
    { id: 'EMP002', name: 'Carlos Souza', role: 'Técnico de Som' },
    { id: 'EMP003', name: 'Beatriz Costa', role: 'Coordenadora' },
    { id: 'EMP004', name: 'Daniel Martins', role: 'Assistente' },
    { id: 'EMP005', name: 'Eduardo Lima', role: 'Técnico de Luz' },
    { id: 'EMP006', name: 'Fernanda Alves', role: 'VJ' },
    { id: 'EMP007', name: 'Gabriel Pereira', role: 'Técnico de Som' },
];

const materials = [
    { id: 'MAT001', name: 'Câmera Sony A7S III', totalQuantity: 5 },
    { id: 'MAT002', name: 'Lente Canon 24-70mm', totalQuantity: 8 },
    { id: 'MAT003', name: 'Kit de Luz Aputure 300D', totalQuantity: 3 },
    { id: 'MAT004', name: 'Microfone Rode NTG5', totalQuantity: 10 },
    { id: 'MAT005', name: 'Tripé Manfrotto', totalQuantity: 12 },
    { id: 'MAT006', name: 'Cabo HDMI 10m', totalQuantity: 30 },
    { id: 'MAT007', name: 'Gravador Zoom H6', totalQuantity: 4 },
    { id: 'MAT008', name: 'Monitor de Referência', totalQuantity: 2 },
];

interface RosterDialogProps {
  event: {
    id: number;
    name: string;
  };
}

export function RosterDialog({ event }: RosterDialogProps) {
  const [nameFilter, setNameFilter] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [selectedMaterials, setSelectedMaterials] = React.useState<Record<string, number>>({});

  const employeeRoles = React.useMemo(() => ["all", ...new Set(employees.map(e => e.role))], []);

  const filteredEmployees = React.useMemo(() => {
    return employees.filter(employee => {
      const nameMatch = employee.name.toLowerCase().includes(nameFilter.toLowerCase());
      const roleMatch = roleFilter === 'all' || employee.role === roleFilter;
      return nameMatch && roleMatch;
    });
  }, [nameFilter, roleFilter]);

  const handleMaterialCheck = (checked: boolean, materialId: string) => {
    const newSelection = { ...selectedMaterials };
    if (checked) {
      newSelection[materialId] = 1; // Default to 1 when checked
    } else {
      delete newSelection[materialId];
    }
    setSelectedMaterials(newSelection);
  };

  const handleQuantityChange = (materialId: string, quantity: number, maxQuantity: number) => {
    if (quantity > maxQuantity) {
        quantity = maxQuantity;
    }
    if (quantity < 0) {
        quantity = 0;
    }
    setSelectedMaterials(prev => ({ ...prev, [materialId]: quantity }));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">Criar Escalação</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Escalação para: {event.name}</DialogTitle>
          <DialogDescription>
            Selecione a equipe e os materiais para este evento.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6 py-4">
          <div className="space-y-4">
            <h4 className="font-medium">Equipe</h4>
            <div className="space-y-2">
                <Label htmlFor="team-lead">Responsável pela Equipe</Label>
                <Select>
                    <SelectTrigger id="team-lead">
                        <SelectValue placeholder="Selecione o responsável" />
                    </SelectTrigger>
                    <SelectContent>
                        {employees.map(emp => (
                            <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Filtrar Equipe</Label>
                <div className="flex gap-2">
                    <Input placeholder="Nome..." value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} />
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {employeeRoles.map(role => (
                                <SelectItem key={role} value={role}>{role === 'all' ? 'Todas as Funções' : role}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <ScrollArea className="h-48 rounded-md border p-4">
              <div className="space-y-2">
                {filteredEmployees.map((employee) => (
                  <div key={employee.id} className="flex items-center space-x-2">
                    <Checkbox id={`emp-${employee.id}`} />
                    <Label htmlFor={`emp-${employee.id}`}>{employee.name} <span className="text-xs text-muted-foreground">({employee.role})</span></Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div className="space-y-4">
            <h4 className="font-medium">Materiais</h4>
            <ScrollArea className="h-80 rounded-md border p-4">
              <div className="space-y-3">
                {materials.map((material) => (
                  <div key={material.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 flex-shrink min-w-0">
                      <Checkbox 
                        id={`mat-${material.id}`} 
                        onCheckedChange={(checked) => handleMaterialCheck(!!checked, material.id)}
                        checked={selectedMaterials.hasOwnProperty(material.id)}
                      />
                      <Label htmlFor={`mat-${material.id}`} className="truncate" title={material.name}>
                        {material.name} <span className="text-xs text-muted-foreground">({material.totalQuantity})</span>
                      </Label>
                    </div>
                    <Input 
                      type="number" 
                      className="h-8 w-20"
                      value={selectedMaterials[material.id] || 0}
                      onChange={(e) => handleQuantityChange(material.id, parseInt(e.target.value) || 0, material.totalQuantity)}
                      disabled={!selectedMaterials.hasOwnProperty(material.id)}
                      min={0}
                      max={material.totalQuantity}
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Salvar Escalação</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}