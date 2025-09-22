"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePipelinePhases } from "@/hooks/usePipelinePhases";
import { Edit, Plus, GripVertical } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast"; // Keep this import if needed for other toast functionalities, but not for success/error
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // Corrected: Added Card imports
import { showSuccess, showError } from "@/utils/toast"; // Corrected: Import showSuccess and showError

type PipelinePhase = {
  id: string;
  name: string;
  sort_order?: number;
  active: boolean;
  position?: number;
  updated_at?: string | null;
};

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
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(phase)} aria-label={`Editar ${phase.name}`}>
          <Edit className="h-4 w-4" />
        </Button>
        <Switch checked={phase.active} onCheckedChange={(v) => onToggleActive(phase.id, !!v)} aria-label={`Ativar ${phase.name}`} />
      </div>
    </div>
  );
};

const PipelinePhaseManager = () => {
  const { phases, addPhase, updatePhase, togglePhaseActive, reorderPhases, loading } = usePipelinePhases();
  // const { toast } = useToast ? useToast() : { toast: undefined }; // Removed as showSuccess/showError are used directly
  const [newPhaseName, setNewPhaseName] = React.useState("");
  const [editingPhase, setEditingPhase] = React.useState<PipelinePhase | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Local optimistic state
  const [localPhases, setLocalPhases] = React.useState<PipelinePhase[]>([]);

  // Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Sync phases into localPhases when phases change (and when not dragging)
  React.useEffect(() => {
    setLocalPhases((prev) => {
      // If lengths differ or ids differ, replace to ensure fresh
      const prevIds = prev.map(p => p.id).join(",");
      const nextIds = (phases || []).map((p: any) => p.id).join(",");
      if (prevIds !== nextIds) {
        return (phases || []).map((p: any) => ({ ...p }));
      }
      // otherwise keep prev (avoid clobbering optimistic during drag)
      return prev;
    });
  }, [phases]);

  const handleAddPhase = async () => {
    const name = newPhaseName?.trim();
    if (!name) return;
    setSaving(true);
    try {
      await addPhase(name);
      setNewPhaseName("");
    } catch (err: any) {
      console.error("Add phase error:", err);
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (phase: PipelinePhase) => {
    setEditingPhase({ ...phase });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    const name = editingPhase?.name?.trim();
    if (!editingPhase || !name) return;
    setSaving(true);
    try {
      await updatePhase(editingPhase.id, name);
      setIsEditDialogOpen(false);
      setEditingPhase(null);
    } catch (err: any) {
      console.error("Update phase error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await togglePhaseActive(id, active);
    } catch (err: any) {
      console.error("Toggle active error:", err);
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

    // optimistic UI update
    const previous = [...localPhases];
    const next: PipelinePhase[] = arrayMove(previous, oldIndex, newIndex);
    setLocalPhases(next);

    // Build orderedIds (use position order as persisted)
    const orderedIds = next.map(p => p.id);

    try {
      // Call hook to persist order (expects ordered ids)
      await reorderPhases(orderedIds);
      // success: optionally show toast
      showSuccess("Ordem salva"); // Corrected: Use showSuccess
    } catch (err: any) {
      console.error("Reorder save failed:", err);
      // rollback
      setLocalPhases(previous);
      showError("Falha ao salvar ordem — revertendo."); // Corrected: Use showError
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
            <Label>Nome da nova fase</Label>
            <Input
              placeholder="Ex: Orçamento"
              value={newPhaseName}
              onChange={(e) => setNewPhaseName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddPhase()}
              disabled={loading || saving}
            />
          </div>
          <Button onClick={handleAddPhase} disabled={loading || saving || !(newPhaseName?.trim())}>
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Fase</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Nome da Fase</Label>
                <Input
                  value={editingPhase?.name ?? ""}
                  onChange={(e) => setEditingPhase(prev => prev ? { ...prev, name: e.target.value } : prev)}
                  disabled={saving}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={saving}>Cancelar</Button>
              <Button onClick={handleSaveEdit} disabled={saving || !editingPhase?.name?.trim()}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default PipelinePhaseManager;