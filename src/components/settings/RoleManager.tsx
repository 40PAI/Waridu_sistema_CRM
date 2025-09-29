import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Role } from "@/types";
import { Edit, Trash2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { useAutoId } from "@/hooks/useAutoId";
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

interface RoleManagerProps {
  roles: Role[];
  onAddRole: (name: string) => void;
  onUpdateRole: (id: string, name: string) => void;
  onDeleteRole: (id: string) => void;
}

export const RoleManager = ({ roles, onAddRole, onUpdateRole, onDeleteRole }: RoleManagerProps) => {
  // Generate unique IDs for form fields
  const getId = useAutoId('role-manager');
  
  // Ref for first field focus
  const firstFieldRef = React.useRef<HTMLInputElement>(null);
  
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
    
    // Focus the edit input when dialog opens
    setTimeout(() => {
      const editInput = document.getElementById(getId('edit-name'));
      editInput?.focus();
    }, 100);
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
            <div className="space-y-2 flex-1">
              <Label htmlFor={getId('new-role')} className="sr-only">Nova Função</Label>
              <Input 
                id={getId('new-role')}
                name="newRole"
                type="text" 
                autoComplete="off"
                placeholder="Ex: Editor de Vídeo" 
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRole()}
                ref={firstFieldRef}
                aria-label="Nome da nova função"
              />
            </div>
            <Button type="button" onClick={handleAddRole}>Adicionar Função</Button>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Funções existentes</h4>
            <div className="rounded-md border">
              {roles.map((role) => (
                <div key={role.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                  <span className="text-sm">{role.name}</span>
                  <div className="flex items-center gap-2">
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => openEditDialog(role)}
                      aria-label={`Editar função ${role.name}`}
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
                          aria-label={`Excluir função ${role.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent 
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby={getId(`alert-title-${role.id}`)}
                        aria-describedby={getId(`alert-desc-${role.id}`)}
                      >
                        <AlertDialogHeader>
                          <AlertDialogTitle id={getId(`alert-title-${role.id}`)}>Você tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription id={getId(`alert-desc-${role.id}`)}>
                            Esta ação não pode ser desfeita. Isso removerá permanentemente a função "{role.name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            type="button"
                            onClick={() => handleDeleteRole(role.id)}
                          >
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
        <DialogContent 
          role="dialog"
          aria-modal="true"
          aria-labelledby={getId('edit-title')}
        >
          <DialogHeader>
            <DialogTitle id={getId('edit-title')}>Editar Função</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor={getId('edit-name')}>Nome da Função</Label>
            <Input 
              id={getId('edit-name')}
              name="editRoleName"
              autoComplete="off"
              value={editingRole?.name || ""}
              onChange={(e) => setEditingRole(prev => 
                prev ? { ...prev, name: e.target.value as typeof prev.name } : null
              )}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button type="button" onClick={handleUpdateRole}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};