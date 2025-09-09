import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const events = [
  { id: 1, name: "Conferência Anual de Tecnologia", date: "2024-08-15", location: "Centro de Convenções" },
  { id: 2, name: "Lançamento do Produto X", date: "2024-09-01", location: "Sede da Empresa" },
  { id: 3, name: "Workshop de Marketing Digital", date: "2024-09-10", location: "Online" },
  { id: 4, name: "Festa de Fim de Ano", date: "2024-12-20", location: "Salão de Festas" },
];

const RosterManagement = () => {
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
              <TableHead>Data</TableHead>
              <TableHead>Local</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.name}</TableCell>
                <TableCell>{event.date}</TableCell>
                <TableCell>{event.location}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm">Criar Escalação</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RosterManagement;