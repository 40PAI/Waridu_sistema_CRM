import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RosterDialog } from "@/components/roster/RosterDialog";
import { RosterViewerPopover } from "@/components/roster/RosterViewerPopover";
import { Event, Roster, Expense } from "@/App";
import { Employee } from "@/components/employees/EmployeeDialog";

interface RosterManagementProps {
  events: Event[];
  employees: Employee[];
  onUpdateEventDetails: (eventId: number, details: { roster: Roster; expenses: Expense[] }) => void;
}

const RosterManagement = ({ events, employees, onUpdateEventDetails }: RosterManagementProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestão de Escalações</CardTitle>
        <CardDescription>
          Veja os próximos eventos e gerencie as escalações da equipe.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Evento</TableHead>
              <TableHead>Data de Início</TableHead>
              <TableHead>Hora de Início</TableHead>
              <TableHead>Data de Fim</TableHead>
              <TableHead>Hora de Fim</TableHead>
              <TableHead>Local</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length > 0 ? (
              events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.name}</TableCell>
                  <TableCell>{event.date}</TableCell>
                  <TableCell>{event.startTime || 'N/A'}</TableCell>
                  <TableCell>{event.endDate || 'N/A'}</TableCell>
                  <TableCell>{event.endTime || 'N/A'}</TableCell>
                  <TableCell>{event.location}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      {event.roster && <RosterViewerPopover roster={event.roster} />}
                      <RosterDialog event={event} employees={employees} onSaveDetails={onUpdateEventDetails} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  Nenhum evento encontrado. Crie um novo para começar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RosterManagement;