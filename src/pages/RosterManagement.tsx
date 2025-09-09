import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RosterDialog } from "@/components/roster/RosterDialog";
import { RosterViewerPopover } from "@/components/roster/RosterViewerPopover";
import { EventEditDialog } from "@/components/events/EventEditDialog";
import { Event, Roster, Expense } from "@/App";
import { Employee } from "@/components/employees/EmployeeDialog";
import { Edit } from "lucide-react";

interface RosterManagementProps {
  events: Event[];
  employees: Employee[];
  onUpdateEventDetails: (eventId: number, details: { roster: Roster; expenses: Expense[] }) => void;
  onUpdateEvent: (updatedEvent: Event) => void;
}

const RosterManagement = ({ events, employees, onUpdateEventDetails, onUpdateEvent }: RosterManagementProps) => {
  const [nameFilter, setNameFilter] = React.useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<Event | null>(null);

  const handleEditClick = (event: Event) => {
    setEditingEvent(event);
    setIsEditDialogOpen(true);
  };

  const filteredEvents = React.useMemo(() => {
    return events.filter(event =>
      event.name.toLowerCase().includes(nameFilter.toLowerCase())
    );
  }, [events, nameFilter]);

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
                filteredEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell>{event.date}</TableCell>
                    <TableCell>{event.location}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2">
                        {event.roster && <RosterViewerPopover event={event} />}
                        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleEditClick(event)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar Evento</span>
                        </Button>
                        <RosterDialog event={event} employees={employees} onSaveDetails={onUpdateEventDetails} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
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