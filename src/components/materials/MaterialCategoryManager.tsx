import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMaterialCategories } from "@/hooks/useMaterialCategories";
import { Plus, Search, Trash2, Edit } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface MaterialCategory {
  id: string;
  name: string;
  description?: string;
}

interface MaterialCategoryManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategorySelected?: (categoryName: string) => void; // Optional callback when a category is selected/updated
}

export function MaterialCategoryManager({ open, onOpenChange, onCategorySelected }: MaterialCategoryManagerProps) {
  const { categories: materialCategories, addCategory, updateCategory, deleteCategory, refreshCategories, loading } = useMaterialCategories();
  
  const [editingCategory, setEditingCategory] = React.useState<{ id: string; name: string; description?: string } | null>(null);
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [newCategoryDesc, setNewCategoryDesc] = React.useState("");
  const [categorySearch, setCategorySearch] = React.useState("");
  const [addCategoryError, setAddCategoryError] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);

  // Refresh categories when dialog opens
  React.useEffect(() => {
    if (open) {
      console.log("Dialog opened, refreshing categories...");
      refreshCategories();
    } else {
      console.log("Dialog closed, cleaning up states...");
      setNewCategoryName("");
      setNewCategoryDesc("");
      setEditingCategory(null);
      setAddCategoryError(null);
      setCategorySearch("");
    }
  }, [open, refreshCategories]);

  const handleAddCategory = async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      setAddCategoryError("Nome da categoria é obrigatório.");
      return;
    }
    if (materialCategories.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      setAddCategoryError("Categoria já existe (verificação sem distinção de maiúsculas/minúsculas).");
      return;
    }

    setAdding(true);
    setAddCategoryError(null);
    console.log("Adding category:", { name: trimmedName, description: newCategoryDesc.trim() || undefined });

    try {
      console.log("Calling addCategory from hook...");
      await addCategory(trimmedName, newCategoryDesc.trim() || undefined);
      console.log("addCategory returned successfully. Refreshing categories...");
      await refreshCategories();
      console.log("Categories refreshed. New list length:", materialCategories.length + 1);
      showSuccess("Categoria adicionada com sucesso!");
      onCategorySelected?.(trimmedName); // Notify parent of new category
      setNewCategoryName("");
      setNewCategoryDesc("");
      console.log("Closing dialog after success...");
      onOpenChange(false);
    } catch (err: any) {
      console.error("Add category error caught:", err);
      if (err.message?.includes('duplicate key value violates unique constraint')) {
        setAddCategoryError("Nome duplicado no banco de dados. Escolha um nome diferente.");
      } else if (err.message?.includes('row level security policy')) {
        setAddCategoryError("Permissão negada para criar categorias. Verifique RLS no Supabase.");
      } else {
        const errorMessage = err?.message || "Erro ao adicionar categoria. Verifique permissões ou conexão.";
        setAddCategoryError(errorMessage);
        showError(errorMessage);
      }
    } finally {
      setAdding(false);
      // Do not close dialog on error to allow retry
      console.log("Add process ended (finally block).");
    }
  };

  const openEditCategory = (cat: MaterialCategory) => {
    console.log("Opening edit for category:", cat.name);
    setEditingCategory({ id: cat.id, name: cat.name, description: cat.description });
  };

  const handleSaveCategoryEdit = async () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      showError("Nome da categoria é obrigatório.");
      return;
    }

    const trimmedName = editingCategory.name.trim();
    if (materialCategories.some(c => c.name.toLowerCase() === trimmedName.toLowerCase() && c.id !== editingCategory.id)) {
      showError("Categoria já existe.");
      return;
    }

    console.log("Saving edit for category:", editingCategory.id, { name: trimmedName, description: editingCategory.description });
    try {
      await updateCategory(editingCategory.id, trimmedName, editingCategory.description?.trim() || undefined);
      console.log("Update successful. Refreshing categories...");
      await refreshCategories();
      showSuccess("Categoria atualizada com sucesso!");
      onCategorySelected?.(trimmedName); // Notify parent of updated category
      setEditingCategory(null);
      console.log("Closing dialog after edit success...");
      onOpenChange(false);
    } catch (err: any) {
      console.error("Update category error:", err);
      if (err.message?.includes('duplicate key value violates unique constraint')) {
        showError("Não foi possível atualizar: categoria já existe com este nome.");
      } else if (err.message?.includes('row level security policy')) {
        showError("Permissão negada para atualizar categorias. Verifique RLS no Supabase.");
      } else {
        showError("Erro ao atualizar categoria.");
      }
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      console.log("Deleting category:", id);
      await deleteCategory(id);
      console.log("Delete successful. Refreshing categories...");
      await refreshCategories();
      showSuccess("Categoria removida com sucesso!");
      onCategorySelected?.(""); // Reset selection if needed
    } catch (err: any) {
      console.error("Delete category error:", err);
      showError("Erro ao remover categoria.");
    }
  };

  // Filter categories for search
  const filteredCategories = React.useMemo(() => {
    if (!categorySearch.trim()) return materialCategories;
    
    const searchLower = categorySearch.toLowerCase();
    return materialCategories.filter(cat => 
      cat.name.toLowerCase().includes(searchLower) || 
      (cat.description && cat.description.toLowerCase().includes(searchLower))
    );
  }, [materialCategories, categorySearch]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Gerenciar Categorias de Materiais</DialogTitle>
          <DialogDescription>
            Adicione, edite ou remova categorias. As mudanças aparecem imediatamente no seletor de categorias.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search */}
          <div className="flex gap-2">
            <Label htmlFor="category-search" className="sr-only">Buscar categorias</Label>
            <Input
              id="category-search"
              name="category-search"
              autoComplete="off"
              placeholder="Buscar categorias..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              className="flex-1"
            />
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setCategorySearch("")} 
              disabled={!categorySearch.trim()}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Add New Category */}
          <div className="flex gap-2 p-2 border rounded">
            <div className="flex-1 space-y-2">
              <Label htmlFor="new-category-name">Nome da nova categoria</Label>
              <Input
                id="new-category-name"
                name="new-category-name"
                autoComplete="off"
                placeholder="Nome da categoria"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                disabled={adding}
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="new-category-desc">Descrição (opcional)</Label>
              <Input
                id="new-category-desc"
                name="new-category-desc"
                autoComplete="off"
                placeholder="Descrição da categoria"
                value={newCategoryDesc}
                onChange={(e) => setNewCategoryDesc(e.target.value)}
                disabled={adding}
              />
            </div>
            <div className="flex items-end">
              <Button 
                size="sm" 
                onClick={handleAddCategory} 
                disabled={adding || !newCategoryName.trim()}
                className="min-w-[100px]"
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>
            {addCategoryError && (
              <div className="text-xs text-destructive mt-1 w-full">
                {addCategoryError}
              </div>
            )}
          </div>

          {/* Categories List */}
          <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-2">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1 min-w-0">
                    {editingCategory?.id === cat.id ? (
                      <div className="flex flex-wrap gap-2 items-end">
                        <div className="flex-1 space-y-1">
                          <Label htmlFor={`edit-category-name-${cat.id}`}>Nome</Label>
                          <Input
                            id={`edit-category-name-${cat.id}`}
                            name={`edit-category-name-${cat.id}`}
                            autoComplete="off"
                            value={editingCategory.name}
                            onChange={(e) => setEditingCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
                            placeholder="Nome"
                            disabled={adding}
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <Label htmlFor={`edit-category-desc-${cat.id}`}>Descrição</Label>
                          <Input
                            id={`edit-category-desc-${cat.id}`}
                            name={`edit-category-desc-${cat.id}`}
                            autoComplete="off"
                            value={editingCategory.description || ""}
                            onChange={(e) => setEditingCategory(prev => prev ? { ...prev, description: e.target.value } : null)}
                            placeholder="Descrição"
                            disabled={adding}
                          />
                        </div>
                        <Button 
                          size="sm" 
                          onClick={handleSaveCategoryEdit} 
                          disabled={adding || !editingCategory.name.trim()}
                        >
                          Salvar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setEditingCategory(null);
                            console.log("Edit cancelled.");
                          }}
                          disabled={adding}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="font-medium truncate">{cat.name}</p>
                        {cat.description && (
                          <p className="text-sm text-muted-foreground truncate">{cat.description}</p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {editingCategory?.id !== cat.id && (
                    <div className="flex gap-1 ml-2 flex-shrink-0">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => openEditCategory({ id: cat.id, name: cat.name, description: cat.description })}
                              disabled={adding}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" disabled={adding}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remover Categoria?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Materiais existentes não serão afetados, mas esta categoria será removida da lista. 
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel disabled={adding}>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteCategory(cat.id)} disabled={adding}>
                                    Remover
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                            </AlertDialog>
                          </TooltipTrigger>
                          <TooltipContent>Remover</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {categorySearch.trim() ? "Nenhuma categoria encontrada." : "Nenhuma categoria disponível. Adicione a primeira!"}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button 
            onClick={() => {
              console.log("Fechando dialog via botão Fechar...");
              onOpenChange(false);
            }}
            disabled={adding}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}