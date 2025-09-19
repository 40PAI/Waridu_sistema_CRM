import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Eye, DollarSign, Wallet, AlertTriangle } from "lucide-react";
import type { Event, MaterialRequest } from "@/types";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

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
const formatCurrency = (value: number) => value.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });

interface RosterViewerPopoverProps {
  event: Event;
  pendingRequests?: MaterialRequest[];
}

export const RosterViewerPopover = ({ event, pendingRequests = [] }: RosterViewerPopoverProps) => {
  const teamLeadName = event.roster ? getEmployeeNameById(event.roster.teamLead) : 'Não definido';
  const totalExpenses = event.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  
  const eventPendingRequests = pendingRequests.filter(req => req.eventId === event.id);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9">
          <Eye className="h-4 w-4" />
          <span className="sr-only">Visualizar Detalhes</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">{event.name}</h4>
            <p className="text-sm text-muted-foreground">
              {event.startDate} - {event.endDate}
            </p>
            <p className="text-sm text-muted-foreground">
              {event.startTime || '—'} - {event.endTime || '—'}
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
                {event.roster && event.roster.teamMembers.length > 0 ? event.roster.teamMembers.map(member => (
                  <li key={member.id}>{member.name} ({member.role})</li>
                )) : <li>Nenhum membro na equipe.</li>}
              </ul>
            </div>

            <div>
              <h5 className="font-semibold text-sm">Materiais</h5>
              {event.roster && Object.keys(event.roster.materials).length > 0 ? (
                <ul className="list-disc list-inside text-sm text-muted-foreground pl-2">
                  {Object.entries(event.roster.materials).map(([id, quantity]) => (
                    <li key={id}>{getMaterialNameById(id)}: {quantity}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum material alocado.</p>
              )}
              
              {eventPendingRequests.length > 0 && (
                <>
                  <Separator className="my-2" />
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="font-semibold text-sm text-yellow-600">Requisições Pendentes</h5>
                      <ul className="list-disc list-inside text-xs text-muted-foreground pl-2 mt-1">
                        {eventPendingRequests.map(req => (
                          <li key={req.id}>
                            {req.items.length} item(s) solicitado(s) por {req.requestedBy.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <Separator />

            <div>
                <h5 className="font-semibold text-sm mb-2">Financeiro</h5>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center"><DollarSign className="h-4 w-4 mr-2"/>Receita Bruta</span>
                        <span className="font-medium">{formatCurrency(event.revenue || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center"><Wallet className="h-4 w-4 mr-2"/>Total de Despesas</span>
                        <span className="font-medium text-red-600">-{formatCurrency(totalExpenses)}</span>
                    </div>
                    {event.expenses && event.expenses.length > 0 && (
                        <ul className="list-disc list-inside text-xs text-muted-foreground pl-4 pt-1">
                            {event.expenses.map(exp => (
                                <li key={exp.id}>{exp.description}: {formatCurrency(exp.amount)}</li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};