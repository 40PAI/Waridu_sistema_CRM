import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import usePipelinePhases from "@/hooks/usePipelinePhases"; // Changed from usePipelineStages
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
import type { PipelinePhase } from "@/types"; // Import PipelinePhase type

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

const PipelinePhaseManager = () => { // Changed component name
  const { phases, addPhase, updatePhase, togglePhaseActive, reorderPhases, loading } = usePipelinePhases(); // Changed from stages
  const [newPhaseName, setNewPhaseName] = React.useState("");
  const [newPhaseColor, setNewPhaseColor] = React.useState<string>("#e5e7eb");
  const [editingPhase, setEditingPhase] = React.useState<PipelinePhase | null>(null); // Changed type
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [isReordering, setIsReordering] = React.useState(false);

  const [localPhases, setLocalPhases] = React.useState<PipelinePhase[]>([]); // Changed type

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Sync localPhases with upstream phases whenever phases change.
  // Skip sync while actively reordering to avoid clobbering drag state.
  React.useEffect(() => {
    if (!isReordering) {
      setLocalPhases((phases || []).map((p: any) => ({ ...p })));
    }
  }, [phases, isReordering]);

  const handleAddPhase = async () => {
    const name = newPhaseName.trim();
    if (!name) {
      showError("Nome da fase é obrigatório.");
      return;
    }
    setSaving(true);
    try {
      await addPhase(name, { color: newPhaseColor });
      setNewPhaseName("");
      setNewPhaseColor("#e5e7eb");
    } catch (err: any) {
      console.error("Add phase error:", err);
      showError(err?.message || "Erro ao adicionar fase.");
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (phase: PipelinePhase) => { // Changed type
    setEditingPhase({ ...phase });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    const name = editingPhase?.name?.trim();
    if (!editingPhase || !name) {
      showError("Nome da fase é obrigatório.");
      return;
    }
    setSaving(true);
    try {
      await updatePhase(editingPhase.id, name, { color: editingPhase.color });
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
      // Optimistic UI update: reflect change immediately
      setLocalPhases(prev => prev.map(p => p.id === id ? { ...p, active } : p));
      await togglePhaseActive(id, active);
      // fetchPhases inside hook will sync actual state; we already updated optimistically.
    } catch (err: any) {
      console.error("Toggle active error:", err);
      showError(err?.message || "Erro ao alterar status da fase.");
      // revert (best-effort) by re-syncing with upstream phases
      setLocalPhases((phases || []).map((p: any) => ({ ...p })));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    const oldIndex = localPhases.findIndex(s => String(s.id) === activeId);
    const newIndex = localPhases.findIndex(s => String(s.id) === overId);

    if (oldIndex === -1 || newIndex === -1) return;
    if (oldIndex === newIndex) return;

    const previous = [...localPhases];
    const next: PipelinePhase[] = arrayMove(previous, oldIndex, newIndex); // Changed type
    setLocalPhases(next);

    const orderedIds = next.map(s => s.id);

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
        <div className="flex w-full max-w-xl grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="space-y-1.5 md:col-span-2">
            <Label>Nome da nova fase</Label>
            <Input
              placeholder="Ex: Orçamento"
              value={newPhaseName}
              onChange={(e) => setNewPhaseName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddPhase()}
              disabled={loading || saving || isReordering}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Cor</Label>
            <Input type="color" value={newPhaseColor} onChange={(e) => setNewPhaseColor(e.target.value)} disabled={loading || saving || isReordering} />
          </div>
          <div className="md:col-span-3">
            <Button onClick={handleAddPhase} disabled={loading || saving || isReordering || !(newPhaseName.trim())}>
              <Plus className="h-4 w-4 mr-2" /> Adicionar
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={localPhases.map(s => s.id)} strategy={verticalListSortingStrategy}>
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
              <div className="space-y-2">
                <Label>Cor</Label>
                <Input
                  type="color"
                  value={editingPhase?.color ?? "#e5e7eb"}
                  onChange={(e) => setEditingPhase(prev => prev ? { ...prev, color: e.target.value } : prev)}
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