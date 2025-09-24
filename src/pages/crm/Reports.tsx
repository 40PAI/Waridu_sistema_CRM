"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import ReportsFilters from "@/components/crm/ReportsFilters";
import { useEvents } from "@/hooks/useEvents";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CRMReports() {
  const { events } = useEvents();
  const { clients } = useClients();
  const { services } = useServices();

  const [dateRange, setDateRange] = React.useState<any | undefined>(undefined);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [sectorFilter, setSectorFilter] = React.useState<string>("all");
  const [personaFilter, setPersonaFilter] = React.useState<string>("all");
  const [lifecycleFilter, setLifecycleFilter] = React.useState<string>("all");

  const projects = React.useMemo(() => (events || []).filter(e => !!(e as any).pipeline_status), [events]);

  const clientsMap = React.useMemo(() => {
    const map: Record<string, any> = {};
    clients.forEach(c => map[c.id] = c);
    return map;
  }, [clients]);

  const filteredProjects = React.useMemo(() => {
    return projects.filter(p => {
      const client = clientsMap[p.client_id || ""];
      const matchesSector = sectorFilter === "all" || client?.sector === sectorFilter;
      const matchesPersona = personaFilter === "all" || client?.persona === personaFilter;
      const matchesLifecycle = lifecycleFilter === "all" || client?.lifecycle_stage === lifecycleFilter;
      return matchesSector && matchesPersona && matchesLifecycle;
    });
  }, [projects, sectorFilter, personaFilter, lifecycleFilter, clientsMap]);

  const conversionRate = React.useMemo(() => {
    const totalLeads = clients.filter(c => c.lifecycle_stage === 'Lead').length;
    const activeClients = clients.filter(c => c.lifecycle_stage === 'Ativo').length;
    return totalLeads > 0 ? ((activeClients / totalLeads) * 100).toFixed(1) : '0';
  }, [clients]);

  const followUpFrequency = React.useMemo(() => {
    const totalFollowUps = projects.reduce((sum, p) => sum + ((p.follow_ups?.length) || 0), 0);
    const totalProjects = projects.length || 1;
    return (totalFollowUps / totalProjects).toFixed(1);
  }, [projects]);

  const financialMetrics = React.useMemo(() => {
    const totalEstimated = projects.reduce((sum, p) => sum + (Number((p as any).estimated_value) || 0), 0);
    const confirmedValue = projects.filter(p => (p as any).pipeline_status === 'Confirmado').reduce((sum, p) => sum + (Number((p as any).estimated_value) || 0), 0);
    return { totalEstimated, confirmedValue };
  }, [projects]);

  const serviceStats = React.useMemo(() => {
    const map: Record<string, number> = {};
    projects.forEach(p => {
      ((p as any).service_ids || []).forEach((sId: string) => {
        map[sId] = (map[sId] || 0) + 1;
      });
    });
    return Object.entries(map).map(([id, value]) => ({ id, name: services.find(s => s.id === id)?.name || id, value }));
  }, [projects, services]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Relatórios CRM</h1>
        <p className="text-muted-foreground">Métricas e filtros comerciais.</p>
      </div>

      <ReportsFilters
        dateRange={dateRange}
        onDateChange={setDateRange}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        sectorFilter={sectorFilter}
        onSectorChange={setSectorFilter}
        personaFilter={personaFilter}
        onPersonaChange={setPersonaFilter}
        lifecycleFilter={lifecycleFilter}
        onLifecycleChange={setLifecycleFilter}
        onClear={() => { setDateRange(undefined); setStatusFilter("all"); setSectorFilter("all"); setPersonaFilter("all"); setLifecycleFilter("all"); }}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle>Conversão</CardTitle></CardHeader><CardContent>{conversionRate}%</CardContent></Card>
        <Card><CardHeader><CardTitle>Follow-ups (media)</CardTitle></CardHeader><CardContent>{followUpFrequency}</CardContent></Card>
        <Card><CardHeader><CardTitle>Receita Confirmada</CardTitle></CardHeader><CardContent>AOA {financialMetrics.confirmedValue.toLocaleString('pt-AO')}</CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Serviços mais solicitados</CardTitle>
          <CardDescription>Contagem de projetos por serviço</CardDescription>
        </CardHeader>
        <CardContent>
          {serviceStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={serviceStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-muted-foreground p-6 text-center">Nenhum dado disponível</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribuição do Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: "1º Contato", value: projects.filter(p => (p as any).pipeline_status === "1º Contato").length },
                  { name: "Orçamento", value: projects.filter(p => (p as any).pipeline_status === "Orçamento").length },
                  { name: "Negociação", value: projects.filter(p => (p as any).pipeline_status === "Negociação").length },
                  { name: "Confirmado", value: projects.filter(p => (p as any).pipeline_status === "Confirmado").length },
                  { name: "Cancelado", value: projects.filter(p => (p as any).pipeline_status === "Cancelado").length },
                ]}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {[0,1,2,3,4].map((i) => <Cell key={i} fill={["#0088FE","#00C49F","#FFBB28","#FF8042","#8884D8"][i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}