import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const materials = [
    { id: 'MAT001', name: 'Cadeira de Plástico', quantity: 150, status: 'Disponível' },
    { id: 'MAT002', name: 'Mesa Retangular', quantity: 40, status: 'Em uso' },
    { id: 'MAT003', name: 'Projetor HD', quantity: 5, status: 'Disponível' },
    { id: 'MAT004', name: 'Caixa de Som', quantity: 10, status: 'Manutenção' },
];

const MaterialsPage = () => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Registro de Materiais</CardTitle>
            <CardDescription>
            Gerencie o inventário de materiais da empresa.
            </CardDescription>
        </div>
        <Button>Adicionar Material</Button>
      </CardHeader>
      <CardContent>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {materials.map((material) => (
                    <TableRow key={material.id}>
                        <TableCell>{material.id}</TableCell>
                        <TableCell className="font-medium">{material.name}</TableCell>
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