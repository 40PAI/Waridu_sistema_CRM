"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Users, TrendingUp, Activity, Clock, Target } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Event } from "@/types";
import type { Communication } from "@/hooks/useCommunications";

interface ClientMetricsProps {
  events: Event[];
  communications: Communication[];
}

const ClientMetrics: React.FC<ClientMetricsProps> = ({ events, communications }) => {
  const totalProjects = events.length;
  const confirmedProjects = events.filter(e => e.pipeline_status === 'Confirmado').length;
  const activeProjects = events.filter(e => e.pipeline_status !== 'Cancelado').length;
  const totalRevenue = events.reduce((sum, e) => sum + (e.estimated_value || 0), 0);
  const lastContact = communications.length > 0 ? communications[0].date : null;
  const conversionRate = totalProjects > 0 ? ((confirmedProjects / totalProjects) * 100).toFixed(1) : '0';

  const metrics = [
    {
      label: "Total de Projetos",
      value: totalProjects.toString(),
      icon: Users,
      color: "text-blue-600"
    },
    {
      label: "Projetos Confirmados",
      value: confirmedProjects.toString(),
      icon: Target,
      color: "text-green-600"
    },
    {
      label: "Projetos Ativos",
      value: activeProjects.toString(),
      icon: Activity,
      color: "text-orange-600"
    },
    {
      label: "Receita Estimada",
      value: `AOA ${totalRevenue.toLocaleString("pt-AO")}`,
      icon: DollarSign,
      color: "text-purple-600"
    },
    {
      label: "Taxa de Conversão",
      value: `${conversionRate}%`,
      icon: TrendingUp,
      color: "text-indigo-600"
    },
    {
      label: "Último Contato",
      value: lastContact ? format(new Date(lastContact), "dd/MM", { locale: ptBR }) : "—",
      icon: Clock,
      color: "text-gray-600"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
              <div>
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-xs text-muted-foreground">{metric.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ClientMetrics;