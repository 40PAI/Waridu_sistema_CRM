import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RosterDialog } from "@/components/roster/RosterDialog";
import { Event, Roster } from "@/App";

interface RosterManagementProps {
  events: Event[];
  onUpdateRoster: (eventId: number, rosterData: Roster) => void;
}

const RosterManagement = ({ events, onUpdateRoster }: RosterManagementProps) => {
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
                    <RosterDialog event={event} onSaveRoster={onUpdateRoster} />
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