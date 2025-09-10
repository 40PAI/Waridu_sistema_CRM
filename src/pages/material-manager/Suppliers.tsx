import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Edit, Trash2, Phone, Mail, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { showError, showSuccess } from "@/utils/toast";

interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  rating: number;
  notes: string;
  created_at: string;
}

interface PurchaseOrder {
  id: string;
  supplier_id: string;
  supplier_name: string;
  order_date: string;
  delivery_date: string;
  total_amount: number;
  status: 'Pendente' | 'Entregue' | 'Cancelada';
  items: string;
}

const MaterialManagerSuppliers = () => {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = React.useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingSupplier, setEditingSupplier] = React.useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = React.useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    category: "",
    rating: 5,
    notes: ""
  });
  
  const categories = ["Equipamentos", "Acessórios", "Iluminação", "Áudio", "Câmeras", "Outros"];

  // Load suppliers and purchase orders from Supabase
  React.useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // In a real implementation, you would fetch from Supabase
        // For now, we'll use mock data
        const mockSuppliers: Supplier[] = [
          {
            id: "1",
            name: "TechPro Equipamentos",
            contact_person: "João Silva",
            email: "joao@techpro.com",
            phone: "(11) 99999-9999",
            address: "Av. Paulista, 1000 - São Paulo/SP",
            category: "Equipamentos",
            rating: 4.8,
            notes: "Fornecedor confiável com bons preços",
            created_at: "2024-01-15"
          },
          {
            id: "2",
            name: "Luz e Sombra Ltda",
            contact_person: "Maria Oliveira",
            email: "maria@luzsombra.com",
            phone: "(21) 88888-8888",
            address: "Rua das Lâmpadas, 250 - Rio de Janeiro/RJ",
            category: "Iluminação",
            rating: 4.5,
            notes: "Entrega rápida, mas preços um pouco acima da média",
            created_at: "2024-02-20"
          },
          {
            id: "3",
            name: "Áudio Master",
            contact_person: "Carlos Santos",
            email: "carlos@audiomaster.com",
            phone: "(31) 77777-7777",
            address: "Av. do Contorno, 5000 - Belo Horizonte/MG",
            category: "Áudio",
            rating: 4.2,
            notes: "Qualidade excelente, bom atendimento pós-venda",
            created_at: "2024-03-10"
          }
        ];
        
        const mockOrders: PurchaseOrder[] = [
          {
            id: "1",
            supplier_id: "1",
            supplier_name: "TechPro Equipamentos",
            order_date: "2024-08-01",
            delivery_date: "2024-08-10",
            total_amount: 15000,
            status: "Entregue",
            items: "2 Câmeras + 3 Lentes"
          },
          {
            id: "2",
            supplier_id: "2",
            supplier_name: "Luz e Sombra Ltda",
            order_date: "2024-08-05",
            delivery_date: "2024-08-15",
            total_amount: 8000,
            status: "Pendente",
            items: "5 Kits de luz LED"
          },
          {
            id: "3",
            supplier_id: "3",
            supplier_name: "Áudio Master",
            order_date: "2024-07-20",
            delivery_date: "2024-07-30",
            total_amount: 12000,
            status: "Entregue",
            items: "10 Microfones + 2 Mesas"
          }
        ];
        
        setSuppliers(mockSuppliers);
        setPurchaseOrders(mockOrders);
      } catch (error) {
        console.error("Error fetching data:", error);
        showError("Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const filteredSuppliers = React.useMemo(() => {
    return suppliers.filter(supplier => {
      const matchesSearch = supplier.name.toLowerCase().includes(search.toLowerCase()) ||
        supplier.contact_person.toLowerCase().includes(search.toLowerCase()) ||
        supplier.email.toLowerCase().includes(search.toLowerCase());
      
      const matchesCategory = categoryFilter === "all" || supplier.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  }, [suppliers, search, categoryFilter]);

  const handleAddNew = () => {
    setEditingSupplier(null);
    setSupplierForm({
      name: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
      category: "",
      rating: 5,
      notes: ""
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setSupplierForm({
      name: supplier.name,
      contact_person: supplier.contact_person,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      category: supplier.category,
      rating: supplier.rating,
      notes: supplier.notes
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      // In a real implementation, you would save to Supabase
      if (editingSupplier) {
        // Update existing supplier
        setSuppliers(suppliers.map(s => 
          s.id === editingSupplier.id ? { ...s, ...supplierForm } : s
        ));
        showSuccess("Fornecedor atualizado com sucesso!");
      } else {
        // Add new supplier
        const newSupplier: Supplier = {
          id: String(suppliers.length + 1),
          ...supplierForm,
          created_at: new Date().toISOString().split('T')[0]
        };
        setSuppliers([...suppliers, newSupplier]);
        showSuccess("Fornecedor adicionado com sucesso!");
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving supplier:", error);
      showError("Erro ao salvar fornecedor.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // In a real implementation, you would delete from Supabase
      setSuppliers(suppliers.filter(s => s.id !== id));
      showSuccess("Fornecedor removido com sucesso!");
    } catch (error) {
      console.error("Error deleting supplier:", error);
      showError("Erro ao remover fornecedor.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Carregando fornecedores...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Gerenciamento de Fornecedores</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seus fornecedores e pedidos de compra.
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Fornecedor
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lista de Fornecedores</CardTitle>
            <CardDescription>
              {filteredSuppliers.length} fornecedores cadastrados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar fornecedores..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Avaliação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.length > 0 ? filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{supplier.name}</p>
                        <p className="text-sm text-muted-foreground">{supplier.contact_person}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{supplier.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="text-yellow-500">★</span>
                        <span className="ml-1">{supplier.rating.toFixed(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(supplier)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(supplier.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      Nenhum fornecedor encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Pedidos de Compra</CardTitle>
            <CardDescription>
              Acompanhe seus pedidos recentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.length > 0 ? purchaseOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.supplier_name}
                    </TableCell>
                    <TableCell>
                      {new Date(order.order_date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      R$ {order.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.status === 'Entregue' ? 'default' : order.status === 'Pendente' ? 'secondary' : 'destructive'}>
                        {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      Nenhum pedido de compra encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? "Editar Fornecedor" : "Adicionar Novo Fornecedor"}</DialogTitle>
            <DialogDescription>
              {editingSupplier 
                ? "Atualize as informações do fornecedor." 
                : "Preencha os dados para cadastrar um novo fornecedor."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome da Empresa
              </Label>
              <Input
                id="name"
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contact_person" className="text-right">
                Pessoa de Contato
              </Label>
              <Input
                id="contact_person"
                value={supplierForm.contact_person}
                onChange={(e) => setSupplierForm({...supplierForm, contact_person: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm({...supplierForm, email: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Telefone
              </Label>
              <Input
                id="phone"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Endereço
              </Label>
              <Textarea
                id="address"
                value={supplierForm.address}
                onChange={(e) => setSupplierForm({...supplierForm, address: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Categoria
              </Label>
              <Select value={supplierForm.category} onValueChange={(value) => setSupplierForm({...supplierForm, category: value})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rating" className="text-right">
                Avaliação
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSupplierForm({...supplierForm, rating: star})}
                    className="text-2xl focus:outline-none"
                  >
                    {star <= supplierForm.rating ? (
                      <span className="text-yellow-500">★</span>
                    ) : (
                      <span className="text-gray-300">☆</span>
                    )}
                  </button>
                ))}
                <span className="ml-2">{supplierForm.rating}.0</span>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Observações
              </Label>
              <Textarea
                id="notes"
                value={supplierForm.notes}
                onChange={(e) => setSupplierForm({...supplierForm, notes: e.target.value})}
                className="col-span-3"
                placeholder="Notas adicionais sobre este fornecedor..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit}>
              {editingSupplier ? "Atualizar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MaterialManagerSuppliers;