"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { TrendingUp, Users, Calendar, DollarSign, Target, BarChart3, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEvents } from "@/hooks/useEvents";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { showSuccess, showError } from "@/utils/toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const CRMDashboard = () => {
  const { events } = useEvents();
  const { clients } = useClients();
  const { services } = useServices();

  // Projects are events with pipeline_status
  const projects = React.useMemo(() => events.filter(event => !!event.pipeline_status), [events]);

  const pipelineStats = React.useMemo(() => {
    const stats: Record<string, number> = {
      '1º Contato': 0,
      'Orçamento': 0,
      'Negociação': 0,
      'Confirmado': 0
    };
    projects.forEach(p => {
      if (p.pipeline_status && stats[p.pipeline_status] !== undefined) {
        stats[p.pipeline_status] += 1;
      }
    });
    return stats;
  }, [projects]);

  const financialMetrics = React.useMemo(() => {
    const totalEstimated = projects.reduce((sum, p) => sum + (p.estimated_value || 0), 0);
    const confirmedValue = projects.filter(p => p.pipeline_status === 'Confirmado').reduce((sum, p) => sum + (p.estimated_value || 0), 0);
    return { totalEstimated, confirmedValue };
  }, [projects]);

  const recentProjects = React.useMemo(() => {
    return projects
      .slice()
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .slice(0, 5);
  }, [projects]);

  const pipelineData = React.useMemo(() => {
    return Object.entries(pipelineStats).map(([name, value]) => ({
      name,
      value,
      percentage: projects.length > 0 ? ((value / projects.length) * 100).toFixed(1) : '0'
    }));
  }, [pipelineStats, projects.length]);

  const avgConversionDays = React.useMemo(() => {
    const confirmed = projects.filter(p => p.pipeline_status === 'Confirmado' && p.startDate && p.endDate);
    if (confirmed.length === 0) return 0;
    const totalDays = confirmed.reduce((sum, p) => {
      try {
        return sum + differenceInDays(new Date(p.endDate), new Date(p.startDate));
      } catch {
        return sum;
      }
    }, 0);
    return totalDays / confirmed.length;
  }, [projects]);

  const followUpRate = React.useMemo(() => {
    const total = projects.reduce((sum, p) => sum + (p.follow_ups_count || 0), 0);
    const completed = projects.reduce((sum, p) => sum + (p.follow_ups_completed || 0), 0);
    return total > 0 ? (completed / total * 100).toFixed(1) : '0';
  }, [projects]);

  const overdueProjects = React.useMemo(() => {
    return projects.filter(p => p.pipeline_status === 'Negociação' && differenceInDays(new Date(), new Date(p.updated_at || p.startDate)) > 7);
  }, [projects]);

  const clientStats = React.useMemo(() => {
    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.updated_at && new Date(c.updated_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;
    const highValueClients = clients.filter(c => c.notes?.toLowerCase().includes('alto valor')).length;
    return { totalClients, activeClients, highValueClients };
  }, [clients]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case '1º Contato': return 'bg-gray-100 text-gray-800';
      case 'Orçamento': return 'bg-blue-100 text-blue-800';
      case 'Negociação': return 'bg-yellow-100 text-yellow-800';
      case 'Confirmado': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard CRM</h1>
          <p className="text-muted-foreground">Visão geral do pipeline comercial.</p>
        </div>
        <Badge variant="outline">Comercial</Badge>
      </div>

      {overdueProjects.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Alertas de Follow-up
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-destructive">
              {overdueProjects.length} projeto(s) em negociação sem movimento há mais de 7 dias.
            </div>
            <div className="mt-2">
              <Button variant="outline">Notificar Equipa</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">Clientes cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm">Projetos no Pipeline</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">Projetos ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm">Valor Estimado Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AOA {financialMetrics.totalEstimated.toLocaleString("pt-AO")}</div>
            <p className="text-xs text-muted-foreground">Soma estimada</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm">Valor Confirmado</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AOA {financialMetrics.confirmedValue.toLocaleString("pt-AO")}</div>
            <p className="text-xs text-muted-foreground">Projetos confirmados</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm">Tempo Médio de Conversão</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgConversionDays.toFixed(1)} dias</div>
            <p className="text-xs text-muted-foreground">Média de 1º contato → fecho</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm">% Follow-ups Realizados</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{followUpRate}%</div>
            <p className="text-xs text-muted-foreground">Taxa de acompanhamento</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Distribuição do Pipeline</CardTitle>
          <CardDescription>Status dos projetos por estágio</CardDescription>
        </CardHeader>
        <CardContent>
          {pipelineData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pipelineData} dataKey="value" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ name, percentage }) => `${name} ${percentage}%`}>
                  {pipelineData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: number) => [`${val} projetos`, "Quantidade"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p>Nenhum projeto no pipeline.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Projetos Recentes</CardTitle>
          <CardDescription>Últimos projetos adicionados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentProjects.length > 0 ? recentProjects.map(proj => (
              <div key={proj.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{proj.name}</p>
                  <p className="text-xs text-muted-foreground">{proj.pipeline_status}</p>
                </div>
                <div className="text-right">
                  {proj.estimated_value ? <div className="font-medium">AOA {proj.estimated_value.toLocaleString("pt-AO")}</div> : <div>-</div>}
                  <div className="text-xs text-muted-foreground">{proj.startDate ? format(new Date(proj.startDate), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p>Nenhum projeto recente.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Administre sua base de clientes.</p>
            <Button asChild variant="outline"><Link to="/crm/clients">Ver Clientes</Link></Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Visão geral do pipeline.</p>
            <Button asChild variant="outline"><Link to="/crm/projects">Ver Projetos</Link></Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Relatórios</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Exportar relatórios e análises.</p>
            <Button asChild variant="outline"><Link to="/crm/reports">Ver Relatórios</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CRMDashboard;