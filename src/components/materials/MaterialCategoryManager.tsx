import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMaterialCategories } from "@/hooks/useMaterialCategories";
import { Plus, Search, Trash2, Edit, X } from "lucide-react";
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
import { useAutoId } from "@/hooks/useAutoId";

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
  
  // Generate unique IDs for form fields
  const getId = useAutoId('material-category-manager');
  
  // Ref for first field focus
  const firstFieldRef = React.useRef<HTMLInputElement>(null);

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
    if (open) {
      // Focus first field for accessibility when component mounts
      setTimeout(() => {
        firstFieldRef.current?.focus();
      }, 100);
    } else {
      setNewCategoryName("");
      setEditingCategory(null);
      setAddCategoryError(null);
      setCategorySearch("");
    }
  }, [open]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Label htmlFor={getId('category-search')} className="sr-only">Buscar categorias</Label>
        <Input
          id={getId('category-search')}
          name="categorySearch"
          autoComplete="off"
          placeholder="Buscar categorias..."
          value={categorySearch}
          onChange={(e) => setCategorySearch(e.target.value)}
          className="flex-1"
          ref={firstFieldRef}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setCategorySearch("")}
          disabled={!categorySearch.trim()}
          aria-label="Limpar busca"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-2 p-2 border rounded">
        <div className="flex-1 space-y-2">
          <Label htmlFor={getId('new-category-name')}>Nome da nova categoria</Label>
          <Input
            id={getId('new-category-name')}
            name="newCategoryName"
            autoComplete="off"
            placeholder="Nome da categoria"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            disabled={adding}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
          />
        </div>
        <div className="flex items-end">
          <Button
            type="button"
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
                      <Label htmlFor={getId(`edit-category-name-${cat.id}`)}>Nome</Label>
                      <Input
                        id={getId(`edit-category-name-${cat.id}`)}
                        name="editCategoryName"
                        autoComplete="off"
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
                        placeholder="Nome"
                        disabled={adding}
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveCategoryEdit}
                      disabled={adding || !editingCategory.name.trim()}
                    >
                      Salvar
                    </Button>
                    <Button
                      type="button"
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
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => openEditCategory(cat)}
                          disabled={adding}
                          aria-label={`Editar categoria ${cat.name}`}
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
                            <Button 
                              type="button"
                              size="sm" 
                              variant="outline" 
                              className="text-destructive hover:text-destructive" 
                              disabled={adding}
                              aria-label={`Excluir categoria ${cat.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent 
                            role="alertdialog"
                            aria-modal="true"
                            aria-labelledby={getId(`alert-title-${cat.id}`)}
                            aria-describedby={getId(`alert-desc-${cat.id}`)}
                          >
                            <AlertDialogHeader>
                              <AlertDialogTitle id={getId(`alert-title-${cat.id}`)}>Remover Categoria?</AlertDialogTitle>
                              <AlertDialogDescription id={getId(`alert-desc-${cat.id}`)}>
                                Materiais existentes não serão afetados, mas esta categoria será removida da lista.
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel type="button" disabled={adding}>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                type="button"
                                onClick={() => handleDeleteCategory(cat.id)} 
                                disabled={adding}
                              >
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

      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={adding}
        >
          Fechar
        </Button>
      </div>
    </div>
  );
};