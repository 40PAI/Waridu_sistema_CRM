import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Archive, CheckCircle, Calendar, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// --- Mock Data ---
const materialsData = [
    { id: 'MAT001', name: 'Câmera Sony A7S III', quantity: 5, status: 'Disponível', category: 'Câmeras' },
    { id: 'MAT002', name: 'Lente Canon 24-70mm', quantity: 8, status: 'Em uso', category: 'Lentes' },
    { id: 'MAT003', name: 'Kit de Luz Aputure 300D', quantity: 3, status: 'Disponível', category: 'Iluminação' },
    { id: 'MAT004', name: 'Microfone Rode NTG5', quantity: 10, status: 'Manutenção', category: 'Áudio' },
    { id: 'MAT007', name: 'Gravador Zoom H6', quantity: 4, status: 'Em uso', category: 'Áudio' },
];

const recentEvents = [
    { id: 1, name: "Conferência de Tecnologia", date: "15/08/2024", status: 'Realizado' },
    { id: 2, name: "Workshop de Design", date: "09/08/2024", status: 'Realizado' },
    { id: 3, name: "Lançamento de Produto", date: "28/07/2024", status: 'Realizado' },
    { id: 4, name: "Reunião de Alinhamento", date: "25/07/2024", status: 'Cancelado' },
];

const financeData = [
  { name: 'Mai', Receita: 1890, Despesa: 4800 },
  { name: 'Jun', Receita: 2390, Despesa: 3800 },
  { name: 'Jul', Receita: 3490, Despesa: 4300 },
  { name: 'Ago', Receita: 5100, Despesa: 2300 },
];

// --- Helper Functions ---
const getMaterialStatusVariant = (status: string) => {
    switch (status) {
      case 'Disponível': return 'default';
      case 'Em uso': return 'secondary';
      case 'Manutenção': return 'destructive';
      default: return 'outline';
    }
};

const getEventStatusVariant = (status: string) => {
    switch (status) {
      case 'Realizado': return 'default';
      case 'Cancelado': return 'destructive';
      default: return 'secondary';
    }
};

// --- Sub-components ---
const MaterialStatusList = () => {
    const activeMaterials = materialsData.filter(m => m.status !== 'Disponível');
    return (
        <div className="space-y-4">
            {activeMaterials.length > 0 ? activeMaterials.map((item) => (
                <div className="flex items-center" key={item.id}>
                    <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.category}</p>
                    </div>
                    <div className="ml-auto font-medium">
                        <Badge variant={getMaterialStatusVariant(item.status)}>{item.status}</Badge>
                    </div>
                </div>
            )) : (
                <p className="text-sm text-muted-foreground text-center">Todos os materiais estão disponíveis.</p>
            )}
        </div>
    );
};

// --- Main Dashboard Component ---
const Dashboard = () => {
  const totalItems = materialsData.reduce((sum, item) => sum + item.quantity, 0);
  const availableItems = materialsData.filter(m => m.status === 'Disponível').reduce((sum, item) => sum + item.quantity, 0);
  const totalRevenue = financeData.reduce((sum, item) => sum + item.Receita, 0);
  const totalEventsThisMonth = 2; // Mocked for current month

  const categoryData = materialsData.reduce((acc, item) => {
    const category = acc.find(c => c.name === item.category);
    if (category) {
      category.quantidade += item.quantity;
    } else {
      acc.push({ name: item.category, quantidade: item.quantity });
    }
    return acc;
  }, [] as { name: string; quantidade: number }[]);

  return (
    <div className="flex-1 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">Itens totais no inventário</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponíveis</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableItems}</div>
            <p className="text-xs text-muted-foreground">Itens prontos para uso</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos no Mês</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalEventsThisMonth}</div>
            <p className="text-xs text-muted-foreground">Eventos realizados este mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AOA {totalRevenue.toLocaleString('pt-AO')}</div>
            <p className="text-xs text-muted-foreground">Nos últimos 4 meses</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Resumo Financeiro</CardTitle>
            <CardDescription>Receitas e despesas dos últimos meses.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={financeData}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                <Tooltip />
                <Legend />
                <Bar dataKey="Receita" fill="#8884d8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesa" fill="#82ca9d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Inventário por Categoria</CardTitle>
            <CardDescription>Distribuição de itens nas categorias.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                <Tooltip />
                <Bar dataKey="quantidade" fill="#adfa1d" name="Quantidade" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Eventos Recentes</CardTitle>
            <CardDescription>Últimos eventos gerenciados pela equipe.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell>{event.date}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={getEventStatusVariant(event.status)}>{event.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Status dos Materiais</CardTitle>
            <CardDescription>Materiais em uso ou manutenção.</CardDescription>
          </CardHeader>
          <CardContent>
            <MaterialStatusList />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;