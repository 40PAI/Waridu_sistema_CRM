import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Roster } from "@/App";

// Mock data para buscar nomes - em uma aplicação real, isso viria de uma fonte de dados compartilhada.
const materialsData = [
    { id: 'MAT001', name: 'Câmera Sony A7S III' },
    { id: 'MAT002', name: 'Lente Canon 24-70mm' },
    { id: 'MAT003', name: 'Kit de Luz Aputure 300D' },
    { id: 'MAT004', name: 'Microfone Rode NTG5' },
    { id: 'MAT005', name: 'Tripé Manfrotto' },
    { id: 'MAT006', name: 'Cabo HDMI 10m' },
    { id: 'MAT007', name: 'Gravador Zoom H6' },
    { id: 'MAT008', name: 'Monitor de Referência' },
];

const employeesData = [
    { id: 'EMP001', name: 'Ana Silva' },
    { id: 'EMP002', name: 'Carlos Souza' },
    { id: 'EMP003', name: 'Beatriz Costa' },
    { id: 'EMP004', name: 'Daniel Martins' },
    { id: 'EMP005', name: 'Eduardo Lima' },
    { id: 'EMP006', name: 'Fernanda Alves' },
    { id: 'EMP007', name: 'Gabriel Pereira' },
];

const getMaterialNameById = (id: string) => materialsData.find(m => m.id === id)?.name || 'Desconhecido';
const getEmployeeNameById = (id: string) => employeesData.find(e => e.id === id)?.name || 'Não definido';

interface RosterViewerPopoverProps {
  roster: Roster;
}

export const RosterViewerPopover = ({ roster }: RosterViewerPopoverProps) => {
  const teamLeadName = getEmployeeNameById(roster.teamLead);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9">
          <Eye className="h-4 w-4" />
          <span className="sr-only">Visualizar Escalação</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Detalhes da Escalação</h4>
            <p className="text-sm text-muted-foreground">
              Resumo da equipe e materiais alocados.
            </p>
          </div>
          <div className="grid gap-3">
            <div>
              <h5 className="font-semibold text-sm">Responsável</h5>
              <p className="text-sm text-muted-foreground">{teamLeadName}</p>
            </div>
            
            <div>
              <h5 className="font-semibold text-sm">Equipe</h5>
              <ul className="list-disc list-inside text-sm text-muted-foreground pl-2">
                {roster.teamMembers.length > 0 ? roster.teamMembers.map(member => (
                  <li key={member.id}>{member.name}</li>
                )) : <li>Nenhum membro na equipe.</li>}
              </ul>
            </div>

            <div>
              <h5 className="font-semibold text-sm">Materiais</h5>
              {Object.keys(roster.materials).length > 0 ? (
                <ul className="list-disc list-inside text-sm text-muted-foreground pl-2">
                  {Object.entries(roster.materials).map(([id, quantity]) => (
                    <li key={id}>{getMaterialNameById(id)}: {quantity}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum material alocado.</p>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};