"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePipelinePhases } from "@/hooks/usePipelinePhases";
import { Edit, Trash2, Plus, GripVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { PipelinePhase } from "@/types";
import { arrayMove } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";

interface SortablePhaseItemProps {
  phase: PipelinePhase;
  onEdit: (phase: PipelinePhase) => void;
  onToggleActive: (id: string, active: boolean) => void;
}

const SortablePhaseItem = ({ phase, onEdit, onToggleActive }: SortablePhaseItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: phase.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between p-3 border-b last:border-b-0 bg-background",
        isDragging && "ring-2 ring-primary-foreground shadow-lg"
      )}
    >
      <div className="flex items-center gap-3 flex-1">
        <button
          className="cursor-grab text-muted-foreground hover:text-foreground"
          {...listeners}
          {...attributes}
          aria-label="Reordenar fase"
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium">{phase.name}</span>
        <Badge variant={phase.active ? "default" : "secondary"}>
          {phase.active ? "Ativa" : "Inativa"}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(phase)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Switch
          checked={phase.active}
          onCheckedChange={(checked) => onToggleActive(phase.id, checked)}
          aria-label={`Toggle ${phase.name} active status`}
        />
      </div>
    </div>
  );
};

const PipelinePhaseManager = () => {
  const { phases, addPhase, updatePhase, togglePhaseActive, reorderPhases, loading } = usePipelinePhases();

  const [newPhaseName, setNewPhaseName] = React.useState("");
  const [editingPhase, setEditingPhase] = React.useState<PipelinePhase | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddPhase = async () => {
    if (!newPhaseName.trim()) return;
    setSaving(true);
    try {
      await addPhase(newPhaseName.trim());
      setNewPhaseName("");
    } catch (error) {
      // Error handled by hook
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (phase: PipelinePhase) => {
    setEditingPhase({ ...phase });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPhase || !editingPhase.name.trim()) return;
    setSaving(true);
    try {
      await updatePhase(editingPhase.id, editingPhase.name.trim());
      setIsEditDialogOpen(false);
      setEditingPhase(null);
    } catch (error) {
      // Error handled by hook
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await togglePhaseActive(id, active);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setPhases((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        reorderPhases(newOrder); // Persist new order
        return newOrder;
      });
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
          <Input
            placeholder="Nome da nova fase"
            value={newPhaseName}
            onChange={(e) => setNewPhaseName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddPhase()}
            disabled={loading || saving}
          />
          <Button onClick={handleAddPhase} disabled={loading || saving || !newPhaseName.trim()}>
            <Plus className="h-4 w-4 mr-2" /> Adicionar
          </Button>
        </div>

        <div className="rounded-md border divide-y">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">Carregando fases...</div>
          ) : phases.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={phases.map(p => p.id)} strategy={verticalListSortingStrategy}>
                {phases.map((phase) => (
                  <SortablePhaseItem
                    key={phase.id}
                    phase={phase}
                    onEdit={openEditDialog}
                    onToggleActive={handleToggleActive}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            <div className="p-4 text-sm text-muted-foreground text-center">Nenhuma fase configurada.</div>
          )}
        </div>
      </CardContent>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Fase</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-phase-name">Nome da Fase</Label>
              <Input
                id="edit-phase-name"
                value={editingPhase?.name || ""}
                onChange={(e) => setEditingPhase(prev => prev ? { ...prev, name: e.target.value } : null)}
                disabled={saving}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={saving || !editingPhase?.name.trim()}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PipelinePhaseManager;