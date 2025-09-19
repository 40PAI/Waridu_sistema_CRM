"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useServices } from "@/hooks/useServices";
import { useAuth } from "@/contexts/AuthContext";
import { hasActionPermission } from "@/config/roles";
import { showError } from "@/utils/toast";
import { Edit, Trash2, Plus } from "lucide-react";

export default function ServicesManager() {
  const { services, loading, createService, updateService, deleteService, refreshServices } = useServices();
  const { user } = useAuth();
  const canManage = hasActionPermission(user?.profile?.role, "services:manage");
  const canCreate = hasActionPermission(user?.profile?.role, "services:create");
  const canDelete = hasActionPermission(user?.profile?.role, "services:delete");

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<any | null>(null);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setEditing(null);
      setName("");
      setDescription("");
    }
  }, [open]);

  const onOpenNew = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setOpen(true);
  };

  const onOpenEdit = (svc: any) => {
    setEditing(svc);
    setName(svc.name || "");
    setDescription(svc.description || "");
    setOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showError("Nome obrigatório");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateService(editing.id, { name: name.trim(), description: description.trim() || undefined });
      } else {
        await createService({ name: name.trim(), description: description.trim() || undefined });
      }
      await refreshServices();
      setOpen(false);
    } catch (err) {
      // useServices already shows toast; surface minimal message
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) return;
    try {
      await deleteService(id);
      await refreshServices();
    } catch (err) {
      // handled in hook
    }
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle>Gerenciamento de Serviços</CardTitle>
          <CardDescription>Crie, edite ou remova serviços do catálogo.</CardDescription>
        </div>
        {canCreate && (
          <Button onClick={onOpenNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Serviço
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium max-w-[240px] truncate">{s.name}</TableCell>
                  <TableCell className="max-w-[400px] truncate">{s.description || "—"}</TableCell>
                  <TableCell>{s.updated_at ? new Date(s.updated_at).toLocaleString() : s.created_at ? new Date(s.created_at).toLocaleString() : "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => onOpenEdit(s)} disabled={!canManage}>
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(s.id)} disabled={!canDelete}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {services.length === 0 && !loading && <div className="p-4 text-sm text-muted-foreground">Nenhum serviço cadastrado.</div>}
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Input placeholder="Nome do serviço" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Textarea placeholder="Descrição (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}