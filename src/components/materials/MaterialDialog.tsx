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
import { z } from "zod";

// Validation schemas
const materialSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  category: z.string().min(1, "Categoria é obrigatória"),
  status: z.enum(["Disponível", "Em uso", "Manutenção"]),
  description: z.string().optional(),
});

const newMaterialSchema = materialSchema.extend({
  initialLocation: z.string().min(1, "Localização inicial é obrigatória"),
  initialQuantity: z.number().min(1, "Quantidade deve ser maior que 0"),
});

// Types
interface MaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (materialData: Omit<Material, 'id' | 'locations'> & { id?: string }) => void;
  material?: Material | null;
  onAddInitialStock?: (materialId: string, locationId: string, quantity: number) => void;
}

interface FormState {
  name: string;
  category: string;
  status: Material['status'];
  description: string;
  initialLocation: string;
  initialQuantity: number | "";
  errors: Record<string, string>;
  isSubmitting: boolean;
}

type FormAction =
  | { type: 'RESET'; payload: { material?: Material | null } }
  | { type: 'UPDATE_FIELD'; payload: { field: keyof FormState; value: any } }
  | { type: 'SET_ERRORS'; payload: { errors: Record<string, string> } }
  | { type: 'SET_SUBMITTING'; payload: { isSubmitting: boolean } };

// Form reducer
const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'RESET':
      const material = action.payload.material;
      return {
        name: material?.name || "",
        category: material?.category || "",
        status: material?.status || "Disponível",
        description: material?.description || "",
        initialLocation: "",
        initialQuantity: "",
        errors: {},
        isSubmitting: false,
      };
    case 'UPDATE_FIELD':
      return {
        ...state,
        [action.payload.field]: action.payload.value,
        errors: {
          ...state.errors,
          [action.payload.field]: "", // Clear error when field changes
        },
      };
    case 'SET_ERRORS':
      return {
        ...state,
        errors: action.payload.errors,
      };
    case 'SET_SUBMITTING':
      return {
        ...state,
        isSubmitting: action.payload.isSubmitting,
      };
    default:
      return state;
  }
};

// Custom hook for form management
const useMaterialForm = (material?: Material | null) => {
  const [state, dispatch] = React.useReducer(formReducer, {
    name: "",
    category: "",
    status: "Disponível",
    description: "",
    initialLocation: "",
    initialQuantity: "",
    errors: {},
    isSubmitting: false,
  });

  // Reset form when material changes
  React.useEffect(() => {
    dispatch({ type: 'RESET', payload: { material } });
  }, [material]);

  const updateField = React.useCallback((field: keyof FormState, value: any) => {
    dispatch({ type: 'UPDATE_FIELD', payload: { field, value } });
  }, []);

  const setErrors = React.useCallback((errors: Record<string, string>) => {
    dispatch({ type: 'SET_ERRORS', payload: { errors } });
  }, []);

  const setSubmitting = React.useCallback((isSubmitting: boolean) => {
    dispatch({ type: 'SET_SUBMITTING', payload: { isSubmitting } });
  }, []);

  return {
    state,
    updateField,
    setErrors,
    setSubmitting,
  };
};

// Validation function
const validateForm = (data: Partial<FormState>, isEditing: boolean): Record<string, string> => {
  const errors: Record<string, string> = {};

  try {
    if (isEditing) {
      materialSchema.parse(data);
    } else {
      newMaterialSchema.parse(data);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        const path = err.path[0] as string;
        errors[path] = err.message;
      });
    }
  }

  return errors;
};

