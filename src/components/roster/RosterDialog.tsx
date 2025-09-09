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
];

const materials = [
    { id: 'MAT001', name: 'Câmera Sony A7S III' },
    { id: 'MAT002', name: 'Lente Canon 24-70mm' },
    { id: 'MAT003', name: 'Kit de Luz Aputure 300D' },
    { id: 'MAT004', name: 'Microfone Rode NTG5' },
    { id: 'MAT005', name: 'Tripé Manfrotto' },
    { id: 'MAT006', name: 'Cabo HDMI 10m' },
    { id: 'MAT007', name: 'Gravador Zoom H6' },
    { id: 'MAT008', name: 'Monitor de Referência' },
];

interface RosterDialogProps {
  event: {
    id: number;
    name: string;
  };
}

export function RosterDialog({ event }: RosterDialogProps) {
  // In a real app, you'd manage the state of selected items
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
            <ScrollArea className="h-48 rounded-md border p-4">
              <div className="space-y-2">
                {employees.map((employee) => (
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
            <ScrollArea className="h-64 rounded-md border p-4">
              <div className="space-y-2">
                {materials.map((material) => (
                  <div key={material.id} className="flex items-center space-x-2">
                    <Checkbox id={`mat-${material.id}`} />
                    <Label htmlFor={`mat-${material.id}`}>{material.name}</Label>
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