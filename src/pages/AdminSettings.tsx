import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RoleManager } from "@/components/settings/RoleManager";
import type { Role } from "@/types";
import { Button } from "@/components/ui/button";
import * as React from "react";
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
import { showSuccess, showError } from "@/utils/toast";
import CategoryManager from "@/components/settings/CategoryManager";
import { useAuth } from "@/contexts/AuthContext";
import { hasActionPermission } from "@/config/roles";

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

  return (
    <div className="grid gap-6">
      <RoleManager
        roles={roles}
        onAddRole={onAddRole}
        onUpdateRole={onUpdateRole}
        onDeleteRole={onDeleteRole}
      />

      {canManageCategories && <CategoryManager />}

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
    </div>
  );
};

export default AdminSettings;