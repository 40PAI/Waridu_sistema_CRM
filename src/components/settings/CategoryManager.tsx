import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTechnicianCategories } from "@/hooks/useTechnicianCategories";
import { Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useAuth } from "@/contexts/AuthContext";
import { hasActionPermission } from "@/config/roles";
import { useAutoId } from "@/hooks/useAutoId";

const CategoryManager = () => {
  const { categories, addCategory, updateCategory, deleteCategory, loading } = useTechnicianCategories();
  const { user } = useAuth();
  const userRole = user?.profile?.role;
  const canManage = !!userRole && hasActionPermission(userRole, "categories:manage");
  
  // Generate unique IDs for form fields
  const getId = useAutoId('category-manager');
  
  // Ref for first field focus
  const firstFieldRef = React.useRef<HTMLInputElement>(null);

  const [newName, setNewName] = React.useState("");
  const [newRate, setNewRate] = React.useState<number | "">("");

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editRate, setEditRate] = React.useState<number | "">("");
  const [editOpen, setEditOpen] = React.useState(false);

  const openEdit = (id: string, name: string, rate: number) => {
    setEditingId(id);
    setEditName(name);
    setEditRate(rate);
    setEditOpen(true);
    
    // Focus the edit input when dialog opens
    setTimeout(() => {
      const editInput = document.getElementById(getId('edit-name'));
      editInput?.focus();
    }, 100);
  };

  const handleAdd = async () => {
    if (!newName.trim() || !newRate || Number(newRate) < 0) return;
    await addCategory(newName.trim(), Number(newRate));
    setNewName("");
    setNewRate("");
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim() || !editRate || Number(editRate) < 0) return;
    await updateCategory(editingId, editName.trim(), Number(editRate));
    setEditOpen(false);
    setEditingId(null);
  };

  if (!canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Categorias de Técnicos</CardTitle>
          <CardDescription>Somente Admin ou Financeiro podem gerenciar categorias.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Você não possui permissão para gerenciar as categorias.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categorias de Técnicos</CardTitle>
        <CardDescription>Gerencie as categorias e seus valores diários (AOA).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-2 sm:grid-cols-[1fr_200px_auto]">
          <div className="space-y-1.5">
            <Label htmlFor={getId('new-name')}>Nome da Categoria</Label>
            <Input
              id={getId('new-name')}
              name="newCategoryName"
              autoComplete="off"
              placeholder="Ex: Categoria 1"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={loading}
              ref={firstFieldRef}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={getId('new-rate')}>Valor/Dia (AOA)</Label>
            <Input
              id={getId('new-rate')}
              name="newCategoryRate"
              type="number"
              autoComplete="off"
              placeholder="Ex: 30000"
              value={newRate}
              onChange={(e) => setNewRate(e.target.value ? Number(e.target.value) : "")}
              disabled={loading}
            />
          </div>
          <div className="flex items-end">
            <Button 
              type="button"
              onClick={handleAdd} 
              disabled={loading || !newName.trim() || !newRate}
            >
              Adicionar
            </Button>
          </div>
        </div>

        <div className="rounded-md border divide-y">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between p-3">
              <div className="text-sm">
                <div className="font-medium">{cat.categoryName}</div>
                <div className="text-muted-foreground">AOA {cat.dailyRate.toLocaleString("pt-AO")}/dia</div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={() => openEdit(cat.id, cat.categoryName, cat.dailyRate)}
                  aria-label={`Editar categoria ${cat.categoryName}`}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      aria-label={`Excluir categoria ${cat.categoryName}`}
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
                      <AlertDialogTitle id={getId(`alert-title-${cat.id}`)}>Remover categoria?</AlertDialogTitle>
                      <AlertDialogDescription id={getId(`alert-desc-${cat.id}`)}>
                        Esta ação não pode ser desfeita. Confirme a remoção.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        type="button"
                        onClick={() => deleteCategory(cat.id)}
                      >
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <div className="p-3 text-sm text-muted-foreground text-center">Nenhuma categoria cadastrada.</div>
          )}
        </div>
      </CardContent>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent 
          role="dialog"
          aria-modal="true"
          aria-labelledby={getId('edit-title')}
        >
          <DialogHeader>
            <DialogTitle id={getId('edit-title')}>Editar Categoria</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <div className="space-y-1.5">
              <Label htmlFor={getId('edit-name')}>Nome</Label>
              <Input 
                id={getId('edit-name')}
                name="editCategoryName"
                autoComplete="off"
                value={editName} 
                onChange={(e) => setEditName(e.target.value)} 
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={getId('edit-rate')}>Valor/Dia (AOA)</Label>
              <Input
                id={getId('edit-rate')}
                name="editCategoryRate"
                type="number"
                autoComplete="off"
                value={editRate}
                onChange={(e) => setEditRate(e.target.value ? Number(e.target.value) : "")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button type="button" onClick={handleSaveEdit} disabled={!editName.trim() || !editRate}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CategoryManager;