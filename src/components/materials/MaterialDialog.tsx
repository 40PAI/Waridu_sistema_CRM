import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { PageMaterial as Material } from "@/types";
import { showError } from "@/utils/toast";
import { useLocations } from "@/hooks/useLocations";
import { useMaterialCategories } from "@/hooks/useMaterialCategories";
import { Edit, Plus } from "lucide-react";

interface MaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (materialData: Omit<Material, 'id' | 'locations'> & { id?: string }) => void; // não exige 'locations'
  material?: Material | null;
  onAddInitialStock?: (materialId: string, locationId: string, quantity: number) => void;
}

export function MaterialDialog({ open, onOpenChange, onSave, material, onAddInitialStock }: MaterialDialogProps) {
  const { locations } = useLocations();
  const { categories: materialCategories, addCategory, updateCategory, deleteCategory } = useMaterialCategories();
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [status, setStatus] = React.useState<Material['status']>("Disponível");
  const [description, setDescription] = React.useState("");
  const [initialLocation, setInitialLocation] = React.useState("");
  const [initialQuantity, setInitialQuantity] = React.useState<number | "">("");

  // Para edição de categorias
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<{ id: string; name: string; description?: string } | null>(null);
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [newCategoryDesc, setNewCategoryDesc] = React.useState("");

  const isEditing = !!material;

  React.useEffect(() => {
    if (open) {
      if (material) {
        setName(material.name);
        setCategory(material.category);
        setStatus(material.status);
        setDescription(material.description);
        setInitialLocation("");
        setInitialQuantity("");
      } else {
        setName("");
        setCategory("");
        setStatus("Disponível");
        setDescription("");
        setInitialLocation("");
        setInitialQuantity("");
      }
    }
  }, [material, open]);

  const handleSubmit = async () => {
    if (!name || !category) {
      showError("Nome e categoria são obrigatórios.");
      return;
    }
    if (!isEditing && (!initialLocation || !initialQuantity || Number(initialQuantity) <= 0)) {
      showError("Para novos materiais, selecione uma localização e quantidade inicial >0.");
      return;
    }

    const materialData: Omit<Material, 'id' | 'locations'> & { id?: string } = {
      id: material?.id,
      name,
      category,
      status,
      description,
      quantity: material?.quantity || 0, // Added missing 'quantity' property
    };

    try {
      const savedMaterial = await onSave(materialData); // Assume onSave returns the saved material or id
      if (!isEditing && onAddInitialStock && initialLocation && initialQuantity) {
        onAddInitialStock(savedMaterial.id, initialLocation, Number(initialQuantity));
      }
      onOpenChange(false);
    } catch (error) {
      showError("Erro ao salvar material.");
    }
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    addCategory(newCategoryName.trim(), newCategoryDesc || undefined);
    setNewCategoryName("");
    setNewCategoryDesc("");
    setIsCategoryDialogOpen(false);
  };

  const handleEditCategory = () => {
    if (!editingCategory || !editingCategory.name.trim()) return;
    updateCategory(editingCategory.id, editingCategory.name.trim(), editingCategory.description);
    setEditingCategory(null);
  };

  const openEditCategory = (cat: { id: string; name: string; description?: string }) => {
    setEditingCategory({ ...cat });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Material" : "Adicionar Novo Material"}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Atualize as informações do material."
                : "Preencha as informações para registrar um novo item no inventário. Para novos materiais, defina estoque inicial."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nome</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder="Ex: Câmera Sony A7S III" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">Categoria</Label>
              <div className="col-span-3 flex gap-2">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {materialCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => setIsCategoryDialogOpen(true)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as Material['status'])}>
                  <SelectTrigger id="status" className="col-span-3"><SelectValue /></SelectTrigger>
                  <SelectContent>
                      <SelectItem value="Disponível">Disponível</SelectItem>
                      <SelectItem value="Em uso">Em uso</SelectItem>
                      <SelectItem value="Manutenção">Manutenção</SelectItem>
                  </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Descrição</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" placeholder="Detalhes sobre o material..." />
            </div>
            {!isEditing && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="initialLocation" className="text-right">Localização Inicial</Label>
                  <Select value={initialLocation} onValueChange={setInitialLocation}>
                    <SelectTrigger id="initialLocation" className="col-span-3">
                      <SelectValue placeholder="Selecione a localização" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(loc => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="initialQuantity" className="text-right">Quantidade Inicial</Label>
                  <Input
                    id="initialQuantity"
                    type="number"
                    value={initialQuantity}
                    onChange={(e) => setInitialQuantity(e.target.value ? Number(e.target.value) : "")}
                    className="col-span-3"
                    placeholder="Ex: 5"
                    min={1}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleSubmit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para gerenciar categorias */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Gerenciar Categorias</DialogTitle>
            <DialogDescription>Adicione, edite ou remova categorias de materiais.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Nome da nova categoria"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <Input
                placeholder="Descrição (opcional)"
                value={newCategoryDesc}
                onChange={(e) => setNewCategoryDesc(e.target.value)}
              />
              <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {materialCategories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1">
                    {editingCategory?.id === cat.id ? (
                      <div className="flex gap-2">
                        <Input
                          value={editingCategory.name}
                          onChange={(e) => setEditingCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
                        />
                        <Input
                          value={editingCategory.description || ""}
                          onChange={(e) => setEditingCategory(prev => prev ? { ...prev, description: e.target.value } : null)}
                          placeholder="Descrição"
                        />
                        <Button size="sm" onClick={handleEditCategory}>Salvar</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingCategory(null)}>Cancelar</Button>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium">{cat.name}</p>
                        {cat.description && <p className="text-sm text-muted-foreground">{cat.description}</p>}
                      </div>
                    )}
                  </div>
                  {editingCategory?.id !== cat.id && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => openEditCategory(cat)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => deleteCategory(cat.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsCategoryDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}