// Main component
export function MaterialDialog({ open, onOpenChange, onSave, material, onAddInitialStock }: MaterialDialogProps) {
  const { locations, refreshLocations } = useLocations();
  const { categories: materialCategories, refreshCategories } = useMaterialCategories();
  
  const { state, updateField, setErrors, setSubmitting } = useMaterialForm(material);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = React.useState(false);

  const isEditing = !!material;

  // Refresh data when dialog opens
  React.useEffect(() => {
    if (open) {
      refreshCategories();
      refreshLocations();
    }
  }, [open, refreshCategories, refreshLocations]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (state.isSubmitting) return;

    const formData = {
      name: state.name,
      category: state.category,
      status: state.status,
      description: state.description,
      initialLocation: state.initialLocation,
      initialQuantity: state.initialQuantity,
    };

    const validationErrors = validateForm(formData, isEditing);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);

    try {
      const materialData: Omit<Material, 'id' | 'locations'> & { id?: string } = {
        id: material?.id,
        name: state.name.trim(),
        category: state.category.trim(),
        status: state.status,
        description: state.description.trim() || undefined,
        quantity: material?.quantity || 0,
      };

      await onSave(materialData);
      
      if (!isEditing && state.initialLocation && state.initialQuantity && Number(state.initialQuantity) > 0) {
        onAddInitialStock?.(materialData.id || '', state.initialLocation, Number(state.initialQuantity));
      }
      
      showSuccess(isEditing ? "Material atualizado com sucesso!" : "Material adicionado com sucesso!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving material:", error);
      showError("Erro ao salvar material. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle category selection from manager
  const handleCategoryChange = React.useCallback((newCategoryName: string) => {
    updateField('category', newCategoryName);
    refreshCategories();
  }, [updateField, refreshCategories]);

  // Memoized options
  const categoryOptions = React.useMemo(() => 
    materialCategories.map((cat) => ({
      value: cat.name,
      label: cat.name,
    })), 
    [materialCategories]
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Material" : "Adicionar Novo Material"}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Atualize as informações do material."
                : "Preencha as informações para registrar um novo item no inventário. Para novos materiais, defina o estoque inicial."}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input 
                id="name" 
                value={state.name} 
                onChange={(e) => updateField('name', e.target.value)} 
                placeholder="Ex: Câmera Sony A7S III"
                aria-describedby={state.errors.name ? "name-error" : undefined}
                aria-invalid={!!state.errors.name}
              />
              {state.errors.name && (
                <p id="name-error" className="text-sm text-destructive" role="alert">
                  {state.errors.name}
                </p>
              )}
            </div>

            {/* Category Field */}
            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <div className="flex gap-2">
                <Select value={state.category} onValueChange={(value) => updateField('category', value)}>
                  <SelectTrigger className="flex-1" aria-describedby={state.errors.category ? "category-error" : undefined}>
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
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        type="button"
                        variant="outline" 
                        size="icon" 
                        onClick={() => setIsCategoryDialogOpen(true)}
                        aria-label="Gerenciar categorias"
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
              {state.errors.category && (
                <p id="category-error" className="text-sm text-destructive" role="alert">
                  {state.errors.category}
                </p>
              )}
            </div>

            {/* Status Field */}
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={state.status} onValueChange={(value) => updateField('status', value)}>
                <SelectTrigger aria-describedby={state.errors.status ? "status-error" : undefined}>
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
              {state.errors.status && (
                <p id="status-error" className="text-sm text-destructive" role="alert">
                  {state.errors.status}
                </p>
              )}
            </div>

            {/* Initial Location and Quantity (only for new materials) */}
            {!isEditing && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="initialLocation">Localização Inicial *</Label>
                  <Select value={state.initialLocation} onValueChange={(value) => updateField('initialLocation', value)}>
                    <SelectTrigger aria-describedby={state.errors.initialLocation ? "location-error" : undefined}>
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
                  {state.errors.initialLocation && (
                    <p id="location-error" className="text-sm text-destructive" role="alert">
                      {state.errors.initialLocation}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="initialQuantity">Quantidade Inicial *</Label>
                  <Input
                    id="initialQuantity"
                    type="number"
                    value={state.initialQuantity}
                    onChange={(e) => updateField('initialQuantity', e.target.value ? Number(e.target.value) : "")}
                    placeholder="Ex: 5"
                    min={1}
                    aria-describedby={state.errors.initialQuantity ? "quantity-error" : undefined}
                    aria-invalid={!!state.errors.initialQuantity}
                  />
                  {state.errors.initialQuantity && (
                    <p id="quantity-error" className="text-sm text-destructive" role="alert">
                      {state.errors.initialQuantity}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Description Field */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea 
                id="description" 
                value={state.description} 
                onChange={(e) => updateField('description', e.target.value)} 
                placeholder="Detalhes sobre o material..."
                rows={3}
                className="min-h-[80px] resize-y"
                aria-describedby={state.errors.description ? "description-error" : undefined}
              />
              {state.errors.description && (
                <p id="description-error" className="text-sm text-destructive" role="alert">
                  {state.errors.description}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={state.isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={state.isSubmitting || !state.name.trim() || !state.category.trim()}
              >
                {state.isSubmitting ? "Salvando..." : (isEditing ? "Atualizar" : "Adicionar")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Manager */}
      <MaterialCategoryManager 
        open={isCategoryDialogOpen} 
        onOpenChange={setIsCategoryDialogOpen} 
        onCategorySelected={handleCategoryChange}
      />
    </>
  );
}