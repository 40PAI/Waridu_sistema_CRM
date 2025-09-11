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
import { MaterialCategoryManager } from "./MaterialCategoryManager";
import { Edit } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (materialData: Omit<Material, 'id' | 'locations'> & { id?: string }) => void;
  material?: Material | null;
  onAddInitialStock?: (materialId: string, locationId: string, quantity: number) => void;
}

export function MaterialDialog({ open, onOpenChange, onSave, material, onAddInitialStock }: MaterialDialogProps) {
  const { locations } = useLocations();
  const { categories: materialCategories, refreshCategories } = useMaterialCategories();
  
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [status, setStatus] = React.useState<Material['status']>("Disponível");
  const [description, setDescription] = React.useState("");
  const [initialLocation, setInitialLocation] = React.useState("");
  const [initialQuantity, setInitialQuantity] = React.useState<number | "">("");
  
  // Category management dialog state
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = React.useState(false);

  const isEditing = !!material;

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      if (material) {
        setName(material.name);
        setCategory(material.category);
        setStatus(material.status);
        setDescription(material.description || "");
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
      // Refresh categories when opening
      refreshCategories();
    }
  }, [material, open, refreshCategories]);

  const handleSubmit = async () => {
    if (!name.trim() || !category.trim()) {
      showError("Nome e categoria são obrigatórios.");
      return;
    }

    if (!isEditing && (!initialLocation || !initialQuantity || Number(initialQuantity) <= 0)) {
      showError("Para novos materiais, selecione uma localização e quantidade inicial maior que 0.");
      return;
    }

    const materialData: Omit<Material, 'id' | 'locations'> & { id?: string } = {
      id: material?.id,
      name: name.trim(),
      category: category.trim(),
      status,
      description: description.trim() || undefined,
      quantity: material?.quantity || 0,
    };

    try {
      await onSave(materialData);
      
      if (!isEditing && initialLocation && initialQuantity && Number(initialQuantity) > 0) {
        onAddInitialStock?.(materialData.id || '', initialLocation, Number(initialQuantity));
      }
      
      showSuccess(isEditing ? "Material atualizado com sucesso!" : "Material adicionado com sucesso!");
      onOpenChange(false);
    } catch (error) {
      showError("Erro ao salvar material. Tente novamente.");
    }
  };

  // Callback for when a category is added/updated in the manager
  const handleCategoryChange = (newCategoryName: string) => {
    setCategory(newCategoryName);
    refreshCategories(); // Refresh to include the new/updated category
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Material" : "Adicionar Novo Material"}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Atualize as informações do material."
                : "Preencha as informações para registrar um novo item no inventário. Para novos materiais, defina o estoque inicial."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nome</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="col-span-3" 
                placeholder="Ex: Câmera Sony A7S III" 
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">Categoria</Label>
              <div className="col-span-3 flex gap-2">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {materialCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => setIsCategoryDialogOpen(true)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Gerenciar categorias</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as Material['status'])}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Disponível">Disponível</SelectItem>
                  <SelectItem value="Em uso">Em uso</SelectItem>
                  <SelectItem value="Manutenção">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Descrição</Label>
              <Textarea 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                className="col-span-3" 
                placeholder="Detalhes sobre o material..."
              />
            </div>

            {!isEditing && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="initialLocation" className="text-right">Localização Inicial</Label>
                  <Select value={initialLocation} onValueChange={setInitialLocation}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione a localização" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(loc => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name}
                        </SelectItem>
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
            <Button type="button" onClick={handleSubmit} disabled={!name.trim() || !category.trim()}>
              {isEditing ? "Atualizar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Use the new modular category manager */}
      <MaterialCategoryManager 
        open={isCategoryDialogOpen} 
        onOpenChange={setIsCategoryDialogOpen} 
        onCategorySelected={handleCategoryChange} // Pass callback to update category selection
      />
    </>
  );
}