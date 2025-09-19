"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useLocations } from "@/hooks/useLocations";
import { showError, showSuccess } from "@/utils/toast";
import { Edit, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";

export default function LocationsManager() {
  const { locations, addLocation, updateLocation, deleteLocation, loading } = useLocations();
  const [newName, setNewName] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState("");

  const handleAdd = async () => {
    if (!newName.trim()) {
      showError("Nome é obrigatório");
      return;
    }
    await addLocation(newName.trim());
    setNewName("");
  };

  const openEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const saveEdit = async () => {
    if (!editingId || !editingName.trim()) {
      showError("Nome inválido");
      return;
    }
    await updateLocation(editingId, editingName.trim());
    setEditingId(null);
    setEditingName("");
    showSuccess("Localização atualizada");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Localizações de Inventário</CardTitle>
        <CardDescription>Gerencie locais onde os materiais são armazenados.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input placeholder="Nova localização" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Button onClick={handleAdd} disabled={loading || !newName.trim()}>Adicionar</Button>
        </div>

        <div className="rounded-md border divide-y">
          {locations.map((loc) => (
            <div key={loc.id} className="flex items-center justify-between p-3">
              <div className="flex-1 min-w-0">
                {editingId === loc.id ? (
                  <div className="flex gap-2 items-center">
                    <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                    <Button size="sm" onClick={saveEdit}>Salvar</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancelar</Button>
                  </div>
                ) : (
                  <div className="text-sm">{loc.name}</div>
                )}
              </div>

              {editingId !== loc.id && (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(loc.id, loc.name)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover Localização?</AlertDialogTitle>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteLocation(loc.id)}>Remover</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          ))}
          {locations.length === 0 && <div className="p-3 text-sm text-muted-foreground text-center">Nenhuma localização cadastrada.</div>}
        </div>
      </CardContent>
    </Card>
  );
}