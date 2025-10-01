"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Calendar as CalendarIcon, TrendingUp } from "lucide-react";
import type { Event, Communication } from "@/types";

interface Props {
  events: Event[];
  communications: Communication[];
}

const ClientMetrics: React.FC<Props> = ({ events, communications }) => {
  const filteredProjectsCount = events.length;

  const metrics = React.useMemo(() => {
    const totalEstimated = events.reduce((sum, e) => sum + (Number(e.estimated_value) || 0), 0);
    const confirmedValue = events
      .filter((e) => e.pipeline_status === "Confirmado")
      .reduce((sum, e) => sum + (Number(e.estimated_value) || 0), 0);
    return { totalEstimated, confirmedValue };
  }, [events]);

  const clients = React.useMemo(() => {
    // For the single-client view we can provide simple derived stats from communications
    const totalClients = 1;
    const activeClients = communications.length > 0 ? 1 : 0;
    const highValueClients = events.some((e) => (e.estimated_value || 0) > 100000) ? 1 : 0;
    return { totalClients, activeClients, highValueClients };
  }, [events, communications]);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Projetos Totais</CardTitle>
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{filteredProjectsCount}</div>
          <div className="text-xs text-muted-foreground">Projetos no pipeline</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Valor Estimado Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">AOA {metrics.totalEstimated.toLocaleString("pt-AO")}</div>
          <div className="text-xs text-muted-foreground">Soma de todos os projetos</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Valor Confirmado</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">AOA {metrics.confirmedValue.toLocaleString("pt-AO")}</div>
          <div className="text-xs text-muted-foreground">Projetos confirmados</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientMetrics;