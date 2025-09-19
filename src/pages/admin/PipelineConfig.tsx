"use client";

import * as React from "react";
import { usePipelinePhases } from "@/hooks/usePipelinePhases";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { showError } from "@/utils/toast";

function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export default function PipelineConfigPage() {
  const { phases, loading, addPhase, updatePhase, reorderPhases, isAdmin } = usePipelinePhases();
  const [newName, setNewName] = React.useState("");
  const [newColor, setNewColor] = React.useState("#e5e7eb");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configuração do Pipeline</CardTitle>
          <CardDescription>Somente administradores podem gerenciar fases.</CardDescription>
        </CardHeader>
        <CardContent>Sem permissão.</CardContent>
      </Card>
    );
  }

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = phases.map(p => p.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...ids];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    reorderPhases(reordered);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuração do Pipeline</CardTitle>
          <CardDescription>Gerencie as fases do funil comercial (Kanban).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-[1fr_160px_auto]">
            <Input placeholder="Nome da nova fase" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <div className="flex items-center gap-2">
              <label className="text-sm">Cor</label>
              <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="h-9 w-14 p-0 border rounded" />
            </div>
            <Button onClick={() => {
              if (!newName.trim()) { showError("Informe um nome."); return; }
              addPhase(newName.trim(), newColor);
              setNewName("");
            }}>Adicionar Fase</Button>
          </div>

          <div className="rounded border p-2">
            {loading ? (
              <div className="p-4 text-sm text-muted-foreground">Carregando...</div>
            ) : (
              <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                <SortableContext items={phases.map(p => p.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {phases.map(phase => (
                      <SortableItem key={phase.id} id={phase.id}>
                        <div className="flex items-center justify-between p-2 border rounded bg-white dark:bg-gray-900">
                          <div className="flex items-center gap-3">
                            <div className="h-6 w-6 rounded" style={{ backgroundColor: phase.color || "#e5e7eb" }} />
                            <Input
                              value={phase.name}
                              onChange={(e) => updatePhase(phase.id, { name: e.target.value })}
                              className="max-w-[240px]"
                            />
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">Cor</span>
                              <input
                                type="color"
                                value={phase.color || "#e5e7eb"}
                                onChange={(e) => updatePhase(phase.id, { color: e.target.value })}
                                className="h-9 w-14 p-0 border rounded"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">Ativo</span>
                              <Switch checked={phase.active} onCheckedChange={(v) => updatePhase(phase.id, { active: Boolean(v) })} />
                            </div>
                          </div>
                        </div>
                      </SortableItem>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}