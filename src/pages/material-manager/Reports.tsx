import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Download, Calendar, TrendingUp, Archive, ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { showError } from "@/utils/toast";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const MaterialManagerReports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [reportType, setReportType] = React.useState("inventory-turnover");
  const [timeRange, setTimeRange] = React.useState("last-30-days");
  
  // Mock data for reports
  const inventoryTurnoverData = [
    { month: 'Jan', turnover: 2.4 },
    { month: 'Fev', turnover: 1.9 },
    { month: 'Mar', turnover: 3.1 },
    { month: 'Abr', turnover: 2.8 },
    { month: 'Mai', turnover: 3.5 },
    { month: 'Jun', turnover: 2.2 },
  ];
  
  const materialCostData = [
    { category: 'Câmeras', cost: 45000 },
    { category: 'Lentes', cost: 28000 },
    { category: 'Iluminação', cost: 32000 },
    { category: 'Áudio', cost: 18000 },
    { category: 'Acessórios', cost: 12000 },
  ];
  
  const requestFulfillmentData = [
    { week: 'Sem 1', approved: 15, rejected: 3, pending: 2 },
    { week: 'Sem 2', approved: 18, rejected: 2, pending: 4 },
    { week: 'Sem 3', approved: 12, rejected: 1, pending: 3 },
    { week: 'Sem 4', approved: 20, rejected: 0, pending: 1 },
  ];
  
  const usagePatternData = [
    { day: 'Seg', usage: 65 },
    { day: 'Ter', usage: 59 },
    { day: 'Qua', usage: 80 },
    { day: 'Qui', usage: 81 },
    { day: 'Sex', usage: 56 },
    { day: 'Sáb', usage: 55 },
    { day: 'Dom', usage: 40 },
  ];

  // In a real implementation, you would fetch report data from Supabase
  React.useEffect(() => {
    const fetchReportData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error("Error fetching report data:", error);
        showError("Erro ao carregar dados do relatório.");
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [user, reportType, timeRange]);

  const exportReport = () => {
    // In a real implementation, this would generate and download a report
    alert("Relatório exportado com sucesso! (Funcionalidade simulada)");
  };

  const renderReport = () => {
    switch (reportType) {
      case "inventory-turnover":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Índice de Rotatividade de Inventário</CardTitle>
              <CardDescription>
                Número de vezes que o estoque é renovado em um período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={inventoryTurnoverData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}x`, 'Rotatividade']} />
                  <Legend />
                  <Bar dataKey="turnover" name="Rotatividade" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );
      
      case "material-cost":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Análise de Custo por Categoria</CardTitle>
              <CardDescription>
                Distribuição de custos por categoria de material
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={materialCostData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="cost"
                    nameKey="category"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {materialCostData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Custo']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );
      
      case "request-fulfillment":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Taxa de Atendimento de Requisições</CardTitle>
              <CardDescription>
                Aprovações, rejeições e pendências por semana
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={requestFulfillmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="approved" name="Aprovadas" stroke="#00C49F" strokeWidth={2} />
                  <Line type="monotone" dataKey="rejected" name="Rejeitadas" stroke="#FF8042" strokeWidth={2} />
                  <Line type="monotone" dataKey="pending" name="Pendentes" stroke="#FFBB28" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );
      
      case "usage-pattern":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Padrões de Uso de Materiais</CardTitle>
              <CardDescription>
                Frequência de uso por dia da semana
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={usagePatternData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, 'Uso']} />
                  <Legend />
                  <Bar dataKey="usage" name="Uso (%)" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Carregando relatório...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Relatórios de Materiais</h1>
          <p className="text-sm text-muted-foreground">
            Analise o desempenho e uso dos materiais.
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-7-days">Últimos 7 dias</SelectItem>
              <SelectItem value="last-30-days">Últimos 30 dias</SelectItem>
              <SelectItem value="last-90-days">Últimos 90 dias</SelectItem>
              <SelectItem value="year-to-date">Ano até hoje</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecione um Relatório</CardTitle>
          <CardDescription>
            Escolha o tipo de relatório que deseja visualizar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant={reportType === "inventory-turnover" ? "default" : "outline"}
              className="h-auto p-4 flex flex-col items-center justify-center"
              onClick={() => setReportType("inventory-turnover")}
            >
              <TrendingUp className="h-8 w-8 mb-2" />
              <span>Rotatividade de Estoque</span>
            </Button>
            <Button
              variant={reportType === "material-cost" ? "default" : "outline"}
              className="h-auto p-4 flex flex-col items-center justify-center"
              onClick={() => setReportType("material-cost")}
            >
              <Archive className="h-8 w-8 mb-2" />
              <span>Custo por Categoria</span>
            </Button>
            <Button
              variant={reportType === "request-fulfillment" ? "default" : "outline"}
              className="h-auto p-4 flex flex-col items-center justify-center"
              onClick={() => setReportType("request-fulfillment")}
            >
              <ClipboardList className="h-8 w-8 mb-2" />
              <span>Atendimento de Requisições</span>
            </Button>
            <Button
              variant={reportType === "usage-pattern" ? "default" : "outline"}
              className="h-auto p-4 flex flex-col items-center justify-center"
              onClick={() => setReportType("usage-pattern")}
            >
              <Calendar className="h-8 w-8 mb-2" />
              <span>Padrões de Uso</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {renderReport()}
    </div>
  );
};

export default MaterialManagerReports;