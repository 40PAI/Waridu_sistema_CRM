import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Archive, 
  AlertTriangle, 
  ClipboardList, 
  TrendingUp, 
  Calendar,
  ArrowDown,
  ArrowUp,
  RotateCcw
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const MaterialManagerInventoryDashboard = () => {
  const { user } = useAuth();
  const managerName = user?.profile?.first_name || user?.email || "Gestor de Material";
  
  const [inventoryStats, setInventoryStats] = React.useState({
    totalItems: 0,
    lowStockItems: 0,
    maintenanceItems: 0,
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0
  });
  
  const [categoryData, setCategoryData] = React.useState<any[]>([]);
  const [statusData, setStatusData] = React.useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = React.useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Load data from Supabase
  React.useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Get inventory stats
        const { data: materialsData, error: materialsError } = await supabase
          .from('materials')
          .select('*');

        if (materialsError) throw materialsError;
        
        const totalItems = materialsData?.length || 0;
        const lowStockItems = materialsData?.filter(m => 
          Object.values(m.locations || {}).reduce((sum: number, qty: number) => sum + qty, 0) < 5
        ).length || 0;
        const maintenanceItems = materialsData?.filter(m => m.status === 'Manutenção').length || 0;
        
        // Get request stats
        const { data: requestsData, error: requestsError } = await supabase
          .from('material_requests')
          .select('*');

        if (requestsError) throw requestsError;
        
        const pendingRequests = requestsData?.filter(r => r.status === 'Pendente').length || 0;
        const approvedRequests = requestsData?.filter(r => r.status === 'Aprovada').length || 0;
        const rejectedRequests = requestsData?.filter(r => r.status === 'Rejeitada').length || 0;
        const totalRequests = requestsData?.length || 0;
        
        setInventoryStats({
          totalItems,
          lowStockItems,
          maintenanceItems,
          totalRequests,
          pendingRequests,
          approvedRequests,
          rejectedRequests
        });
        
        // Category distribution data
        const categoryMap: Record<string, number> = {};
        materialsData?.forEach((material: any) => {
          categoryMap[material.category] = (categoryMap[material.category] || 0) + 1;
        });
        
        const categoryChartData = Object.entries(categoryMap).map(([name, value]) => ({
          name,
          value
        }));
        setCategoryData(categoryChartData);
        
        // Status distribution data
        const statusMap: Record<string, number> = {};
        materialsData?.forEach((material: any) => {
          statusMap[material.status] = (statusMap[material.status] || 0) + 1;
        });
        
        const statusChartData = Object.entries(statusMap).map(([name, value]) => ({
          name,
          value
        }));
        setStatusData(statusChartData);
        
        // Low stock items
        const lowStock = materialsData?.filter(m => 
          Object.values(m.locations || {}).reduce((sum: number, qty: number) => sum + qty, 0) < 5
        ).slice(0, 5) || [];
        setLowStockItems(lowStock);
        
        // Upcoming events (next 7 days)
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .gte('start_date', new Date().toISOString().split('T')[0])
          .lte('start_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .order('start_date', { ascending: true })
          .limit(5);

        if (eventsError) throw eventsError;
        
        setUpcomingEvents(eventsData || []);
        
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard de Inventário</h1>
        <p className="text-muted-foreground">Visão geral do inventário e requisições de materiais.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryStats.totalItems}</div>
            <p className="text-xs text-muted-foreground">Itens no inventário</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryStats.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">Itens com menos de 5 unidades</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Manutenção</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryStats.maintenanceItems}</div>
            <p className="text-xs text-muted-foreground">Itens em manutenção</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requisições Pendentes</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryStats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">Requisições aguardando aprovação</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts and Tables */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Categoria</CardTitle>
            <CardDescription>Quantidade de itens por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} itens`, 'Quantidade']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Status dos Materiais</CardTitle>
            <CardDescription>Distribuição por status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                <Tooltip formatter={(value) => [`${value} itens`, 'Quantidade']} />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" name="Quantidade" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Low Stock Items and Upcoming Events */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Itens com Estoque Baixo</CardTitle>
            <CardDescription>Itens com menos de 5 unidades disponíveis</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems.length > 0 ? lowStockItems.map((item: any) => {
                  const totalQty = Object.values(item.locations || {}).reduce((sum: number, qty: number) => sum + qty, 0);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{totalQty}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'Disponível' ? 'default' : item.status === 'Em uso' ? 'secondary' : 'destructive'}>
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      Nenhum item com estoque baixo
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Eventos Próximos</CardTitle>
            <CardDescription>Eventos nos próximos 7 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingEvents.length > 0 ? upcomingEvents.map((event: any) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell>{format(new Date(event.start_date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                    <TableCell>
                      <Badge variant={event.status === 'Planejado' ? 'secondary' : event.status === 'Em Andamento' ? 'default' : 'outline'}>
                        {event.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center h-24">
                      Nenhum evento próximo
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      {/* Request Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas de Requisições</CardTitle>
          <CardDescription>Resumo das requisições de materiais</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="p-2 bg-blue-100 rounded-full">
                <ClipboardList className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inventoryStats.totalRequests}</p>
                <p className="text-sm text-muted-foreground">Total de Requisições</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="p-2 bg-yellow-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inventoryStats.pendingRequests}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="p-2 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inventoryStats.approvedRequests}</p>
                <p className="text-sm text-muted-foreground">Aprovadas</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialManagerInventoryDashboard;