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
import { Material } from "@/pages/Materials";
import { showError } from "@/utils/toast";

interface MaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (materialData: Omit<Material, 'id'> & { id?: string }) => void;
  material?: Material | null;
}

export function MaterialDialog({ open, onOpenChange, onSave, material }: MaterialDialogProps) {
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [quantity, setQuantity] = React.useState(1);
  const [status, setStatus] = React.useState<Material['status']>("Disponível");
  const [description, setDescription] = React.useState("");

  const isEditing = !!material;

  React.useEffect(() => {
    if (open) {
      if (material) {
        setName(material.name);
        setCategory(material.category);
        setQuantity(material.quantity);
        setStatus(material.status);
        setDescription(material.description);
      } else {
        setName("");
        setCategory("");
        setQuantity(1);
        setStatus("Disponível");
        setDescription("");
      }
    }
  }, [material, open]);

  const handleSubmit = () => {
    if (!name || !category) {
      showError("Nome e categoria são obrigatórios.");
      return;
    }

    const materialData = {
      id: material?.id,
      name,
      category,
      quantity,
      status,
      description,
      locations: {} // Adicionando o campo locations
    };

    onSave(materialData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Material" : "Adicionar Novo Material"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Atualize as informações do material."
              : "Preencha as informações para registrar um novo item no inventário."}
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
            <Label htmlFor="quantity" className="text-right">Quantidade</Label>
            <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="col-span-3" min="1" />
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
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleSubmit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}