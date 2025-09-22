import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { TrendingUp, Users, Calendar, DollarSign, BarChart3, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEvents } from "@/hooks/useEvents";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { usePipelineStages } from "@/hooks/usePipelineStages";

export default function CRMDashboard() {
  const { events } = useEvents();
  const { clients } = useClients();
  const { services } = useServices();
  const { stages } = usePipelineStages();

  // Construir métricas básicas com dados existentes
  const projects = React.useMemo(() => events.filter((e: any) => !!e.pipeline_status), [events]);
  const totalProjects = projects.length;

  // Exemplo de uso de pipeline stages para exibir contagem por estágio (dinâmico)
  const stageCounts = React.useMemo(() => {
    const map: Record<string, number> = {};
    (stages || []).forEach((s: any) => {
      map[s.name] = 0;
    });
    projects.forEach((p: any) => {
      const stageId = p.pipeline_stage_id;
      if (stageId) {
        const stage = (stages || []).find((st: any) => st.id === stageId);
        if (stage) map[stage.name] = (map[stage.name] || 0) + 1;
      } else {
        // fallback
        map["Desconhecido"] = (map["Desconhecido"] || 0) + 1;
      }
    });
    return map;
  }, [projects, stages]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard CRM</h1>
          <p className="text-muted-foreground">Visão geral do pipeline comercial.</p>
        </div>
        <Badge variant="outline">Comercial</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Projetos Totais</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">Projetos no pipeline</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Serviços</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services.length}</div>
            <p className="text-xs text-muted-foreground">Serviços cadastrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pipeline por Estágio</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={Object.entries(stageCounts).map(([name, value], idx) => ({
                name,
                value,
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill={COLORS[0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Métricas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AOA 0</div>
            <p className="text-xs text-muted-foreground">Receita simulada</p>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo adicional conforme necessário... */}
    </div>
  );
}