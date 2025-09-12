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

export interface MaterialCategory {
  id: string;
  name: string;
}

interface MaterialCategoryManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategorySelected?: (categoryName: string) => void;
}

export const MaterialCategoryManager: React.FC<MaterialCategoryManagerProps> = ({
  open,
  onOpenChange,
  onCategorySelected
}) => {
  const { categories: materialCategories, addCategory, updateCategory, deleteCategory } = useMaterialCategories();

  const [editingCategory, setEditingCategory] = React.useState<{ id: string; name: string } | null>(null);
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [categorySearch, setCategorySearch] = React.useState("");
  const [addCategoryError, setAddCategoryError] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);

  const filteredCategories = React.useMemo(() => {
    if (!categorySearch.trim()) return materialCategories;
    const searchLower = categorySearch.toLowerCase();
    return materialCategories.filter(cat => cat.name.toLowerCase().includes(searchLower));
  }, [materialCategories, categorySearch]);

  const handleAddCategory = React.useCallback(async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      setAddCategoryError("Nome da categoria é obrigatório.");
      return;
    }
    if (materialCategories.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      setAddCategoryError("Categoria já existe.");
      return;
    }

    setAdding(true);
    setAddCategoryError(null);

    try {
      await addCategory(trimmedName);
      showSuccess("Categoria adicionada com sucesso!");
      onCategorySelected?.(trimmedName);
      setNewCategoryName("");
    } catch (err: any) {
      console.error("Add category error:", err);
      const errorMessage = err?.message || "Erro ao adicionar categoria.";
      setAddCategoryError(errorMessage);
    } finally {
      setAdding(false);
    }
  }, [newCategoryName, materialCategories, addCategory, onCategorySelected]);

  const openEditCategory = React.useCallback((cat: MaterialCategory) => {
    setEditingCategory({ id: cat.id, name: cat.name });
  }, []);

  const handleSaveCategoryEdit = React.useCallback(async () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      showError("Nome da categoria é obrigatório.");
      return;
    }

    const trimmedName = editingCategory.name.trim();
    if (materialCategories.some(c => c.name.toLowerCase() === trimmedName.toLowerCase() && c.id !== editingCategory.id)) {
      showError("Categoria já existe.");
      return;
    }

    try {
      await updateCategory(editingCategory.id, trimmedName);
      showSuccess("Categoria atualizada com sucesso!");
      onCategorySelected?.(trimmedName);
      setEditingCategory(null);
    } catch (err: any) {
      console.error("Update category error:", err);
      showError("Erro ao atualizar categoria.");
    }
  }, [editingCategory, materialCategories, updateCategory, onCategorySelected]);

  const handleDeleteCategory = React.useCallback(async (id: string) => {
    try {
      await deleteCategory(id);
      showSuccess("Categoria removida com sucesso!");
      onCategorySelected?.("");
    } catch (err: any) {
      console.error("Delete category error:", err);
      showError("Erro ao remover categoria.");
    }
  }, [deleteCategory, onCategorySelected]);

  React.useEffect(() => {
    if (!open) {
      setNewCategoryName("");
      setEditingCategory(null);
      setAddCategoryError(null);
      setCategorySearch("");
    }
  }, [open]);

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
          <div className="flex gap-2">
            <Label htmlFor="category-search" className="sr-only">Buscar categorias</Label>
            <Input
              id="category-search"
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

          <div className="flex gap-2 p-2 border rounded">
            <div className="flex-1 space-y-2">
              <Label htmlFor="new-category-name">Nome da nova categoria</Label>
              <Input
                id="new-category-name"
                placeholder="Nome da categoria"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                disabled={adding}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
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
                            value={editingCategory.name}
                            onChange={(e) => setEditingCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
                            placeholder="Nome"
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
                          onClick={() => setEditingCategory(null)}
                          disabled={adding}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="font-medium truncate">{cat.name}</p>
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
                              onClick={() => openEditCategory(cat)}
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
            onClick={() => onOpenChange(false)}
            disabled={adding}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};