import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMaterials } from "@/hooks/useMaterials";
import { useMaterialRequests } from "@/hooks/useMaterialRequests";
import { useLocations } from "@/hooks/useLocations";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

const MaterialManagerDashboard = () => {
  const { materials, loading: materialsLoading } = useMaterials();
  const { materialRequests, pendingRequests } = useMaterialRequests();
  const { locations } = useLocations();

  const locationMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    locations.forEach(loc => {
      map[loc.id] = loc.name;
    });
    return map;
  }, [locations]);

  const stats = React.useMemo(() => {
    const totalMaterials = materials.length;
    const disponivel = materials.filter(m => m.status === 'Disponível').length;
    const emUso = materials.filter(m => m.status === 'Em uso').length;
    const manutencao = materials.filter(m => m.status === 'Manutenção').length;
    
    const totalQuantity = materials.reduce((sum, mat) => {
      const locQty = mat.locations 
        ? Object.values(mat.locations).reduce((s, q) => s + q, 0)
        : 0;
      return sum + locQty;
    }, 0);

    const lowStockMaterials = materials.filter(mat => {
      const qty = mat.locations 
        ? Object.values(mat.locations).reduce((s, q) => s + q, 0)
        : 0;
      return qty > 0 && qty < 10;
    });

    return {
      totalMaterials,
      disponivel,
      emUso,
      manutencao,
      totalQuantity,
      lowStockCount: lowStockMaterials.length,
      pendingRequests: pendingRequests.length
    };
  }, [materials, pendingRequests]);

  const statusData = React.useMemo(() => [
    { name: 'Disponível', value: stats.disponivel, color: COLORS[0] },
    { name: 'Em uso', value: stats.emUso, color: COLORS[1] },
    { name: 'Manutenção', value: stats.manutencao, color: COLORS[2] }
  ].filter(item => item.value > 0), [stats]);

  const lowStockMaterials = React.useMemo(() => {
    return materials
      .map(mat => {
        const qty = mat.locations 
          ? Object.values(mat.locations).reduce((s, q) => s + q, 0)
          : 0;
        return { ...mat, totalQty: qty };
      })
      .filter(mat => mat.totalQty > 0 && mat.totalQty < 10)
      .sort((a, b) => a.totalQty - b.totalQty)
      .slice(0, 5);
  }, [materials]);

  const criticalMaterials = React.useMemo(() => {
    return materials
      .filter(mat => mat.status === 'Manutenção' || mat.status === 'Em uso')
      .slice(0, 5);
  }, [materials]);

  const recentRequests = React.useMemo(() => {
    return materialRequests
      .filter(req => req.status === 'Pendente')
      .slice(0, 5);
  }, [materialRequests]);

  if (materialsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard de Gestão de Materiais</h1>
        <p className="text-muted-foreground">
          Visão geral do inventário e requisições
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Materiais</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMaterials}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalQuantity} unidades no estoque
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requisições Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando aprovação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.lowStockCount}</div>
            <p className="text-xs text-muted-foreground">
              Materiais abaixo de 10 unidades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Materiais Disponíveis</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.disponivel}</div>
            <p className="text-xs text-muted-foreground">
              Prontos para uso
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status dos Materiais</CardTitle>
            <CardDescription>Distribuição por estado</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum material cadastrado</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Materiais Críticos</CardTitle>
            <CardDescription>Em uso ou manutenção</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {criticalMaterials.length > 0 ? (
                criticalMaterials.map((material) => (
                  <div key={material.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{material.name}</p>
                      <p className="text-xs text-muted-foreground">{material.category}</p>
                    </div>
                    <Badge variant={material.status === 'Manutenção' ? 'destructive' : 'secondary'}>
                      {material.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum material crítico no momento
                </p>
              )}
              {criticalMaterials.length > 0 && (
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/materials">Ver Todos os Materiais</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Alertas de Estoque Baixo</CardTitle>
            <CardDescription>Materiais com menos de 10 unidades</CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockMaterials.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockMaterials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">{material.name}</TableCell>
                      <TableCell>{material.category || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          {material.totalQty}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Todos os materiais têm estoque adequado
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Requisições Pendentes</CardTitle>
            <CardDescription>Aguardando sua aprovação</CardDescription>
          </CardHeader>
          <CardContent>
            {recentRequests.length > 0 ? (
              <div className="space-y-4">
                {recentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{request.requestedBy.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(request.createdAt), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <Badge variant="secondary">{request.items.length} itens</Badge>
                  </div>
                ))}
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/material-requests">Ver Todas as Requisições</Link>
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma requisição pendente
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MaterialManagerDashboard;
