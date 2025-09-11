"use client";

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
import { showError, showSuccess } from "@/utils/toast";
import { useLocations } from "@/hooks/useLocations";
import { useMaterialCategories } from "@/hooks/useMaterialCategories";
import { Edit, Plus, Trash2, Search } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (materialData: Omit<Material, 'id' | 'locations'> & { id?: string }) => void; // não exige 'locations'
  material?: Material | null;
  onAddInitialStock?: (materialId: string, locationId: string, quantity: number) => void;
}

export function MaterialDialog({ open, onOpenChange, onSave, material, onAddInitialStock }: MaterialDialogProps) {
  const { locations } = useLocations();
  const { categories: materialCategories, addCategory, updateCategory, deleteCategory, loading: catLoading, refreshCategories } = useMaterialCategories();
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [status, setStatus] = React.useState<Material['status']>("Disponível");
  const [description, setDescription] = React.useState("");
  const [initialLocation, setInitialLocation] = React.useState("");
  const [initialQuantity, setInitialQuantity] = React.useState<number | "">("");

  // Para gerenciamento de categorias no mini-diálogo
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<{ id: string; name: string; description?: string } | null>(null);
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [newCategoryDesc, setNewCategoryDesc] = React.useState("");
  const [categorySearch, setCategorySearch] = React.useState(""); // Busca nas categorias

  const isEditing = !!material;

  // Recarregar categorias após adicionar/editar/remover para atualizar o Select imediatamente
  React.useEffect(() => {
    if (open) {
      refreshCategories(); // Garante que o Select sempre tenha dados frescos
    }
  }, [open, refreshCategories]);

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
      quantity: material?.quantity || 0,
    };

    try {
      await onSave(materialData);
      if (!isEditing && initialLocation && initialQuantity && Number(initialQuantity) > 0) {
        // Adicionar estoque inicial após salvar o material (assumindo que onAddInitialStock é chamado com o novo ID)
        // Nota: Você precisará ajustar o hook useMaterials para retornar o ID do novo material e passá-lo aqui
        // Por enquanto, assumimos que onSave retorna o ID ou é gerenciado no parent
        onAddInitialStock?.(materialData.id || '', initialLocation, Number(initialQuantity));
      }
      showSuccess(isEditing ? "Material atualizado!" : "Material adicionado com sucesso!");
      onOpenChange(false);
    } catch (error) {
      showError("Erro ao salvar material.");
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      showError("Nome da categoria é obrigatório.");
      return;
    }
    if (materialCategories.some(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      showError("Categoria já existe.");
      return;
    }
    try {
      await addCategory(newCategoryName.trim(), newCategoryDesc.trim() || undefined);
      showSuccess("Categoria adicionada!");
      setNewCategoryName("");
      setNewCategoryDesc("");
      // Refresh garante que o Select atualize
      await refreshCategories();
    } catch (err) {
      showError("Erro ao adicionar categoria.");
    }
  };

  const openEditCategory = (cat: { id: string; name: string; description?: string }) => {
    setEditingCategory({ ...cat });
  };

  const handleSaveCatEdit = async () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      showError("Nome da categoria é obrigatório.");
      return;
    }
    if (materialCategories.some(c => c.name.toLowerCase() === editingCategory.name.trim().toLowerCase() && c.id !== editingCategory.id)) {
      showError("Categoria já existe.");
      return;
    }
    try {
      await updateCategory(editingCategory.id, editingCategory.name.trim(), editingCategory.description?.trim() || undefined);
      showSuccess("Categoria atualizada!");
      setEditingCategory(null);
      // Refresh garante que o Select atualize
      await refreshCategories();
    } catch (err) {
      showError("Erro ao atualizar categoria.");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id);
      showSuccess("Categoria removida!");
      // Se a categoria selecionada no material for removida, resetar para vazio
      if (category === materialCategories.find(c => c.id === id)?.name) {
        setCategory("");
      }
      // Refresh garante que o Select atualize
      await refreshCategories();
    } catch (err) {
      showError("Erro ao remover categoria.");
    }
  };

  // Filtrar categorias para busca
  const filteredCategories = React.useMemo(() => {
    if (!categorySearch.trim()) return materialCategories;
    const searchLower = categorySearch.toLowerCase();
    return materialCategories.filter(cat => 
      cat.name.toLowerCase().includes(searchLower) || 
      (cat.description && cat.description.toLowerCase().includes(searchLower))
    );
  }, [materialCategories, categorySearch]);

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
                <Select value={category} onValueChange={setCategory} disabled={catLoading}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={catLoading ? "Carregando categorias..." : "Selecione a categoria"} />
                  </SelectTrigger>
                  <SelectContent>
                    {materialCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={() => setIsCategoryDialogOpen(true)} disabled={catLoading}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Gerenciar categorias (adicionar/editar/remover)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
            <Button type="button" onClick={handleSubmit} disabled={!name || !category}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mini-Diálogo para Gerenciar Categorias */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Gerenciar Categorias de Materiais</DialogTitle>
            <DialogDescription>Adicione, edite ou remova categorias. Mudanças são salvas no banco e aparecem imediatamente no Select.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Busca */}
            <div className="flex gap-2">
              <Input
                placeholder="Buscar categorias..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" size="icon" onClick={() => setCategorySearch("")} disabled={!categorySearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Adicionar Nova Categoria */}
            <div className="flex gap-2 p-2 border rounded">
              <Input
                placeholder="Nome da nova categoria (ex: Equipamentos de Som)"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Descrição (opcional)"
                value={newCategoryDesc}
                onChange={(e) => setNewCategoryDesc(e.target.value)}
                className="flex-1"
              />
              <Button size="sm" onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            </div>

            {/* Lista de Categorias (filtradas) */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filteredCategories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex-1">
                    {editingCategory?.id === cat.id ? (
                      <div className="flex gap-2 flex-wrap">
                        <Input
                          value={editingCategory.name}
                          onChange={(e) => setEditingCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
                          placeholder="Nome"
                          className="flex-1 min-w-[150px]"
                        />
                        <Input
                          value={editingCategory.description || ""}
                          onChange={(e) => setEditingCategory(prev => prev ? { ...prev, description: e.target.value } : null)}
                          placeholder="Descrição"
                          className="flex-1 min-w-[150px]"
                        />
                        <Button size="sm" onClick={handleSaveCatEdit} disabled={!editingCategory.name.trim()}>
                          Salvar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingCategory(null)}>
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium">{cat.name}</p>
                        {cat.description && <p className="text-sm text-muted-foreground">{cat.description}</p>}
                      </div>
                    )}
                  </div>
                  {editingCategory?.id !== cat.id && (
                    <div className="flex gap-1 ml-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => openEditCategory({ id: cat.id, name: cat.name, description: cat.description })}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar categoria</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remover Categoria?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Materiais existentes não serão afetados, mas esta categoria será removida do Select. Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteCategory(cat.id)}>
                                    Remover
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TooltipTrigger>
                          <TooltipContent>Remover categoria</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
              ))}
              {filteredCategories.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {categorySearch ? "Nenhuma categoria encontrada." : "Nenhuma categoria. Adicione a primeira!"}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => { setIsCategoryDialogOpen(false); setCategorySearch(""); }}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}