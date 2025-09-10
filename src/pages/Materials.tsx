import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MaterialDialog } from "@/components/materials/MaterialDialog";
import { showSuccess } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthContext";
import { hasActionPermission } from "@/config/roles";

export type MaterialStatus = 'Disponível' | 'Em uso' | 'Manutenção';
export interface Material {
  id: string;
  name: string;
  quantity: number;
  status: MaterialStatus;
  category: string;
  description: string;
}

const initialMaterialsData: Material[] = [
    { id: 'MAT001', name: 'Câmera Sony A7S III', quantity: 5, status: 'Disponível', category: 'Câmeras', description: 'Câmera mirrorless full-frame com alta sensibilidade.' },
    { id: 'MAT002', name: 'Lente Canon 24-70mm', quantity: 8, status: 'Em uso', category: 'Lentes', description: 'Lente zoom padrão versátil com abertura f/2.8.' },
    { id: 'MAT003', name: 'Kit de Luz Aputure 300D', quantity: 3, status: 'Disponível', category: 'Iluminação', description: 'Kit de iluminação LED potente com 3 pontos de luz.' },
    { id: 'MAT004', name: 'Microfone Rode NTG5', quantity: 10, status: 'Manutenção', category: 'Áudio', description: 'Microfone shotgun profissional para gravação de áudio direcional.' },
    { id: 'MAT005', name: 'Tripé Manfrotto', quantity: 12, status: 'Disponível', category: 'Acessórios', description: 'Tripé de vídeo robusto com cabeça fluida.' },
    { id: 'MAT006', name: 'Cabo HDMI 10m', quantity: 30, status: 'Disponível', category: 'Cabos', description: 'Cabo HDMI 2.0 de alta velocidade com 10 metros.' },
    { id: 'MAT007', name: 'Gravador Zoom H6', quantity: 4, status: 'Em uso', category: 'Áudio', description: 'Gravador de áudio portátil com 6 canais.' },
    { id: 'MAT008', name: 'Monitor de Referência', quantity: 2, status: 'Disponível', category: 'Acessórios', description: 'Monitor de 7 polegadas para referência de vídeo em campo.' },
];

const MaterialsPage = () => {
  const { user } = useAuth();
  const canWrite = user ? hasActionPermission(user.role, 'materials:write') : false;

  const [materials, setMaterials] = React.useState<Material[]>(initialMaterialsData);
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

  const handleSaveMaterial = (materialData: Omit<Material, 'id'> & { id?: string }) => {
    if (materialData.id) {
      setMaterials(prev => 
        prev.map(m => 
          m.id === materialData.id ? { ...m, ...materialData } as Material : m
        )
      );
      showSuccess("Material atualizado com sucesso!");
    } else {
      const newMaterial: Material = {
        ...materialData,
        id: `MAT${Math.floor(Math.random() * 900) + 100}`,
      } as Material;
      setMaterials(prev => [...prev, newMaterial]);
      showSuccess("Material adicionado com sucesso!");
    }
  };

  const filteredMaterials = React.useMemo(() => {
    return materials.filter(material => {
        const statusMatch = statusFilter === 'all' || material.status === statusFilter;
        const categoryMatch = categoryFilter === 'all' || material.category === categoryFilter;
        return statusMatch && categoryMatch;
    });
  }, [statusFilter, categoryFilter, materials]);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
              <CardTitle>Registro de Materiais</CardTitle>
              <CardDescription>
              Gerencie o inventário de materiais da empresa.
              </CardDescription>
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
                      <SelectTrigger id="category-filter" className="w-[180px]">
                          <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          <SelectItem value="Câmeras">Câmeras</SelectItem>
                          <SelectItem value="Lentes">Lentes</SelectItem>
                          <SelectItem value="Iluminação">Iluminação</SelectItem>
                          <SelectItem value="Áudio">Áudio</SelectItem>
                          <SelectItem value="Acessórios">Acessórios</SelectItem>
                          <SelectItem value="Cabos">Cabos</SelectItem>
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
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Status</TableHead>
                      {canWrite && <TableHead className="text-right">Ações</TableHead>}
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {filteredMaterials.map((material) => (
                      <TableRow key={material.id}>
                          <TableCell>{material.id}</TableCell>
                          <TableCell className="font-medium">{material.name}</TableCell>
                          <TableCell>{material.category}</TableCell>
                          <TableCell>{material.quantity}</TableCell>
                          <TableCell>{material.status}</TableCell>
                          {canWrite && (
                            <TableCell className="text-right">
                                <Button variant="outline" size="sm" onClick={() => handleEdit(material)}>Editar</Button>
                            </TableCell>
                          )}
                      </TableRow>
                  ))}
              </TableBody>
          </Table>
        </CardContent>
      </Card>
      <MaterialDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveMaterial}
        material={editingMaterial}
      />
    </>
  );
};

export default MaterialsPage;