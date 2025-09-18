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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  const canManage = hasActionPermission(user?.profile?.role, "services:manage");
  const isAdmin = user?.profile?.role === "Admin";

  const [query, setQuery] = React.useState("");
  const [filtered, setFiltered] = React.useState(services);

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<any | null>(null);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setFiltered(
      services.filter(s => s.name.toLowerCase().includes(query.toLowerCase()))
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
    if (!canManage) {
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
        await updateService(editing.id, { name: name.trim(), description: description.trim() || null });
        showSuccess("Serviço atualizado");
      } else {
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
      showError("Sem permissão");
      return;
    }
    const newStatus = svc.status && (typeof svc.status === "string")
      ? (String(svc.status).toLowerCase() === "ativo" ? "inativo" : "ativo")
      : (svc.status ? "inativo" : "ativo");
    try {
      await updateService(svc.id, { status: newStatus });
      showSuccess(`Serviço ${newStatus === "ativo" ? "ativado" : "desativado"}`);
      await refreshServices();
    } catch (err: any) {
      showError(err?.message || "Erro ao atualizar status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      showError("Apenas Admin pode eliminar.");
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
          <p className="text-sm text-muted-foreground">Gerencie o catálogo de serviços oferecidos.</p>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              + Novo Serviço
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catálogo de Serviços</CardTitle>
          <CardDescription>Pesquisar, editar, ativar/desativar ou eliminar (apenas Admin).</CardDescription>
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
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((svc) => (
                  <TableRow key={svc.id}>
                    <TableCell className="font-medium">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">{svc.name}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{svc.description || "Sem descrição"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="max-w-lg truncate">{svc.description || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={svc.status && String(svc.status).toLowerCase() === "ativo" ? "default" : "secondary"}>
                        {svc.status ? String(svc.status) : (svc.status === undefined ? "Ativo" : "Inativo")}
                      </Badge>
                    </TableCell>
                    <TableCell>{svc.created_at ? new Date(svc.created_at).toLocaleString() : "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canManage && (
                          <Button variant="outline" size="sm" onClick={() => openEdit(svc)}>
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        )}
                        {canManage && (
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
                        )}
                        {isAdmin && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-1" />
                                Eliminar
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Eliminar Serviço</AlertDialogTitle>
                                <p className="text-sm text-muted-foreground mt-2">
                                  Esta ação removerá o serviço permanentemente e pode afetar registros antigos.
                                </p>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(svc.id)}>Confirmar Eliminação</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}