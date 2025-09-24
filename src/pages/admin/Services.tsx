"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useServices } from "@/hooks/useServices";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { showError, showSuccess } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthContext";
import { hasActionPermission } from "@/config/roles";
import { Edit, Trash2, Plus, ToggleRight, ToggleLeft } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

export default function AdminServicesPage() {
  const { services, refreshServices, createService, updateService, deleteService, loading } = useServices();
  const { user } = useAuth();
  const role = user?.profile?.role;

  // New permission separation:
  // - canCreate: only Admin (services:create)
  // - canManage: Admin and Gestor Comercial/Coordenador (services:manage) -> edit + toggle status
  // - canDelete: only Admin (services:delete)
  const canCreate = hasActionPermission(role, "services:create");
  const canManage = hasActionPermission(role, "services:manage");
  const canDelete = hasActionPermission(role, "services:delete");
  const isGestorComercial = role === "Coordenador"; // Assuming Coordenador is Gestor Comercial

  const [query, setQuery] = React.useState("");
  const [filtered, setFiltered] = React.useState(services);

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<any | null>(null);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setFiltered(
      services.filter(s => s.name?.toLowerCase().includes(query.toLowerCase()))
    );
  }, [services, query]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setIsDialogOpen(true);
  };

  const openEdit = (svc: any) => {
    setEditing(svc);
    setName(svc.name || "");
    setDescription(svc.description || "");
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!canManage && !canCreate) {
      showError("Sem permissão");
      return;
    }
    if (!name.trim()) {
      showError("Nome obrigatório");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        // Only users with manage permission can edit
        if (!canManage) {
          showError("Sem permissão para editar este serviço.");
          return;
        }
        await updateService(editing.id, { name: name.trim(), description: description.trim() || null });
        showSuccess("Serviço atualizado");
      } else {
        // Only users with create permission can add
        if (!canCreate) {
          showError("Sem permissão para criar serviços.");
          return;
        }
        await createService({ name: name.trim(), description: description.trim() || undefined });
        showSuccess("Serviço criado");
      }
      setIsDialogOpen(false);
      await refreshServices();
    } catch (err: any) {
      showError(err?.message || "Erro ao salvar serviço");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (svc: any) => {
    if (!canManage) {
      showError("Sem permissão para alterar status.");
      return;
    }
    const current = svc.status;
    // Normalize to string
    const currentStr = current === undefined || current === null ? "ativo" : String(current).toLowerCase();
    const newStatus = currentStr === "ativo" || currentStr === "true" || currentStr === "1" ? "inativo" : "ativo";
    try {
      await updateService(svc.id, { status: newStatus });
      showSuccess(`Serviço ${newStatus === "ativo" ? "ativado" : "desativado"}`);
      await refreshServices();
    } catch (err: any) {
      showError(err?.message || "Erro ao atualizar status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) {
      showError("Apenas Admin pode eliminar serviços.");
      return;
    }
    try {
      await deleteService(id);
      showSuccess("Serviço eliminado permanentemente");
      await refreshServices();
    } catch (err: any) {
      showError(err?.message || "Erro ao eliminar serviço");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Serviços Waridu</h1>
          <p className="text-sm text-muted-foreground">Gerencie o catálogo de serviços.</p>
        </div>
        <div className="flex items-center gap-2">
          {canCreate && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              + Novo Serviço
            </Button>
          )}
        </div>
      </div>

      {/* Fixed notice for Gestor Comercial */}
      {isGestorComercial && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent>
            <div className="flex items-start gap-3">
              <div className="flex-1 text-sm">
                <strong>Atenção — Painel do Gestor Comercial:</strong>
                <div>Alterações aplicam-se a todo o catálogo de serviços Waridu. Ao editar ou desativar um serviço, ele deixará de aparecer para novas seleções, mas permanecerá nos registros históricos.</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Catálogo de Serviços</CardTitle>
          <CardDescription>Pesquisar, editar, ativar/desativar ou eliminar (apenas Admin pode eliminar).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Input placeholder="Pesquisar por nome..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead>Última Alteração</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(svc => (
                  <TableRow key={svc.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      <span title={svc.description || ""}>{svc.name}</span>
                    </TableCell>
                    <TableCell className="max-w-lg truncate">{svc.description || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={(svc.status && String(svc.status).toLowerCase() === "ativo") ? "default" : "secondary"}>
                        {(svc.status && String(svc.status).toLowerCase() === "ativo") ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>{svc.created_at ? new Date(svc.created_at).toLocaleString() : "—"}</TableCell>
                    <TableCell>{svc.updated_at ? new Date(svc.updated_at).toLocaleString() : (svc.created_at ? new Date(svc.created_at).toLocaleString() : "—")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit available to those with manage permission */}
                        {canManage ? (
                          <Button variant="outline" size="sm" onClick={() => openEdit(svc)}>
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" disabled>
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        )}

                        {/* Toggle active/inactive available to those with manage permission */}
                        {canManage ? (
                          <Button variant="outline" size="sm" onClick={() => toggleActive(svc)}>
                            {svc.status && String(svc.status).toLowerCase() === "ativo" ? (
                              <>
                                <ToggleLeft className="h-4 w-4 mr-1" />
                                Desativar
                              </>
                            ) : (
                              <>
                                <ToggleRight className="h-4 w-4 mr-1" />
                                Ativar
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" disabled>
                            {svc.status && String(svc.status).toLowerCase() === "ativo" ? "Desativar" : "Ativar"}
                          </Button>
                        )}

                        {/* Delete only for admin */}
                        {canDelete ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4 mr-1" />
                                Eliminar
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Eliminar Serviço?</AlertDialogTitle>
                                <p className="text-sm text-muted-foreground mt-2">
                                  Este serviço pode estar vinculado a clientes/projetos. Deseja prosseguir? Esta ação é irreversível.
                                </p>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(svc.id)}>Confirmar Eliminação</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <Button variant="outline" size="sm" disabled>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Eliminar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filtered.length === 0 && <div className="py-6 text-center text-muted-foreground">Nenhum serviço encontrado.</div>}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Sonorização"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição opcional..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || (!editing && !canCreate)}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}