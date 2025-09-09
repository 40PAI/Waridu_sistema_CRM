import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AddMaterialDialog } from "@/components/materials/AddMaterialDialog";

const initialMaterialsData = [
    { id: 'MAT001', name: 'Câmera Sony A7S III', quantity: 5, status: 'Disponível', category: 'Câmeras' },
    { id: 'MAT002', name: 'Lente Canon 24-70mm', quantity: 8, status: 'Em uso', category: 'Lentes' },
    { id: 'MAT003', name: 'Kit de Luz Aputure 300D', quantity: 3, status: 'Disponível', category: 'Iluminação' },
    { id: 'MAT004', name: 'Microfone Rode NTG5', quantity: 10, status: 'Manutenção', category: 'Áudio' },
    { id: 'MAT005', name: 'Tripé Manfrotto', quantity: 12, status: 'Disponível', category: 'Acessórios' },
    { id: 'MAT006', name: 'Cabo HDMI 10m', quantity: 30, status: 'Disponível', category: 'Cabos' },
    { id: 'MAT007', name: 'Gravador Zoom H6', quantity: 4, status: 'Em uso', category: 'Áudio' },
    { id: 'MAT008', name: 'Monitor de Referência', quantity: 2, status: 'Disponível', category: 'Acessórios' },
];

const MaterialsPage = () => {
  const [materials, setMaterials] = React.useState(initialMaterialsData);
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [categoryFilter, setCategoryFilter] = React.useState('all');

  const handleAddMaterial = (newMaterial: any) => {
    setMaterials(prevMaterials => [...prevMaterials, newMaterial]);
  };

  const filteredMaterials = React.useMemo(() => {
    return materials.filter(material => {
        const statusMatch = statusFilter === 'all' || material.status === statusFilter;
        const categoryMatch = categoryFilter === 'all' || material.category === categoryFilter;
        return statusMatch && categoryMatch;
    });
  }, [statusFilter, categoryFilter, materials]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Registro de Materiais</CardTitle>
            <CardDescription>
            Gerencie o inventário de materiais da empresa.
            </CardDescription>
        </div>
        <AddMaterialDialog onAddMaterial={handleAddMaterial} />
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
                        <TableCell>{material.status}</TableCell>
                        <TableCell className="text-right">
                            <Button variant="outline" size="sm">Editar</Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default MaterialsPage;