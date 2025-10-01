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
  const projects = React.useMemo(() => (events || []).filter(event => !!event.pipeline_status), [events]); // Safely access events

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

  // MÉTRICAS AVANÇADAS

  // Tempo médio de conversão (dias entre 1º Contato e Confirmado)
  const avgConversionDays = React.useMemo(() => {
    // Para cada projeto confirmado, buscar o projeto correspondente com status 1º Contato e calcular diferença
    // Como não temos histórico de status, vamos aproximar pela diferença entre startDate e hoje para Confirmado
    // Melhor seria histórico, mas vamos usar diferença entre startDate e hoje para projetos Confirmados
    const confirmed = projects.filter(p => p.pipeline_status === 'Confirmado' && p.startDate);
    if (confirmed.length === 0) return 0;
    const totalDays = confirmed.reduce((sum, p) => {
      try {
        return sum + differenceInDays(new Date(p.startDate), new Date());
      } catch {
        return sum;
      }
    }, 0);
    return Math.abs(totalDays / confirmed.length);
  }, [projects]);

  // Taxa de follow-up (percentual de follow-ups completados)
  const followUpRate = React.useMemo(() => {
    const totalFollowUps = projects.reduce((sum, p) => sum + (p.follow_ups_count || 0), 0);
    const completedFollowUps = projects.reduce((sum, p) => sum + (p.follow_ups_completed || 0), 0);
    return totalFollowUps > 0 ? ((completedFollowUps / totalFollowUps) * 100).toFixed(1) : '0';
  }, [projects]);

  // Projetos estagnados (em negociação há mais de 7 dias)
  const overdueProjects = React.useMemo(() => {
    return projects.filter(p => {
      if (p.pipeline_status !== 'Negociação') return false;
      if (!p.updated_at) return false;
      try {
        return differenceInDays(new Date(), new Date(p.updated_at)) > 7;
      } catch {
        return false;
      }
    });
  }, [projects]);

  const clientStats = React.useMemo(() => {
    const totalClients = (clients || []).length; // Safely access clients
    const activeClients = (clients || []).filter(c => c.updated_at && new Date(c.updated_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;
    const highValueClients = (clients || []).filter(c => c.notes?.toLowerCase().includes('alto valor')).length;
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
            <CardTitle className="text-sm">Tempo Médio de Conversão</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgConversionDays.toFixed(1)} dias</div>
            <p className="text-xs text-muted-foreground">Média de 1º contato → confirmação</p>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm">Valor Estimado Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AOA {financialMetrics.totalEstimated.toLocaleString("pt-AO")}</div>
            <p className="text-xs text-muted-foreground">Soma de todos os projetos</p>
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

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm">Projetos Estagnados</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueProjects.length}</div>
            <p className="text-xs text-destructive">Projetos em negociação sem atualização há mais de 7 dias</p>
          </CardContent>
        </Card>

        <div />
      </div>

      {overdueProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Projetos Estagnados</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-sm text-destructive">
              {overdueProjects.map(p => (
                <li key={p.id}>
                  {p.name} - Última atualização: {p.updated_at ? format(new Date(p.updated_at), "dd/MM/yyyy", { locale: ptBR }) : "N/A"}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Projetos Recentes</CardTitle>
            <CardDescription>Últimos projetos adicionados ao pipeline.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-sm">
              {recentProjects.length > 0 ? recentProjects.map(p => (
                <li key={p.id}>
                  {p.name} - {p.pipeline_status} - {format(new Date(p.startDate), "dd/MM/yyyy", { locale: ptBR })}
                </li>
              )) : (
                <li>Nenhum projeto recente.</li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clientes</CardTitle>
            <CardDescription>Estatísticas básicas dos clientes.</CardDescription>
          </CardHeader>
          <CardContent>
            <div>Total: {clientStats.totalClients}</div>
            <div>Ativos (30d): {clientStats.activeClients}</div>
            <div>Alto Valor: {clientStats.highValueClients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Serviços</CardTitle>
            <CardDescription>Serviços cadastrados no sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-sm">
              {(services || []).length > 0 ? (services || []).map(s => ( // Safely access services
                <li key={s.id}>{s.name}</li>
              )) : (
                <li>Nenhum serviço cadastrado.</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CRMDashboard;