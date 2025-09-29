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
import { useEmployees } from "@/hooks/useEmployees";
import { useMaterials } from "@/hooks/useMaterials";
import { useServices } from "@/hooks/useServices";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const formatCurrency = (value: number) => value.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return 'Não definido';
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return dateStr;
  }
};

const formatTime = (timeStr: string | null | undefined) => timeStr || '—';

interface RosterViewerPopoverProps {
  event: Event;
  pendingRequests?: MaterialRequest[];
}

export const RosterViewerPopover = ({ event, pendingRequests = [] }: RosterViewerPopoverProps) => {
  const { employees } = useEmployees();
  const { materials } = useMaterials();
  const { services } = useServices();
  
  const getMaterialNameById = (id: string) => materials.find(m => m.id === id)?.name || 'Desconhecido';
  const getEmployeeNameById = (id: string) => employees.find(e => e.id === id)?.name || 'Não definido';
  const getServiceNameById = (id: string) => services.find(s => s.id === id)?.name || 'Serviço Desconhecido';
  const getResponsibleNameById = (id: string | null | undefined) => {
    if (!id) return 'Não definido';
    return employees.find(e => e.id === id)?.name || 'Não definido';
  };
  
  const teamLeadName = event.roster ? getEmployeeNameById(event.roster.teamLead) : 'Não definido';
  const responsibleName = getResponsibleNameById(event.responsible_id);
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
      <PopoverContent className="w-96 max-h-[80vh] overflow-y-auto">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">{event.name}</h4>
            <p className="text-sm text-muted-foreground">
              {formatDate(event.startDate)} - {formatDate(event.endDate)}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatTime(event.startTime)} - {formatTime(event.endTime)}
            </p>
          </div>
          
          {/* Detalhes Básicos */}
          <div className="grid gap-3">
            <div>
              <h5 className="font-semibold text-sm">Local</h5>
              <p className="text-sm text-muted-foreground">{event.location || 'Não definido'}</p>
            </div>
            
            <div>
              <h5 className="font-semibold text-sm">Status</h5>
              <p className="text-sm text-muted-foreground">{event.status || 'Não definido'}</p>
            </div>
            
            {event.pipeline_status && (
              <div>
                <h5 className="font-semibold text-sm">Status do Pipeline</h5>
                <p className="text-sm text-muted-foreground">{event.pipeline_status}</p>
              </div>
            )}
            
            <div>
              <h5 className="font-semibold text-sm">Responsável Comercial</h5>
              <p className="text-sm text-muted-foreground">{responsibleName}</p>
            </div>
            
            {event.notes && (
              <div>
                <h5 className="font-semibold text-sm">Notas</h5>
                <p className="text-sm text-muted-foreground">{event.notes}</p>
              </div>
            )}
            
            {event.next_action_date && (
              <div>
                <h5 className="font-semibold text-sm">Próxima Ação</h5>
                <p className="text-sm text-muted-foreground">{formatDate(event.next_action_date)}</p>
              </div>
            )}

            {event.service_ids && event.service_ids.length > 0 && (
              <div>
                <h5 className="font-semibold text-sm">Serviços</h5>
                <div className="flex flex-wrap gap-1 mt-1">
                  {event.service_ids.map(serviceId => (
                    <Badge key={serviceId} variant="secondary" className="text-xs">
                      {getServiceNameById(serviceId)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <Separator />
          
          {/* Escalação */}
          <div className="grid gap-3">
            <div>
              <h5 className="font-semibold text-sm">Responsável da Equipe</h5>
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
                        <span className="text-muted-foreground flex items-center"><DollarSign className="h-4 w-4 mr-2"/>Receita/Valor Estimado</span>
                        <span className="font-medium">{formatCurrency(event.revenue || event.estimated_value || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center"><Wallet className="h-4 w-4 mr-2"/>Total de Despesas</span>
                        <span className="font-medium text-red-600">-{formatCurrency(totalExpenses)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t pt-2">
                        <span className="text-muted-foreground font-medium">Margem</span>
                        <span className="font-medium">{formatCurrency((event.revenue || event.estimated_value || 0) - totalExpenses)}</span>
                    </div>
                    {event.expenses && event.expenses.length > 0 && (
                        <>
                          <h6 className="font-semibold text-xs mt-2">Detalhes das Despesas:</h6>
                          <ul className="list-disc list-inside text-xs text-muted-foreground pl-2">
                              {event.expenses.map(exp => (
                                  <li key={exp.id}>{exp.description}: {formatCurrency(exp.amount)} ({exp.category})</li>
                              ))}
                          </ul>
                        </>
                    )}
                </div>
            </div>

          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};