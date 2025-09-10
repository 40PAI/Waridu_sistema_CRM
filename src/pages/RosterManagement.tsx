import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RosterDialog } from "@/components/roster/RosterDialog";
import { RosterViewerPopover } from "@/components/roster/RosterViewerPopover";
import { EventEditDialog } from "@/components/events/EventEditDialog";
import { Event, Roster, Expense, MaterialRequest } from "@/App";
import { Employee } from "@/components/employees/EmployeeDialog";
import { Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/config/roles";

interface RosterManagementProps {
  events: Event[];
  employees: Employee[];
  onUpdateEventDetails: (eventId: number, details: { roster: Roster; expenses: Expense[] }) => void;
  onUpdateEvent: (updatedEvent: Event) => void;
  onCreateMaterialRequest: (eventId: number, items: Record<string, number>, requestedBy: { name: string; email: string; role: string }) => void;
  pendingRequests: MaterialRequest[];
}

const RosterManagement = ({ events, employees, onUpdateEventDetails, onUpdateEvent, onCreateMaterialRequest, pendingRequests }: RosterManagementProps) => {
  const [nameFilter, setNameFilter] = React.useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<Event | null>(null);
  const { user, isAuthenticated } = useAuth();

  const canViewRequestsPage = React.useMemo(() => {
    if (!isAuthenticated || !user) return false;
    return hasPermission(user.role, "/material-requests");
  }, [isAuthenticated, user]);

  const handleEditClick = (event: Event) => {
    setEditingEvent(event);
    setIsEditDialogOpen(true);
  };

  const filteredEvents = React.useMemo(() => {
    return events.filter(event =>
      event.name.toLowerCase().includes(nameFilter.toLowerCase())
    );
  }, [events, nameFilter]);

  const pendingByEvent = React.useMemo(() => {
    const map: Record<number, number> = {};
    pendingRequests.forEach((r) => {
      map[r.eventId] = (map[r.eventId] || 0) + 1;
    });
    return map;
  }, [pendingRequests]);

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
          <div className="mb-6">
            <Input
              placeholder="Filtrar por nome do evento..."
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Data de Início</TableHead>
                <TableHead>Local</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => {
                  const pend = pendingByEvent[event.id] || 0;
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
                      <TableCell>{event.startDate}</TableCell>
                      <TableCell>{event.location}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-2">
                          {event.roster && <RosterViewerPopover event={event} />}
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
                            onCreateMaterialRequest={onCreateMaterialRequest}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
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