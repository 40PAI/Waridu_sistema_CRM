import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MaterialDialog } from "@/components/materials/MaterialDialog";
import { useAuth } from "@/contexts/AuthContext";
import { hasActionPermission } from "@/config/roles";
import { TransferDialog } from "@/components/materials/TransferDialog";
import type { MaterialRequest } from "@/App";

export type MaterialStatus = 'Disponível' | 'Em uso' | 'Manutenção';

export interface Material {
  id: string;
  name: string;
  quantity: number; // total (derivado de locations)
  status: MaterialStatus;
  category: string;
  description: string;
  locations: Record<string, number>; // distribuição por localização
}

interface Location {
  id: string;
  name: string;
}

interface AllocationHistoryEntry {
  id: string;
  date: string;
  eventName: string;
  materials: Record<string, number>; // materialId -> qty
}

interface MaterialsPageProps {
  materials: Material[];
  locations: Location[];
  onSaveMaterial: (materialData: Omit<Material, 'id' | 'locations'> & { id?: string }) => void;
  onTransferMaterial: (materialId: string, fromLocationId: string, toLocationId: string, quantity: number) => void;
  history: AllocationHistoryEntry[];
  pendingRequests: MaterialRequest[];
}

const MaterialsPage = ({ materials, locations, onSaveMaterial, onTransferMaterial, history, pendingRequests }: MaterialsPageProps) => {
  const { user } = useAuth();
  const canWrite = user ? hasActionPermission(user.role, 'materials:write') : false;

  const [statusFilter, setStatusFilter] = React.useState('all');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingMaterial, setEditingMaterial] = React.useState<Material | null>(null);

  const handleAddNew = () => {
    setEditingMaterial(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setIsDialogOpen(true);
  };

  const categories = React.useMemo(() => {
    return Array.from(new Set(materials.map(m => m.category)));
  }, [materials]);

  const withTotals: Material[] = React.useMemo(() => {
    return materials.map(m => ({
      ...m,
      quantity: Object.values(m.locations || {}).reduce((a, b) => a + b, 0),
    }));
  }, [materials]);

  const filteredMaterials = React.useMemo(() => {
    return withTotals.filter(material => {
        const statusMatch = statusFilter === 'all' || material.status === statusFilter;
        const categoryMatch = categoryFilter === 'all' || material.category === categoryFilter;
        return statusMatch && categoryMatch;
    });
  }, [statusFilter, categoryFilter, withTotals]);

  const pendingByMaterial = React.useMemo(() => {
    const map: Record<string, number> = {};
    pendingRequests.forEach((req) => {
      req.items.forEach((it) => {
        map[it.materialId] = (map[it.materialId] || 0) + it.quantity;
      });
    });
    return map;
  }, [pendingRequests]);

  return (
    <>
      <Tabs defaultValue="inventory">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Materiais</h2>
            <p className="text-sm text-muted-foreground">Inventário por localização e histórico de alocações.</p>
          </div>
          <TabsList className="hidden sm:flex">
            <TabsTrigger value="inventory">Inventário</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>
        </div>

        <TabsList className="flex sm:hidden mb-4">
          <TabsTrigger className="flex-1" value="inventory">Inventário</TabsTrigger>
          <TabsTrigger className="flex-1" value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Registro de Materiais</CardTitle>
                <CardDescription>Gerencie o inventário de materiais da empresa.</CardDescription>
              </div>
              {canWrite && <Button onClick={handleAddNew}>Adicionar Material</Button>}
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="status-filter">Filtrar por Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status-filter" className="w-[180px]">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="Disponível">Disponível</SelectItem>
                      <SelectItem value="Em uso">Em uso</SelectItem>
                      <SelectItem value="Manutenção">Manutenção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="category-filter">Filtrar por Categoria</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger id="category-filter" className="w-[200px]">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Localizações</TableHead>
                    <TableHead>Pendentes</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaterials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell>{material.id}</TableCell>
                      <TableCell className="font-medium">{material.name}</TableCell>
                      <TableCell>{material.category}</TableCell>
                      <TableCell>{material.quantity}</TableCell>
                      <TableCell>
                        <Badge variant={material.status === 'Disponível' ? 'default' : material.status === 'Em uso' ? 'secondary' : 'destructive'}>
                          {material.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {locations.map(loc => {
                            const q = material.locations[loc.id] || 0;
                            return (
                              <div key={loc.id} className="text-xs px-2 py-1 border rounded">
                                {loc.name}: <span className="font-medium">{q}</span>
                              </div>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{pendingByMaterial[material.id] || 0}</span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {canWrite && (
                          <>
                            <TransferDialog
                              materialName={material.name}
                              materialId={material.id}
                              locations={locations}
                              distribution={material.locations}
                              onTransfer={onTransferMaterial}
                            />
                            <Button variant="outline" size="sm" onClick={() => handleEdit(material)}>Editar</Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Alocações</CardTitle>
              <CardDescription>Registros automáticos ao concluir eventos.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length > 0 ? history.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>{entry.eventName}</TableCell>
                      <TableCell>{Object.values(entry.materials).reduce((a, b) => a + b, 0)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(entry.materials).map(([matId, qty]) => {
                            const m = materials.find(mm => mm.id === matId);
                            return (
                              <div key={matId} className="text-xs px-2 py-1 border rounded">
                                {(m?.name || matId)}: <span className="font-medium">{qty}</span>
                              </div>
                            );
                          })}
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24">
                        Nenhum registro ainda.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <MaterialDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={onSaveMaterial}
        material={editingMaterial}
      />
    </>
  );
};

export default MaterialsPage;