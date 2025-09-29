import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RosterDialog } from "@/components/roster/RosterDialog";
import { RosterViewerPopover } from "@/components/roster/RosterViewerPopover";
import { EventEditDialog } from "@/components/events/EventEditDialog";
import type { Event, Roster, Expense, MaterialRequest, InventoryMaterial, EventStatus } from "@/types";
import { Employee } from "@/components/employees/EmployeeDialog";
import { Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/config/roles";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RosterManagementProps {
  events: Event[];
  employees: Employee[];
  onUpdateEventDetails: (eventId: number, details: { roster: Roster; expenses: Expense[] }) => void;
  onUpdateEvent: (updatedEvent: Event) => void;
  pendingRequests: MaterialRequest[];
  materials: InventoryMaterial[];
}

const RosterManagement = ({ events, employees, onUpdateEventDetails, onUpdateEvent, pendingRequests, materials }: RosterManagementProps) => {
  const [nameFilter, setNameFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<EventStatus | "all">("all");
  const [dateFilter, setDateFilter] = React.useState<"all" | "this-week" | "next-week" | "this-month">("all");
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<Event | null>(null);
  const { user, session } = useAuth();
  
  const [localPendingRequests, setLocalPendingRequests] = React.useState<MaterialRequest[]>(pendingRequests);

  React.useEffect(() => {
    setLocalPendingRequests(pendingRequests);
  }, [pendingRequests]);

  const canViewRequestsPage = React.useMemo(() => {
    if (!session || !user?.profile) return false;
    return hasPermission(user.profile.role, "/material-requests");
  }, [session, user]);

  const handleEditClick = (event: Event) => {
    setEditingEvent(event);
    setIsEditDialogOpen(true);
  };

  const handleRequestsChange = () => {};

  const filteredEvents = React.useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const startOfNextWeek = new Date(endOfWeek);
    startOfNextWeek.setDate(endOfWeek.getDate() + 1);
    const endOfNextWeek = new Date(startOfNextWeek);
    endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return events.filter(event => {
      const matchesName = event.name.toLowerCase().includes(nameFilter.toLowerCase());
      const matchesStatus = statusFilter === "all" || event.status === statusFilter;
      
      let matchesDate = true;
      if (dateFilter !== "all") {
        const eventDate = parseISO(event.startDate);
        if (dateFilter === "this-week") {
          matchesDate = eventDate >= startOfWeek && eventDate <= endOfWeek;
        } else if (dateFilter === "next-week") {
          matchesDate = eventDate >= startOfNextWeek && eventDate <= endOfNextWeek;
        } else if (dateFilter === "this-month") {
          matchesDate = eventDate >= startOfMonth && eventDate <= endOfMonth;
        }
      }
      
      return matchesName && matchesStatus && matchesDate;
    });
  }, [events, nameFilter, statusFilter, dateFilter]);

  const pendingByEvent = React.useMemo(() => {
    const map: Record<number, number> = {};
    localPendingRequests.forEach((r) => {
      map[r.eventId] = (map[r.eventId] || 0) + 1;
    });
    return map;
  }, [localPendingRequests]);

  const getStatusVariant = (status: EventStatus) => {
    switch (status) {
      case 'Planejado': return 'secondary';
      case 'Em Andamento': return 'default';
      case 'Concluído': return 'outline';
      case 'Cancelado': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Escalações</CardTitle>
          <CardDescription>
            Veja os próximos eventos e gerencie as escalações da equipe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Filtrar por nome do evento..."
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="md:col-span-2"
            />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as EventStatus | "all")}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Planejado">Planejado</SelectItem>
                <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                <SelectItem value="Concluído">Concluído</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por data" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Datas</SelectItem>
                <SelectItem value="this-week">Esta Semana</SelectItem>
                <SelectItem value="next-week">Próxima Semana</SelectItem>
                <SelectItem value="this-month">Este Mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Equipe</TableHead>
                <TableHead>Materiais</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => {
                  const pend = pendingByEvent[event.id] || 0;
                  const hasRoster = !!event.roster;
                  const hasMaterials = event.roster?.materials && Object.keys(event.roster.materials).length > 0;
                  
                  return (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{event.name}</span>
                          {pend > 0 && (
                            <Badge variant="secondary" className="ml-1">
                              {pend} requisição(ões) pendente(s)
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(parseISO(event.startDate), "dd/MM/yyyy", { locale: ptBR })}
                        {event.endDate && event.endDate !== event.startDate && (
                          <> - {format(parseISO(event.endDate), "dd/MM/yyyy", { locale: ptBR })}</>
                        )}
                      </TableCell>
                      <TableCell>
                        {event.startTime || '—'} - {event.endTime || '—'}
                      </TableCell>
                      <TableCell>{event.location}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(event.status)}>
                          {event.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {hasRoster ? (
                          <Badge variant="default">Definida</Badge>
                        ) : (
                          <Badge variant="secondary">Pendente</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasMaterials ? (
                          <Badge variant="default">Alocados</Badge>
                        ) : (
                          <Badge variant="secondary">Pendentes</Badge>
                        )}
                        {pend > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {pend} requisição(ões) pendente(s)
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-2">
                          {event.roster && <RosterViewerPopover event={event} pendingRequests={localPendingRequests} />}
                          {canViewRequestsPage && pend > 0 && (
                            <Link to="/material-requests">
                              <Button variant="outline" size="sm">Ver Requisições</Button>
                            </Link>
                          )}
                          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleEditClick(event)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar Evento</span>
                          </Button>
                          <RosterDialog
                            event={event}
                            employees={employees}
                            onSaveDetails={onUpdateEventDetails}
                            materials={materials}
                            onRequestsChange={handleRequestsChange}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24">
                    Nenhum evento encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editingEvent && (
        <EventEditDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          event={editingEvent}
          onSave={onUpdateEvent}
        />
      )}
    </>
  );
};

export default RosterManagement;