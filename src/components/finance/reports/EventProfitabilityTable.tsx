import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { EventStatus } from "@/types";

interface EventProfitability {
  id: number;
  name: string;
  date: string;
  revenue: number;
  costs: number;
  profit: number;
  status: EventStatus;
}

interface EventProfitabilityTableProps {
  data: EventProfitability[];
}

const getStatusVariant = (status: EventStatus) =>
  status === "Concluído" ? "default" : status === "Cancelado" ? "destructive" : "secondary";

export const EventProfitabilityTable: React.FC<EventProfitabilityTableProps> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rentabilidade por Evento</CardTitle>
        <CardDescription>Análise detalhada de cada evento no período. Ordenado por lucro.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Evento</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Receita</TableHead>
              <TableHead>Custos</TableHead>
              <TableHead>Lucro</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? data.slice(0, 10).map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium max-w-[150px] truncate">{event.name}</TableCell>
                <TableCell>{event.date}</TableCell>
                <TableCell>AOA {event.revenue.toLocaleString("pt-AO")}</TableCell>
                <TableCell>AOA {event.costs.toLocaleString("pt-AO")}</TableCell>
                <TableCell className={event.profit >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                  AOA {event.profit.toLocaleString("pt-AO")}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(event.status)}>
                    {event.status}
                  </Badge>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Nenhum evento encontrado.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {data.length > 10 && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Mostrando os 10 eventos mais rentáveis. Total: {data.length} eventos.
          </p>
        )}
      </CardContent>
    </Card>
  );
};