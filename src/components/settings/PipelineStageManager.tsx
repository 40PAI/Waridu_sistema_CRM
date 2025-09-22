import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import usePipelineStages from "@/hooks/usePipelineStages";
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

const SortableStageItem = ({ stage, onEdit, onToggleActive }: { stage: any; onEdit: (s: any) => void; onToggleActive: (id: string, active: boolean) => void; }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage.id });
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
      aria-label={`Stage ${stage.name}`}
    >
      <div className="flex items-center gap-3 flex-1">
        <button {...listeners} {...attributes} className="cursor-grab text-muted-foreground hover:text-foreground" aria-label="Reordenar fase">
          <GripVertical className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{stage.name}</span>
            <Badge variant={stage.is_active ? "default" : "secondary"} className="text-xs">
              {stage.is_active ? "Ativa" : "Inativa"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(stage)} aria-label={`Editar ${stage.name}`}>
          <Edit className="h-4 w-4" />
        </Button>
        <Switch checked={stage.is_active} onCheckedChange={(v) => onToggleActive(stage.id, !!v)} aria-label={`Ativar ${stage.name}`} />
      </div>
    </div>
  );
};

const PipelineStageManager = () => {
  const { stages, addStage, updateStage, toggleStageActive, reorderStages, loading } = usePipelineStages();
  const [newStageName, setNewStageName] = React.useState("");
  const [editingStage, setEditingStage] = React.useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [isReordering, setIsReordering] = React.useState(false);

  const [localStages, setLocalStages] = React.useState<any[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  React.useEffect(() => {
    setLocalStages((prev) => {
      const prevIds = prev.map(p => p.id).join(",");
      const nextIds = (stages || []).map((s: any) => s.id).join(",");
      if (prevIds !== nextIds) {
        return (stages || []).map((s: any) => ({ ...s }));
      }
      return prev;
    });
  }, [stages]);

  const handleAddStage = async () => {
    const name = newStageName.trim();
    if (!name) {
      showError("Nome da fase é obrigatório.");
      return;
    }
    setSaving(true);
    try {
      const maxOrder = stages.reduce((m, s) => Math.max(m, s.order), 0);
      await addStage(name, maxOrder + 1);
      setNewStageName("");
    } catch (err: any) {
      console.error("Add stage error:", err);
      showError(err?.message || "Erro ao adicionar fase.");
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (stage: any) => {
    setEditingStage({ ...stage });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    const name = editingStage?.name?.trim();
    if (!editingStage || !name) {
      showError("Nome da fase é obrigatório.");
      return;
    }
    setSaving(true);
    try {
      await updateStage(editingStage.id, { name });
      setIsEditDialogOpen(false);
      setEditingStage(null);
    } catch (err: any) {
      console.error("Update stage error:", err);
      showError(err?.message || "Erro ao atualizar fase.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, is_active: boolean) => {
    try {
      await toggleStageActive(id, is_active);
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

    const oldIndex = localStages.findIndex(s => String(s.id) === activeId);
    const newIndex = localStages.findIndex(s => String(s.id) === overId);

    if (oldIndex === -1 || newIndex === -1) return;
    if (oldIndex === newIndex) return;

    const previous = [...localStages];
    const next: any[] = arrayMove(previous, oldIndex, newIndex);
    setLocalStages(next);

    const orderedIds = next.map(s => s.id);

    setIsReordering(true);
    try {
      await reorderStages(orderedIds);
      showSuccess("Ordem salva");
    } catch (err: any) {
      console.error("Reorder save failed:", err);
      setLocalStages(previous);
      showError("Falha ao salvar ordem — revertendo.");
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fases do Pipeline</CardTitle>
        <CardDescription>
          Gerencie as fases do pipeline de projetos. Arraste para reordenar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <div className="flex-1 space-y-1.5">
            <Label>Nome da nova fase</Label>
            <Input
              placeholder="Ex: Proposta Enviada"
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddStage()}
              disabled={loading || saving || isReordering}
            />
          </div>
          <Button onClick={handleAddStage} disabled={loading || saving || isReordering || !(newStageName.trim())}>
            <Plus className="h-4 w-4 mr-2" /> Adicionar
          </Button>
        </div>

        <div className="rounded-md border">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={localStages.map(s => s.id)} strategy={verticalListSortingStrategy}>
              {localStages.length > 0 ? (
                localStages.map((stage) => (
                  <SortableStageItem key={stage.id} stage={stage} onEdit={openEditDialog} onToggleActive={handleToggleActive} />
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
                  value={editingStage?.name ?? ""}
                  onChange={(e) => setEditingStage(prev => prev ? { ...prev, name: e.target.value } : prev)}
                  disabled={saving}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={saving}>Cancelar</Button>
              <Button onClick={handleSaveEdit} disabled={saving || !editingStage?.name?.trim()}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default PipelineStageManager;