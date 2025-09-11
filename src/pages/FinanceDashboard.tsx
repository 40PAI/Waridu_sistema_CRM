import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, Wallet, Briefcase } from "lucide-react";
import CategoryManager from "@/components/settings/CategoryManager";
import { useTechnicianCategories } from "@/hooks/useTechnicianCategories";
import { useEmployees } from "@/hooks/useEmployees";
import { useMemo } from "react";

// --- Mock Data ---

// Desempenho mensal
const monthlyPerformanceData = [
  { month: 'Mai', receita: 4500000, custos: 2900000, lucro: 1600000 },
  { month: 'Jun', receita: 6200000, custos: 3800000, lucro: 2400000 },
  { month: 'Jul', receita: 5100000, custos: 3100000, lucro: 2000000 },
  { month: 'Ago', receita: 7800000, custos: 4500000, lucro: 3300000 },
];

// Análise de custos
const costBreakdownData = [
  { name: 'Pessoal', value: 450000 },
  { name: 'Aluguel de Equip.', value: 250000 },
  { name: 'Transporte', value: 120000 },
  { name: 'Marketing', value: 80000 },
  { name: 'Outros', value: 50000 },
];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

// Rentabilidade por evento
const eventProfitabilityData = [
  { id: 1, name: 'Conferência de Tecnologia', date: '15/08/2024', revenue: 1200000, cost: 750000, status: 'Realizado' },
  { id: 2, name: 'Lançamento de Produto X', date: '01/09/2024', revenue: 800000, cost: 400000, status: 'Próximo' },
  { id: 3, name: 'Casamento Silva & Costa', date: '25/08/2024', revenue: 1500000, cost: 950000, status: 'Realizado' },
  { id: 4, name: 'Workshop de Marketing', date: '10/09/2024', revenue: 500000, cost: 250000, status: 'Próximo' },
  { id: 5, name: 'Festa Corporativa Acme', date: '20/07/2024', revenue: 900000, cost: 600000, status: 'Realizado' },
];

// --- Helper Functions ---
const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA', minimumFractionDigits: 2 });
};

const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Realizado': return 'default';
      case 'Próximo': return 'secondary';
      default: return 'outline';
    }
};

// --- Main Component ---
const FinanceDashboard = () => {
  const currentMonthData = monthlyPerformanceData[monthlyPerformanceData.length - 1];
  const totalRevenue = monthlyPerformanceData.reduce((sum, item) => sum + item.receita, 0);
  const totalCosts = monthlyPerformanceData.reduce((sum, item) => sum + item.custos, 0);
  const averageMargin = totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0;

  // Usando os hooks para obter as categorias e funcionários
  const { categories, loading: categoriesLoading } = useTechnicianCategories();
  const { employees, loading: employeesLoading } = useEmployees();

  // Calcular custos totais com técnicos
  const technicianCosts = useMemo(() => {
    if (categoriesLoading || employeesLoading) return 0;
    
    // Criar um mapa de categorias para fácil acesso
    const categoryMap = categories.reduce((acc, category) => {
      acc[category.id] = category;
      return acc;
    }, {} as Record<string, { id: string; categoryName: string; dailyRate: number }>);

    // Calcular custo total (simplificado - considerando que todos os técnicos estão ativos)
    return employees.reduce((total, employee) => {
      if (employee.technicianCategoryId && categoryMap[employee.technicianCategoryId]) {
        // Para simplificação, considerando 20 dias úteis por mês
        return total + (categoryMap[employee.technicianCategoryId].dailyRate * 20);
      }
      return total;
    }, 0);
  }, [categories, employees, categoriesLoading, employeesLoading]);

  return (
    <div className="flex-1 space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita (Mês Atual)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentMonthData.receita)}</div>
            <p className="text-xs text-muted-foreground">Faturamento dos eventos no mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custos (Mês Atual)</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentMonthData.custos)}</div>
            <p className="text-xs text-muted-foreground">Despesas operacionais do mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido (Mês Atual)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentMonthData.lucro)}</div>
            <p className="text-xs text-muted-foreground">Resultado final do mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem Média</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageMargin.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">Margem de lucro média</p>
          </CardContent>
        </Card>
      </div>

      {/* Gerenciamento de Categorias de Técnicos */}
      <CategoryManager />

      {/* Custo com Técnicos */}
      <Card>
        <CardHeader>
          <CardTitle>Custo com Técnicos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(technicianCosts)}</div>
          <p className="text-xs text-muted-foreground">Custo mensal estimado com técnicos</p>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Desempenho Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(value) => `${(value as number / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Bar dataKey="receita" fill="#8884d8" name="Receita" />
                <Bar dataKey="custos" fill="#82ca9d" name="Custos" />
                <Bar dataKey="lucro" fill="#ffc658" name="Lucro" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Análise de Custos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={costBreakdownData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {costBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Profitability Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rentabilidade por Evento</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Receita</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead>Lucro</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventProfitabilityData.map((event) => {
                const profit = event.revenue - event.cost;
                return (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell>{event.date}</TableCell>
                    <TableCell>{formatCurrency(event.revenue)}</TableCell>
                    <TableCell>{formatCurrency(event.cost)}</TableCell>
                    <TableCell className={profit > 0 ? "text-green-600" : "text-red-600"}>
                      {formatCurrency(profit)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(event.status)}>{event.status}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceDashboard;