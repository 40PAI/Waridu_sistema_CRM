import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import type { Event, EventStatus } from "@/types";

// Mock data - will be replaced with real data from props
const mockEvents: Event[] = [
  { id: 1, name: "Conferência Anual de Tecnologia", startDate: "2024-08-15", endDate: "2024-08-17", location: "Centro de Convenções", startTime: "09:00", endTime: "18:00", revenue: 50000, status: 'Concluído', description: 'Evento anual para discutir as novas tendências em tecnologia.' },
  { id: 2, name: "Lançamento do Produto X", startDate: "2024-09-01", endDate: "2024-09-01", location: "Sede da Empresa", startTime: "19:00", endTime: "22:00", revenue: 25000, status: 'Planejado' },
  { id: 5, name: "Imersão de Vendas Q3", startDate: "2024-09-09", endDate: "2024-09-13", location: "Hotel Fazenda", status: "Em Andamento", description: "Treinamento intensivo para a equipe de vendas." },
];

const getStatusVariant = (status: EventStatus) => {
  switch (status) {
    case 'Planejado': return 'secondary';
    case 'Em Andamento': return 'default';
    case 'Concluído': return 'outline';
    case 'Cancelado': return 'destructive';
    default: return 'secondary';
  }
};

const TechnicianEvents = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Meus Eventos</CardTitle>
        <CardDescription>
          Lista de eventos em que você está escalado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Evento</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockEvents.length > 0 ? (
              mockEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.name}</TableCell>
                  <TableCell>
                    {format(parseISO(event.startDate), "dd/MM/yyyy", { locale: ptBR })}
                    {event.endDate && event.endDate !== event.startDate && (
                      <> - {format(parseISO(event.endDate), "dd/MM/yyyy", { locale: ptBR })}</>
                    )}
                  </TableCell>
                  <TableCell>{event.location}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(event.status)}>
                      {event.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="icon" asChild>
                      <Link to={`/technician/events/${event.id}`}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Ver Detalhes</span>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  Nenhum evento encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TechnicianEvents;