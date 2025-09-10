import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Role } from "@/types";
import { Edit, Trash2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { Role as ConfigRole } from "@/config/roles";

interface RoleManagerProps {
  roles: Role[];
  onAddRole: (name: string) => void;
  onUpdateRole: (id: string, name: string) => void;
  onDeleteRole: (id: string) => void;
}

export const RoleManager = ({ roles, onAddRole, onUpdateRole, onDeleteRole }: RoleManagerProps) => {
  const [newRoleName, setNewRoleName] = React.useState("");
  const [editingRole, setEditingRole] = React.useState<Role | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  const handleAddRole = () => {
    if (!newRoleName.trim()) {
      showError("O nome da função não pode estar vazio.");
      return;
    }
    if (roles.some(role => role.name.toLowerCase() === newRoleName.trim().toLowerCase())) {
      showError("Esta função já existe.");
      return;
    }
    onAddRole(newRoleName.trim());
    setNewRoleName("");
    showSuccess("Função adicionada com sucesso!");
  };

  const handleUpdateRole = () => {
    if (!editingRole || !editingRole.name.trim()) {
      showError("O nome da função não pode estar vazio.");
      return;
    }
    if (roles.some(role => role.name.toLowerCase() === editingRole.name.trim().toLowerCase() && role.id !== editingRole.id)) {
      showError("Esta função já existe.");
      return;
    }
    onUpdateRole(editingRole.id, editingRole.name.trim());
    setIsEditDialogOpen(false);
    setEditingRole(null);
    showSuccess("Função atualizada com sucesso!");
  };

  const handleDeleteRole = (roleId: string) => {
    onDeleteRole(roleId);
    showSuccess("Função removida com sucesso!");
  };

  const openEditDialog = (role: Role) => {
    setEditingRole({ ...role });
    setIsEditDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Funções</CardTitle>
          <CardDescription>
            Adicione, edite ou remova as funções dos funcionários.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full max-w-sm items-center space-x-2 mb-6">
            <Input 
              type="text" 
              placeholder="Ex: Editor de Vídeo" 
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddRole()}
            />
            <Button type="button" onClick={handleAddRole}>Adicionar Função</Button>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Funções existentes</h4>
            <div className="rounded-md border">
              {roles.map((role) => (
                <div key={role.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                  <span className="text-sm">{role.name}</span>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(role)}>
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
                          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso removerá permanentemente a função "{role.name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteRole(role.id)}>
                            Continuar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Função</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="edit-role-name">Nome da Função</Label>
            <Input 
              id="edit-role-name"
              value={editingRole?.name || ""}
              onChange={(e) =>
                setEditingRole((prev: Role | null) =>
                  prev ? { ...prev, name: e.target.value as ConfigRole } : prev
                )
              }
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdateRole}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};