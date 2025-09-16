"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { TrendingUp, Users, Calendar, DollarSign, Target, BarChart3, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEvents } from "@/hooks/useEvents";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Download, FileDown } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Link } from "react-router-dom";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const CRMDashboard = () => {
  const { events } = useEvents();
  const { clients } = useClients();
  const { services } = useServices();

  // Filter projects (events with pipeline_status)
  const projects = React.useMemo(() => {
    return events.filter(event => event.pipeline_status);
  }, [events]);

  // Pipeline metrics
  const pipelineStats = React.useMemo(() => {
    const stats = {
      '1º Contato': 0,
      'Orçamento': 0,
      'Negociação': 0,
      'Confirmado': 0
    };

    projects.forEach(project => {
      if (project.pipeline_status && stats[project.pipeline_status as keyof typeof stats] !== undefined) {
        stats[project.pipeline_status as keyof typeof stats]++;
      }
    });

    return stats;
  }, [projects]);

  // Financial metrics
  const financialMetrics = React.useMemo(() => {
    const totalEstimated = projects.reduce((sum, p) => sum + (p.estimated_value || 0), 0);
    const confirmedValue = projects
      .filter(p => p.pipeline_status === 'Confirmado')
      .reduce((sum, p) => sum + (p.estimated_value || 0), 0);

    return { totalEstimated, confirmedValue };
  }, [projects]);

  // Recent projects
  const recentProjects = React.useMemo(() => {
    return projects
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .slice(0, 5);
  }, [projects]);

  // Pipeline conversion data for chart
  const pipelineData = React.useMemo(() => {
    return Object.entries(pipelineStats).map(([name, value]) => ({
      name,
      value,
      percentage: projects.length > 0 ? ((value / projects.length) * 100).toFixed(1) : '0'
    }));
  }, [pipelineStats, projects.length]);

  // Add new metrics
  const avgConversionDays = React.useMemo(() => {
    const confirmed = projects.filter(p => p.pipeline_status === 'Confirmado');
    if (confirmed.length === 0) return 0;
    return confirmed.reduce((sum, p) => sum + differenceInDays(new Date(p.endDate), new Date(p.startDate)), 0) / confirmed.length;
  }, [projects]);

  const followUpRate = React.useMemo(() => {
    const total = projects.reduce((sum, p) => sum + (p.follow_ups_count || 0), 0);
    const completed = projects.reduce((sum, p) => sum + (p.follow_ups_completed || 0), 0);
    return total > 0 ? (completed / total * 100).toFixed(1) : 0;
  }, [projects]);

  // Overdue projects alert
  const overdueProjects = React.useMemo(() => {
    return projects.filter(p => p.pipeline_status === 'Negociação' && 
      differenceInDays(new Date(), new Date(p.updated_at || p.startDate)) > 7
    );
  }, [projects]);

  const clientStats = React.useMemo(() => {
    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.updated_at && new Date(c.updated_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;
    const highValueClients = clients.filter(c => c.notes?.includes('alto valor') || false).length;
    return { totalClients, activeClients, highValueClients };
  }, [clients]);

  const getStatusColor = (status: string) => {
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
          <p className="text-muted-foreground">Visão geral do seu pipeline comercial.</p>
        </div>
        <Badge variant="outline">Comercial</Badge>
      </div>

      {/* Alerts */}
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
              {overdueProjects.length} projetos em negociação precisam de follow-up (7+ dias sem movimento)
            </div>
            <Button variant="outline" className="mt-2">
              Notificar Equipa
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">Clientes ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projetos no Pipeline</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">Em diferentes estágios</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Estimado Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AOA {financialMetrics.totalEstimated.toLocaleString("pt-AO")}</div>
            <p className="text-xs text-muted-foreground">Soma de todos os projetos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Confirmado</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AOA {financialMetrics.confirmedValue.toLocaleString("pt-AO")}</div>
            <p className="text-xs text-muted-foreground">Projetos confirmados</p>
          </CardContent>
        </Card>
      </div>

      {/* New Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio de Conversão</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgConversionDays.toFixed(1)} dias</div>
            <p className="text-xs text-muted-foreground">De 1º contato a fecho</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">% Follow-ups Realizados</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{followUpRate}%</div>
            <p className="text-xs text-muted-foreground">Taxa de acompanhamento</p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição do Pipeline</CardTitle>
          <CardDescription>Status atual dos projetos no pipeline.</CardDescription>
        </CardHeader>
        <CardContent>
          {pipelineData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pipelineData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value} projetos`, "Quantidade"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p>Nenhum projeto no pipeline ainda.</p>
                <p className="text-sm mt-2">Comece criando seu primeiro projeto!</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Projetos Recentes</CardTitle>
          <CardDescription>Últimos projetos adicionados ao pipeline.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentProjects.length > 0 ? recentProjects.map((project) => (
              <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">{project.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(project.startDate), 'dd/MM/yyyy', { locale: ptBR })}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className={getStatusColor(project.pipeline_status || '1º Contato')}>
                    {project.pipeline_status || '1º Contato'}
                  </Badge>
                  {project.estimated_value && (
                    <div className="text-right">
                      <p className="font-medium">AOA {project.estimated_value.toLocaleString('pt-AO')}</p>
                    </div>
                  )}
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

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gerenciar Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Adicione e organize seus clientes.</p>
            <Button asChild variant="outline">
              <Link to="/crm/clients">Ver Clientes</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Pipeline de Projetos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Acompanhe o progresso dos projetos.</p>
            <Button asChild variant="outline">
              <Link to="/crm/projects">Ver Projetos</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Relatórios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Análises detalhadas do pipeline.</p>
            <Button asChild variant="outline">
              <Link to="/crm/reports">Ver Relatórios</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CRMDashboard;