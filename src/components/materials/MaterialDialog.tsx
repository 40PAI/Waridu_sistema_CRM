import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { PageMaterial as Material } from "@/types";
import { showError } from "@/utils/toast";
import { useLocations } from "@/hooks/useLocations";

interface MaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (materialData: Omit<Material, 'id' | 'locations'> & { id?: string }) => void; // não exige 'locations'
  material?: Material | null;
  onAddInitialStock?: (materialId: string, locationId: string, quantity: number) => void;
}

export function MaterialDialog({ open, onOpenChange, onSave, material, onAddInitialStock }: MaterialDialogProps) {
  const { locations } = useLocations();
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [status, setStatus] = React.useState<Material['status']>("Disponível");
  const [description, setDescription] = React.useState("");
  const [initialLocation, setInitialLocation] = React.useState("");
  const [initialQuantity, setInitialQuantity] = React.useState<number | "">("");

  const isEditing = !!material;

  React.useEffect(() => {
    if (open) {
      if (material) {
        setName(material.name);
        setCategory(material.category);
        setStatus(material.status);
        setDescription(material.description);
        setInitialLocation("");
        setInitialQuantity("");
      } else {
        setName("");
        setCategory("");
        setStatus("Disponível");
        setDescription("");
        setInitialLocation("");
        setInitialQuantity("");
      }
    }
  }, [material, open]);

  const handleSubmit = async () => {
    if (!name || !category) {
      showError("Nome e categoria são obrigatórios.");
      return;
    }
    if (!isEditing && (!initialLocation || !initialQuantity || Number(initialQuantity) <= 0)) {
      showError("Para novos materiais, selecione uma localização e quantidade inicial >0.");
      return;
    }

    const materialData: Omit<Material, 'id' | 'locations'> & { id?: string } = {
      id: material?.id,
      name,
      category,
      status,
      description,
      quantity: material?.quantity || 0, // Added missing 'quantity' property
    };

    try {
      const savedMaterial = await onSave(materialData); // Assume onSave returns the saved material or id
      if (!isEditing && onAddInitialStock && initialLocation && initialQuantity) {
        onAddInitialStock(savedMaterial.id, initialLocation, Number(initialQuantity));
      }
      onOpenChange(false);
    } catch (error) {
      showError("Erro ao salvar material.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Material" : "Adicionar Novo Material"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Atualize as informações do material."
              : "Preencha as informações para registrar um novo item no inventário. Para novos materiais, defina estoque inicial."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Nome</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder="Ex: Câmera Sony A7S III" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="col-span-3">
                    <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Câmeras">Câmeras</SelectItem>
                    <SelectItem value="Lentes">Lentes</SelectItem>
                    <SelectItem value="Iluminação">Iluminação</SelectItem>
                    <SelectItem value="Áudio">Áudio</SelectItem>
                    <SelectItem value="Acessórios">Acessórios</SelectItem>
                    <SelectItem value="Cabos">Cabos</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as Material['status'])}>
                <SelectTrigger id="status" className="col-span-3"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="Disponível">Disponível</SelectItem>
                    <SelectItem value="Em uso">Em uso</SelectItem>
                    <SelectItem value="Manutenção">Manutenção</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Descrição</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" placeholder="Detalhes sobre o material..." />
          </div>
          {!isEditing && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="initialLocation" className="text-right">Localização Inicial</Label>
                <Select value={initialLocation} onValueChange={setInitialLocation}>
                  <SelectTrigger id="initialLocation" className="col-span-3">
                    <SelectValue placeholder="Selecione a localização" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="initialQuantity" className="text-right">Quantidade Inicial</Label>
                <Input
                  id="initialQuantity"
                  type="number"
                  value={initialQuantity}
                  onChange={(e) => setInitialQuantity(e.target.value ? Number(e.target.value) : "")}
                  className="col-span-3"
                  placeholder="Ex: 5"
                  min={1}
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleSubmit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}