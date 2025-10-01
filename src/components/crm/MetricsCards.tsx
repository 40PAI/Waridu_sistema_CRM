"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { DollarSign, Calendar as CalendarIcon, TrendingUp } from "lucide-react";

interface Metrics {
  totalEstimated: number;
  confirmedValue: number;
}

interface ClientStats {
  totalClients: number;
  activeClients: number;
  highValueClients: number;
}

interface Props {
  filteredProjectsCount: number;
  metrics: Metrics;
  clients: ClientStats;
}

const MetricsCards: React.FC<Props> = ({ filteredProjectsCount, metrics, clients }) => {
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
          <div className={`text-2xl font-bold ${metrics.confirmedValue >= 0 ? "text-green-600" : "text-red-600"}`}>
            AOA {metrics.confirmedValue.toLocaleString("pt-AO")}
          </div>
          <div className="text-xs text-muted-foreground">Projetos confirmados</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MetricsCards;