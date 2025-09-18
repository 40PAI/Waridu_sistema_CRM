import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

interface Location {
  id: string;
  name: string;
}

interface LocationManagerProps {
  locations: Location[];
  onAddLocation: (name: string) => void;
  onUpdateLocation: (id: string, name: string) => void;
  onDeleteLocation: (id: string) => void;
}

export const LocationManager = ({ locations, onAddLocation, onUpdateLocation, onDeleteLocation }: LocationManagerProps) => {
  const [newLocation, setNewLocation] = React.useState("");
  const [editingLoc, setEditingLoc] = React.useState<Location | null>(null);
  const [isEditOpen, setIsEditOpen] = React.useState(false);

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
    <>
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
    </>
  );
};