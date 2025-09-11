import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RoleManager } from "@/components/settings/RoleManager";
import type { Role } from "@/types";
import { Button } from "@/components/ui/button";
import * as React from "react";
import { Edit, Trash2, Search } from "lucide-react";
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
import { showSuccess, showError } from "@/utils/toast";
import CategoryManager from "@/components/settings/CategoryManager";
import { useAuth } from "@/contexts/AuthContext";
import { hasActionPermission } from "@/config/roles";
import { useMaterialCategories } from "@/hooks/useMaterialCategories";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Location {
  id: string;
  name: string;
}

interface AdminSettingsProps {
  roles: Role[];
  onAddRole: (name: string) => void;
  onUpdateRole: (id: string, name: string) => void;
  onDeleteRole: (id: string) => void;

  locations: Location[];
  onAddLocation: (name: string) => void;
  onUpdateLocation: (id: string, name: string) => void;
  onDeleteLocation: (id: string) => void;
}

const AdminSettings = ({ roles, onAddRole, onUpdateRole, onDeleteRole, locations, onAddLocation, onUpdateLocation, onDeleteLocation }: AdminSettingsProps) => {
  const [newLocation, setNewLocation] = React.useState("");
  const [editingLoc, setEditingLoc] = React.useState<Location | null>(null);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const { user } = useAuth();
  const canManageCategories = user?.profile?.role ? hasActionPermission(user.profile.role, "categories:manage") : false;

  const { categories: materialCategories, addCategory, updateCategory, deleteCategory, loading: catLoading } = useMaterialCategories();

  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [newCategoryDesc, setNewCategoryDesc] = React.useState("");
  const [editingCat, setEditingCat] = React.useState<{ id: string; name: string; description?: string } | null>(null);
  const [isCatEditOpen, setIsCatEditOpen] = React.useState(false);
  const [categorySearch, setCategorySearch] = React.useState(""); // Busca nas categorias

  const handleAddLocation = () => {
    const name = newLocation.trim();
    if (!name) return;
    if (locations.some(l => l.name.toLowerCase() === name.toLowerCase())) {
      showError("Já existe uma localização com este nome.");
      return;
    }
    onAddLocation(name);
    setNewLocation("");
    showSuccess("Localização adicionada!");
  };

  const openEdit = (loc: Location) => {
    setEditingLoc({ ...loc });
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingLoc) return;
    const name = editingLoc.name.trim();
    if (!name) {
      showError("O nome não pode ser vazio.");
      return;
    }
    if (locations.some(l => l.name.toLowerCase() === name.toLowerCase() && l.id !== editingLoc.id)) {
      showError("Já existe uma localização com este nome.");
      return;
    }
    onUpdateLocation(editingLoc.id, name);
    setIsEditOpen(false);
    setEditingLoc(null);
    showSuccess("Localização atualizada!");
  };

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) {
      showError("O nome da categoria é obrigatório.");
      return;
    }
    if (materialCategories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      showError("Já existe uma categoria com este nome.");
      return;
    }
    addCategory(name, newCategoryDesc.trim() || undefined);
    setNewCategoryName("");
    setNewCategoryDesc("");
    showSuccess("Categoria adicionada com sucesso! Ela agora aparece no diálogo de materiais.");
  };

  const openCatEdit = (cat: { id: string; name: string; description?: string }) => {
    setEditingCat({ ...cat });
    setIsCatEditOpen(true);
  };

  const handleSaveCatEdit = () => {
    if (!editingCat) return;
    const name = editingCat.name.trim();
    if (!name) {
      showError("O nome não pode ser vazio.");
      return;
    }
    if (materialCategories.some(c => c.name.toLowerCase() === name.toLowerCase() && c.id !== editingCat.id)) {
      showError("Já existe uma categoria com este nome.");
      return;
    }
    updateCategory(editingCat.id, name, editingCat.description?.trim() || undefined);
    setIsCatEditOpen(false);
    setEditingCat(null);
    showSuccess("Categoria atualizada! Mudanças refletem em todos os diálogos de materiais.");
  };

  const handleDeleteCategory = (id: string) => {
    deleteCategory(id);
    showSuccess("Categoria removida! Materiais existentes mantêm a referência antiga.");
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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1"> {/* Responsivo: 1 coluna em mobile, 2 em md+ */}
      <RoleManager
        roles={roles}
        onAddRole={onAddRole}
        onUpdateRole={onUpdateRole}
        onDeleteRole={onDeleteRole}
      />

      {canManageCategories && <CategoryManager />}

      <Card>
        <CardHeader>
          <CardTitle>Categorias de Materiais</CardTitle>
          <CardDescription>Gerencie as categorias disponíveis para materiais. Elas são carregadas automaticamente nos diálogos de adição/edição.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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

          <div className="grid gap-2 sm:grid-cols-[1fr_200px_auto]">
            <div className="space-y-1.5">
              <Label>Nome da Categoria</Label>
              <Input
                placeholder="Ex: Equipamentos de Som"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                disabled={catLoading}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição (opcional)</Label>
              <Input
                placeholder="Ex: Microfones, mixers, etc."
                value={newCategoryDesc}
                onChange={(e) => setNewCategoryDesc(e.target.value)}
                disabled={catLoading}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddCategory} disabled={catLoading || !newCategoryName.trim()}>
                Adicionar
              </Button>
            </div>
          </div>

          <div className="rounded-md border divide-y max-h-96 overflow-y-auto">
            {filteredCategories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between p-3">
                <div className="text-sm flex-1">
                  <div className="font-medium">{cat.name}</div>
                  {cat.description && <div className="text-muted-foreground">{cat.description}</div>}
                </div>
                <TooltipProvider>
                  <div className="flex items-center gap-2 ml-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openCatEdit(cat)} disabled={catLoading}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar categoria</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" disabled={catLoading}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover categoria?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Materiais existentes não serão afetados, mas a categoria será removida dos Selects. Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteCategory(cat.id)} disabled={catLoading}>
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TooltipTrigger>
                      <TooltipContent>Remover categoria</TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </div>
            ))}
            {filteredCategories.length === 0 && (
              <div className="p-3 text-sm text-muted-foreground text-center">
                {categorySearch ? "Nenhuma categoria encontrada." : "Nenhuma categoria cadastrada. Adicione a primeira!"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resto do código permanece igual... (localizações, configurações gerais, etc.) */}
      <Card>
        <CardHeader>
          <CardTitle>Localizações de Inventário</CardTitle>
          <CardDescription>Gerencie os locais onde seus materiais estão armazenados.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Input
              placeholder="Ex: Armazém Central"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
            />
            <Button onClick={handleAddLocation}>Adicionar</Button>
          </div>

          <div className="rounded-md border divide-y">
            {locations.map(loc => (
              <div key={loc.id} className="flex items-center justify-between p-3">
                <span className="text-sm">{loc.name}</span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(loc)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover localização?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Os materiais nesta localização serão movidos para outra disponível. Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDeleteLocation(loc.id)}>
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
            {locations.length === 0 && (
              <div className="p-3 text-sm text-muted-foreground text-center">Nenhuma localização cadastrada.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configurações Gerais</CardTitle>
          <CardDescription>Gerencie as configurações gerais do sistema.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="maintenance-mode" className="flex flex-col space-y-1">
              <span>Modo de Manutenção</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Desative o acesso público ao site para manutenção.
              </span>
            </Label>
            <Switch id="maintenance-mode" />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="user-registration" className="flex flex-col space-y-1">
              <span>Permitir Registro de Usuários</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Permita que novos usuários se cadastrem na plataforma.
              </span>
            </Label>
            <Switch id="user-registration" defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configurações de API</CardTitle>
          <CardDescription>Gerencie suas chaves de API para integrações.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
                <Label htmlFor="api-key">Chave da API</Label>
                <Input id="api-key" defaultValue="******************" readOnly />
            </div>
            <div>
                <Label htmlFor="secret-key">Chave Secreta</Label>
                <Input id="secret-key" defaultValue="******************" readOnly />
            </div>
            <Button>Gerar Novas Chaves</Button>
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Localização</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="loc-name">Nome</Label>
            <Input
              id="loc-name"
              value={editingLoc?.name || ""}
              onChange={(e) => setEditingLoc(prev => prev ? { ...prev, name: e.target.value } : null)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCatEditOpen} onOpenChange={setIsCatEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria de Material</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={editingCat?.name || ""} onChange={(e) => setEditingCat(prev => prev ? { ...prev, name: e.target.value } : null)} />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição (opcional)</Label>
              <Input value={editingCat?.description || ""} onChange={(e) => setEditingCat(prev => prev ? { ...prev, description: e.target.value } : null)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCatEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveCatEdit} disabled={!editingCat?.name.trim() || catLoading}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSettings;