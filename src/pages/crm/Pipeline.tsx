"use client";

import * as React from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// --- UI (shadcn/ui) ---
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// --- Utils ---
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { showError, showSuccess } from "@/utils/toast";

// --- Hooks (substitua pelos seus reais) ---
import { useEvents } from "@/hooks/useEvents";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";

// --- Tipos ---
type PipelineStatus =
  | "1º Contato"
  | "Orçamento"
  | "Negociação"
  | "Confirmado"
  | "Cancelado";

type EventProject = {
  id: number;
  name: string;
  client_id?: string;
  pipeline_status: PipelineStatus;
  service_ids: string[];
  estimated_value?: number;
  startDate: string;
  endDate: string;
  location: string;
  status?: string;
  tags?: string[];
  notes?: string;
};

// --------------- Sortable Project Card ---------------
function SortableProjectCard({ project, onEditClick }: { project: EventProject; onEditClick?: (p: EventProject) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
    data: { type: "project", columnId: project.pipeline_status },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const badgeClass = getStatusBadge(project.pipeline_status);

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="border hover:shadow-md cursor-grab active:cursor-grabbing">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm truncate" title={project.name}>
              {project.name}
            </h3>
            <Badge className={badgeClass}>{project.pipeline_status}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            Início: {format(new Date(project.startDate), "dd/MM/yyyy", { locale: ptBR })}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="xs" onClick={() => onEditClick?.(project)}>
              Editar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --------------- Helpers ---------------
const columns = [
  { id: "1º Contato", title: "1º Contato", color: "bg-gray-100 border-gray-200" },
  { id: "Orçamento", title: "Orçamento", color: "bg-blue-100 border-blue-200" },
  { id: "Negociação", title: "Negociação", color: "bg-yellow-100 border-yellow-200" },
  { id: "Confirmado", title: "Confirmado", color: "bg-green-100 border-green-200" },
  { id: "Cancelado", title: "Cancelado", color: "bg-red-100 border-red-200" },
] satisfies { id: PipelineStatus; title: string; color: string }[];

const getStatusBadge = (status: PipelineStatus) => {
  switch (status) {
    case "1º Contato":
      return "bg-gray-100 text-gray-800";
    case "Orçamento":
      return "bg-blue-100 text-blue-800";
    case "Negociação":
      return "bg-yellow-100 text-yellow-800";
    case "Confirmado":
      return "bg-green-100 text-green-800";
    case "Cancelado":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

function DroppableColumn({ column, children, disabled }: { column: (typeof columns)[number]; children: React.ReactNode; disabled?: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "min-h-[600px] flex flex-col transition-all duration-200",
        column.color,
        isOver ? "ring-4 ring-primary shadow-2xl scale-105 bg-primary/10" : "",
        disabled ? "opacity-50 pointer-events-none" : ""
      )}
      style={{ minWidth: 280 }}
    >
      {children}
    </Card>
  );
}

const getOverColumnId = (over: DragOverEvent["over"]) => {
  if (!over) return null;
  if (columns.some((c) => c.id === over.id)) return String(over.id) as PipelineStatus;
  return (over.data?.current as any)?.sortable?.containerId ?? null;
};

// --------------- Pipeline Kanban (com update otimista) ---------------

function PipelineKanban({ projects, onUpdateProject }: { projects: EventProject[]; onUpdateProject: (p: EventProject) => Promise<void> }) {
  const [draggingProject, setDraggingProject] = React.useState<EventProject | null>(null);
  const [dragOverColumn, setDragOverColumn] = React.useState<PipelineStatus | null>(null);
  const [updating, setUpdating] = React.useState(false);
  const [localProjects, setLocalProjects] = React.useState<EventProject[]>(projects);

  React.useEffect(() => setLocalProjects(projects), [projects]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const projectsByColumn = React.useMemo(() => {
    const grouped: Record<PipelineStatus, EventProject[]> = {
      "1º Contato": [],
      Orçamento: [],
      Negociação: [],
      Confirmado: [],
      Cancelado: [],
    };
    localProjects.forEach((p) => grouped[p.pipeline_status]?.push(p));
    return grouped;
  }, [localProjects]);

  const handleDragStart = (event: any) => {
    const { active } = event;
    const project = localProjects.find((p) => p.id === active.id) ?? null;
    setDraggingProject(project);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const colId = getOverColumnId(event.over) as PipelineStatus | null;
    setDragOverColumn(colId);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggingProject(null);
    setDragOverColumn(null);
    if (!over || updating) return;

    const targetColumnId = getOverColumnId(over) as PipelineStatus | null;
    if (!targetColumnId) return;

    const project = localProjects.find((p) => p.id === Number(active.id));
    if (!project) return;

    // UI otimista
    setLocalProjects((prev) => prev.map((p) => (p.id === project.id ? { ...p, pipeline_status: targetColumnId } : p)));

    try {
      setUpdating(true);
      await onUpdateProject({ ...project, pipeline_status: targetColumnId });
      showSuccess(`Projeto "${project.name}" movido para "${targetColumnId}".`);
    } catch (e) {
      showError("Erro ao atualizar status do projeto.");
      // rollback
      setLocalProjects([...projects]);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-x-auto px-2" style={{ minHeight: 600 }}>
        {columns.map((column) => (
          <DroppableColumn key={column.id} column={column} disabled={updating}>
            <CardHeader className="pb-3 sticky top-0 bg-white dark:bg-gray-900 z-10 border-b border-border">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                {column.title}
                <span className="bg-white/80 px-2 py-1 rounded-full text-xs font-semibold">
                  {projectsByColumn[column.id].length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 flex-1 overflow-y-auto">
              <SortableContext items={projectsByColumn[column.id].map((p) => p.id)} strategy={verticalListSortingStrategy}>
                {projectsByColumn[column.id].map((project) => (
                  <div key={project.id} id={String(project.id)} className="mb-3">
                    <SortableProjectCard project={project} onEditClick={() => {}} />
                  </div>
                ))}
              </SortableContext>

              {projectsByColumn[column.id].length === 0 && dragOverColumn === column.id && (
                <div className="flex items-center justify-center h-20 border-2 border-dashed border-primary rounded-md text-primary font-medium bg-primary/5">
                  Solte aqui
                </div>
              )}
            </CardContent>
          </DroppableColumn>
        ))}
      </div>

      <DragOverlay>
        {draggingProject ? (
          <Card className="shadow-2xl p-3 bg-white rounded-md w-64 border-2 border-primary">
            <CardContent>
              <h3 className="font-semibold text-sm truncate">{draggingProject.name}</h3>
              <div className="text-xs text-muted-foreground">
                Início: {format(new Date(draggingProject.startDate), "dd/MM/yyyy", { locale: ptBR })}
              </div>
              <Badge className={getStatusBadge(draggingProject.pipeline_status)}>{draggingProject.pipeline_status}</Badge>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// --------------- Página Pipeline (Botão Novo Projeto + Dialog + Kanban) ---------------

export default function PipelinePage() {
  const { events, addEvent, updateEvent } = useEvents();
  const { clients } = useClients();
  const { services } = useServices();

  const [createOpen, setCreateOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);

  const handleCreate = async (payload: {
    name: string;
    client_id?: string;
    pipeline_status?: PipelineStatus;
    service_ids?: string[];
    estimated_value?: number;
    startDate: string;
    endDate: string;
    location?: string;
    notes?: string;
  }) => {
    try {
      setCreating(true);
      await addEvent({
        name: payload.name,
        startDate: payload.startDate,
        endDate: payload.endDate,
        location: payload.location || "",
        pipeline_status: payload.pipeline_status || "1º Contato",
        estimated_value: payload.estimated_value,
        service_ids: payload.service_ids || [],
        client_id: payload.client_id,
        notes: payload.notes || "",
      });
      showSuccess("Projeto criado com sucesso!");
      setCreateOpen(false);
    } catch (err: any) {
      console.error("Erro ao criar projeto:", err);
      showError(err?.message || "Erro ao criar projeto.");
      throw err;
    } finally {
      setCreating(false);
    }
  };

  // Filtrar apenas projetos com pipeline_status definido
  const projectsWithPipeline: EventProject[] = React.useMemo(() => {
    return events
      .filter((e) => !!e.pipeline_status)
      .map((e) => ({
        id: e.id,
        name: e.name ?? `Evento ${e.id}`,
        client_id: e.client_id,
        pipeline_status: (e.pipeline_status as PipelineStatus),
        service_ids: e.service_ids ?? [],
        estimated_value: e.estimated_value,
        startDate: e.startDate,
        endDate: e.endDate ?? e.startDate,
        location: e.location ?? "",
        status: e.status ?? "Planejado",
        tags: e.tags ?? [],
        notes: e.notes ?? "",
      }));
  }, [events]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pipeline de Projetos</h1>
        <div>
          <Button onClick={() => setCreateOpen(true)} disabled={creating}>
            <Plus className="h-4 w-4 mr-2" /> Novo Projeto
          </Button>
        </div>
      </div>

      <PipelineKanban
        projects={projectsWithPipeline}
        onUpdateProject={async (p) => {
          await updateEvent(p);
        }}
      />

      {/* Diálogo de criação (simplificado - extraia para componente separado se necessário) */}
      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        clients={clients}
        services={services}
        onCreate={handleCreate}
        loading={creating}
      />
    </div>
  );
}

// --------------- CreateProjectDialog (simplificado) ---------------

type CreatePayload = {
  name: string;
  client_id?: string;
  pipeline_status?: PipelineStatus;
  service_ids?: string[];
  estimated_value?: number;
  startDate: string;
  endDate: string;
  location?: string;
  notes?: string;
};

type CreateProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: { id: string; name: string }[];
  services: { id: string; name: string }[];
  onCreate: (payload: CreatePayload) => Promise<void>;
  loading?: boolean;
};

function CreateProjectDialog({ open, onOpenChange, clients, services, onCreate, loading }: CreateProjectDialogProps) {
  const [form, setForm] = React.useState<CreatePayload>({
    name: "",
    client_id: undefined,
    pipeline_status: "1º Contato",
    service_ids: [],
    estimated_value: undefined,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    location: "",
    notes: "",
  });

  const updateField = (key: keyof CreatePayload, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleService = (id: string) =>
    setForm((prev) => ({
      ...prev,
      service_ids: prev.service_ids?.includes(id)
        ? prev.service_ids.filter((s) => s !== id)
        : [...(prev.service_ids ?? []), id],
    }));

  const submit = async () => {
    if (!form.name) return showError("Nome do projeto é obrigatório");
    if (!form.client_id) return showError("Selecione um cliente");

    try {
      await onCreate({ ...form });
      onOpenChange(false);
      setForm({
        name: "",
        client_id: undefined,
        pipeline_status: "1º Contato",
        service_ids: [],
        estimated_value: undefined,
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date().toISOString().slice(0, 10),
        location: "",
        notes: "",
      });
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Projeto</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select onValueChange={(v) => updateField("client_id", v)} value={form.client_id ?? ""}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nome do Projeto</Label>
            <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Ex.: Evento BFA – Conferência" />
          </div>

          <div className="space-y-2">
            <Label>Status inicial</Label>
            <Select onValueChange={(v) => updateField("pipeline_status", v as PipelineStatus)} value={form.pipeline_status}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {columns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Receita estimada</Label>
            <Input type="number" value={form.estimated_value ?? ""} onChange={(e) => updateField("estimated_value", Number(e.target.value))} placeholder="0" />
          </div>

          <div className="space-y-2">
            <Label>Início</Label>
            <Input type="date" value={form.startDate} onChange={(e) => updateField("startDate", e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Fim</Label>
            <Input type="date" value={form.endDate} onChange={(e) => updateField("endDate", e.target.value)} />
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label>Serviços (selecione 1 ou mais)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {services.map((s) => (
                <label key={s.id} className="flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer">
                  <Checkbox checked={form.service_ids?.includes(s.id)} onCheckedChange={() => toggleService(s.id)} />
                  <span className="text-sm">{s.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Localização</Label>
            <Input value={form.location ?? ""} onChange={(e) => updateField("location", e.target.value)} placeholder="Ex.: CCTA, Talatona" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Notas</Label>
            <Textarea rows={3} value={form.notes ?? ""} onChange={(e) => updateField("notes", e.target.value)} placeholder="Observações, follow-up, urgências..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={submit} disabled={loading}>
            <Plus className="h-4 w-4 mr-2" /> Criar Projeto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}