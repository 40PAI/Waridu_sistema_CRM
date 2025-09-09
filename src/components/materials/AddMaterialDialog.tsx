import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddMaterialDialogProps {
  onAddMaterial: (newMaterial: any) => void;
}

export function AddMaterialDialog({ onAddMaterial }: AddMaterialDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [quantity, setQuantity] = React.useState(1);
  const [status, setStatus] = React.useState("Disponível");

  const handleSubmit = () => {
    if (!name || !category) {
      // In a real app, you would show a toast notification for the error.
      console.error("Nome e categoria são obrigatórios.");
      return;
    }

    const newMaterial = {
      id: `MAT${Math.floor(Math.random() * 900) + 100}`, // Simple random ID for demo
      name,
      category,
      quantity,
      status,
    };

    onAddMaterial(newMaterial);
    
    // Reset form and close dialog
    setName("");
    setCategory("");
    setQuantity(1);
    setStatus("Disponível");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Adicionar Material</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Material</DialogTitle>
          <DialogDescription>
            Preencha as informações abaixo para registrar um novo item no inventário.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder="Ex: Câmera Sony A7S III" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Categoria
            </Label>
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
            <Label htmlFor="quantity" className="text-right">
              Quantidade
            </Label>
            <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="col-span-3" min="1" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status" className="col-span-3">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Disponível">Disponível</SelectItem>
                    <SelectItem value="Em uso">Em uso</SelectItem>
                    <SelectItem value="Manutenção">Manutenção</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleSubmit}>Salvar Material</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}