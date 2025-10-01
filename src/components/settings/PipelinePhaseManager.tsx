import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import usePipelinePhases from "@/hooks/usePipelinePhases";
import { Edit, Plus, GripVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { showSuccess, showError } from "@/utils/toast";
import type { PipelinePhase } from "@/types";
import { useAutoId } from "@/hooks/useAutoId";

const SortablePhaseItem = ({ phase, onEdit, onToggleActive }: { phase: PipelinePhase; onEdit: (p: PipelinePhase) => void; onToggleActive: (id: string, active: boolean) => void; }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: phase.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between p-3 border-b last:border-b-0 bg-background",
        isDragging && "ring-2 ring-primary shadow-lg"
      )}
      role="listitem"
      aria-label={`Phase ${phase.name}`}
    >
      <div className="flex items-center gap-3 flex-1">
        <button {...listeners} {...attributes} className="cursor-grab text-muted-foreground hover:text-foreground" aria-label="Reordenar fase">
          <GripVertical className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{phase.name}</span>
            <Badge variant={phase.active ? "default" : "secondary"} className="text-xs">
              {phase.active ? "Ativa" : "Inativa"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button 
          type="button"
          variant="ghost" 
          size="icon" 
          className="h-8 w-8" 
          onClick={() => onEdit(phase)} 
          aria-label={`Editar ${phase.name}`}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Switch checked={phase.active} onCheckedChange={(v) => onToggleActive(phase.id, !!v)} aria-label={`Ativar ${phase.name}`} />
      </div>
    </div>
  );
};

const PipelinePhaseManager = () => {
  const { phases, addPhase, updatePhase, togglePhaseActive, reorderPhases, loading } = usePipelinePhases();
  
  // Generate unique IDs for form fields
  const getId = useAutoId('pipeline-phase-manager');
  
  // Ref for first field focus
  const firstFieldRef = React.useRef<HTMLInputElement>(null);
  
  const [newPhaseName, setNewPhaseName] = React.useState("");
  const [editingPhase, setEditingPhase] = React.useState<PipelinePhase | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [isReordering, setIsReordering] = React.useState(false);

  const [localPhases, setLocalPhases] = React.useState<PipelinePhase[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  React.useEffect(() => {
    setLocalPhases((prev) => {
      const prevIds = prev.map(p => p.id).join(",");
      const nextIds = (phases || []).map((p: any) => p.id).join(",");
      if (prevIds !== nextIds) {
        return (phases || []).map((p: any) => ({ ...p }));
      }
      return prev;
    });
  }, [phases]);

  const handleAddPhase = async () => {
    const name = newPhaseName.trim();
    if (!name) {
      showError("Nome da fase é obrigatório.");
      return;
    }
    setSaving(true);
    try {
      await addPhase(name);
      setNewPhaseName("");
    } catch (err: any) {
      console.error("Add phase error:", err);
      showError(err?.message || "Erro ao adicionar fase.");
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (phase: PipelinePhase) => {
    setEditingPhase({ ...phase });
    setIsEditDialogOpen(true);
    
    // Focus the edit input when dialog opens
    setTimeout(() => {
      const editInput = document.getElementById(getId('edit-name'));
      editInput?.focus();
    }, 100);
  };

  const handleSaveEdit = async () => {
    const name = editingPhase?.name?.trim();
    if (!editingPhase || !name) {
      showError("Nome da fase é obrigatório.");
      return;
    }
    setSaving(true);
    try {
      await updatePhase(editingPhase.id, name);
      setIsEditDialogOpen(false);
      setEditingPhase(null);
    } catch (err: any) {
      console.error("Update phase error:", err);
      showError(err?.message || "Erro ao atualizar fase.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await togglePhaseActive(id, active);
    } catch (err: any) {
      console.error("Toggle active error:", err);
      showError(err?.message || "Erro ao alterar status da fase.");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    const oldIndex = localPhases.findIndex(p => String(p.id) === activeId);
    const newIndex = localPhases.findIndex(p => String(p.id) === overId);

    if (oldIndex === -1 || newIndex === -1) return;
    if (oldIndex === newIndex) return;

    const previous = [...localPhases];
    const next: PipelinePhase[] = arrayMove(previous, oldIndex, newIndex);
    setLocalPhases(next);

    const orderedIds = next.map(p => p.id);

    setIsReordering(true);
    try {
      await reorderPhases(orderedIds);
      showSuccess("Ordem salva");
    } catch (err: any) {
      console.error("Reorder save failed:", err);
      setLocalPhases(previous);
      showError("Falha ao salvar ordem — revertendo.");
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração do Pipeline</CardTitle>
        <CardDescription>
          Gerencie as fases do pipeline de projetos. Arraste para reordenar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor={getId('new-phase')}>Nome da nova fase</Label>
            <Input
              id={getId('new-phase')}
              name="newPhaseName"
              autoComplete="off"
              placeholder="Ex: Orçamento"
              value={newPhaseName}
              onChange={(e) => setNewPhaseName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddPhase()}
              disabled={loading || saving || isReordering}
              ref={firstFieldRef}
            />
          </div>
          <Button 
            type="button"
            onClick={handleAddPhase} 
            disabled={loading || saving || isReordering || !(newPhaseName.trim())}
          >
            <Plus className="h-4 w-4 mr-2" /> Adicionar
          </Button>
        </div>

        <div className="rounded-md border">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={localPhases.map(p => p.id)} strategy={verticalListSortingStrategy}>
              {localPhases.length > 0 ? (
                localPhases.map((phase) => (
                  <SortablePhaseItem key={phase.id} phase={phase} onEdit={openEditDialog} onToggleActive={handleToggleActive} />
                ))
              ) : (
                <div className="p-4 text-sm text-muted-foreground text-center">Nenhuma fase configurada.</div>
              )}
            </SortableContext>
          </DndContext>
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent 
            role="dialog"
            aria-modal="true"
            aria-labelledby={getId('edit-title')}
          >
            <DialogHeader>
              <DialogTitle id={getId('edit-title')}>Editar Fase</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor={getId('edit-name')}>Nome da Fase</Label>
                <Input
                  id={getId('edit-name')}
                  name="editPhaseName"
                  autoComplete="off"
                  value={editingPhase?.name ?? ""}
                  onChange={(e) => setEditingPhase(prev => prev ? { ...prev, name: e.target.value } : prev)}
                  disabled={saving}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)} 
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button 
                type="button"
                onClick={handleSaveEdit} 
                disabled={saving || !editingPhase?.name?.trim()}
              >
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default PipelinePhaseManager;