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
  const { categories: materialCategories, addCategory, updateCategory, deleteCategory, refreshCategories } = useMaterialCategories();
  
  const [editingCategory, setEditingCategory] = React.useState<{ id: string; name: string; description?: string } | null>(null);
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [newCategoryDesc, setNewCategoryDesc] = React.useState("");
  const [categorySearch, setCategorySearch] = React.useState("");
  const [addCategoryError, setAddCategoryError] = React.useState<string | null>(null);

  // Refresh categories when dialog opens
  React.useEffect(() => {
    if (open) {
      refreshCategories();
    }
  }, [open, refreshCategories]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setAddCategoryError("Nome da categoria é obrigatório.");
      return;
    }

    if (materialCategories.some(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      setAddCategoryError("Categoria já existe.");
      return;
    }

    try {
      setAddCategoryError(null);
      await addCategory(newCategoryName.trim(), newCategoryDesc.trim() || undefined);
      showSuccess("Categoria adicionada com sucesso!");
      setNewCategoryName("");
      setNewCategoryDesc("");
    } catch (err: any) {
      const errorMessage = err?.message || "Erro ao adicionar categoria.";
      setAddCategoryError(errorMessage);
      showError(errorMessage);
    }
  };

  const openEditCategory = (cat: MaterialCategory) => {
    setEditingCategory({ id: cat.id, name: cat.name, description: cat.description });
  };

  const handleSaveCategoryEdit = async () => {
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
      showSuccess("Categoria atualizada com sucesso!");
      setEditingCategory(null);
      onCategorySelected?.(editingCategory.name.trim()); // Notify parent if needed
    } catch (err) {
      showError("Erro ao atualizar categoria.");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id);
      showSuccess("Categoria removida com sucesso!");
      onCategorySelected?.(""); // Reset selection if needed
    } catch (err) {
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
            <Input
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
            <Input
              placeholder="Nome da nova categoria"
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
            <Button 
              size="sm" 
              onClick={handleAddCategory} 
              disabled={!newCategoryName.trim()}
              className="min-w-[100px]"
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
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
                        <Input
                          value={editingCategory.name}
                          onChange={(e) => setEditingCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
                          placeholder="Nome"
                          className="flex-1 min-w-[120px]"
                        />
                        <Input
                          value={editingCategory.description || ""}
                          onChange={(e) => setEditingCategory(prev => prev ? { ...prev, description: e.target.value } : null)}
                          placeholder="Descrição"
                          className="flex-1 min-w-[120px]"
                        />
                        <Button 
                          size="sm" 
                          onClick={handleSaveCategoryEdit} 
                          disabled={!editingCategory.name.trim()}
                        >
                          Salvar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setEditingCategory(null)}
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
                                <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
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
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteCategory(cat.id)}>
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
              setIsCategoryDialogOpen(false); 
              setCategorySearch(""); 
              setAddCategoryError(null); 
            }}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}