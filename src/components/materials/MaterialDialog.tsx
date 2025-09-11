"use client";

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
import { showError, showSuccess } from "@/utils/toast";
import { useLocations } from "@/hooks/useLocations";
import { useMaterialCategories } from "@/hooks/useMaterialCategories";

interface MaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (materialData: Omit<Material, 'id' | 'locations'> & { id?: string }) => Promise<Material>;
  material?: Material | null;
  onAddInitialStock?: (materialId: string, locationId: string, quantity: number) => void;
}

export function MaterialDialog({ open, onOpenChange, onSave, material, onAddInitialStock }: MaterialDialogProps) {
  const { locations } = useLocations();
  const { categories } = useMaterialCategories();
  
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [status, setStatus] = React.useState<Material['status']>("Disponível");
  const [description, setDescription] = React.useState("");
  const [initialLocation, setInitialLocation] = React.useState("");
  const [initialQuantity, setInitialQuantity] = React.useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isEditing = !!material;

  React.useEffect(() => {
    if (open) {
      if (material) {
        setName(material.name);
        setCategory(material.category);
        setStatus(material.status);
        setDescription(material.description || "");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    if (!name.trim() || !category.trim()) {
      showError("Nome e categoria são obrigatórios.");
      return;
    }

    setIsSubmitting(true);

    try {
      const materialData: Omit<Material, 'id' | 'locations'> & { id?: string } = {
        id: material?.id,
        name: name.trim(),
        category: category.trim(),
        status,
        description: description.trim() || undefined,
        quantity: material?.quantity || 0,
      };

      const savedMaterial = await onSave(materialData);
      
      if (!isEditing && initialLocation && Number(initialQuantity) > 0) {
        onAddInitialStock?.(savedMaterial.id, initialLocation, Number(initialQuantity));
      }
      
      showSuccess(isEditing ? "Material atualizado com sucesso!" : "Material adicionado com sucesso!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving material:", error);
      showError("Erro ao salvar material. Verifique a conexão e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions = React.useMemo(() => 
    categories.map((cat) => ({
      value: cat.name,
      label: cat.name,
    })), 
    [categories]
  );

  const locationOptions = React.useMemo(() => 
    locations.map((loc) => ({
      value: loc.id,
      label: loc.name,
    })),
    [locations]
  );

  const statusOptions = React.useMemo(() => [
    { value: "Disponível", label: "Disponível" },
    { value: "Em uso", label: "Em uso" },
    { value: "Manutenção", label: "Manutenção" },
  ], []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Material" : "Adicionar Novo Material"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Atualize as informações do material."
              : "Preencha as informações para registrar um novo item no inventário."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="material-name">Nome *</Label>
            <Input 
              id="material-name" 
              name="material-name"
              autoComplete="off"
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Ex: Câmera Sony A7S III"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="material-category">Categoria *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="material-category" name="material-category">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="material-status">Status *</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as Material['status'])}>
              <SelectTrigger id="material-status" name="material-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isEditing && (
            <>
              <div className="space-y-2">
                <Label htmlFor="material-initial-location">Localização Inicial *</Label>
                <Select value={initialLocation} onValueChange={setInitialLocation}>
                  <SelectTrigger id="material-initial-location" name="material-initial-location">
                    <SelectValue placeholder="Selecione a localização" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="material-initial-quantity">Quantidade Inicial *</Label>
                <Input
                  id="material-initial-quantity"
                  name="material-initial-quantity"
                  autoComplete="off"
                  type="number"
                  value={initialQuantity}
                  onChange={(e) => setInitialQuantity(e.target.value ? Number(e.target.value) : "")}
                  placeholder="Ex: 5"
                  min={1}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="material-description">Descrição</Label>
            <Textarea 
              id="material-description"
              name="material-description"
              autoComplete="off"
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Detalhes sobre o material..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !name.trim() || !category.trim()}
            >
              {isSubmitting ? "Salvando..." : (isEditing ? "Atualizar" : "Adicionar")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}