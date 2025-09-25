"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { EventProject } from "@/types/crm";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { useEvents } from "@/hooks/useEvents";
import { useEmployees } from "@/hooks/useEmployees";
import usePipelineStages from "@/hooks/usePipelineStages";
import { showError, showSuccess } from "@/utils/toast";
import { MultiSelectServices } from "@/components/MultiSelectServices";

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const editProjectSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Nome do projeto é obrigatório"),
  client_id: z.string().min(1, "Cliente é obrigatório").refine((val) => UUID_REGEX.test(val), "ID do cliente inválido"),
  pipeline_phase_id: z.string().min(1, "Fase do pipeline é obrigatória").refine((val) => UUID_REGEX.test(val), "ID da fase inválido"),
  service_ids: z.array(z.string().refine((val) => UUID_REGEX.test(val), "ID do serviço inválido")).min(1, "Selecione pelo menos um serviço"),
  estimated_value: z.number().min(0, "Valor deve ser positivo").optional(),
  startDate: z.string().min(1, "Data de início é obrigatória"),
  endDate: z.string().optional(),
  location: z.string().optional(),
  status: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  responsible_id: z.string().min(1, "Responsável comercial é obrigatório").refine((v) => UUID_REGEX.test(v), "Selecione um responsável válido."),
}).refine((data) => {
  if (data.endDate && data.startDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, {
  message: "Data de fim deve ser posterior à data de início",
  path: ["endDate"],
});

type EditProjectFormData = z.infer<typeof editProjectSchema>;

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: EventProject | null;
  onSave?: (updatedProject: EventProject) => Promise<void>;
}

export function EditProjectDialog({ open, onOpenChange, project, onSave }: EditProjectDialogProps) {
  const { clients } = useClients();
  const { services } = useServices();
  const { updateEvent } = useEvents();
  const { employees } = useEmployees(); // Fetch all employees
  const { stages } = usePipelineStages();

  const [loading, setLoading] = React.useState(false);

  const editForm = useForm<EditProjectFormData>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: {
      id: 0,
      name: "",
      client_id: "",
      pipeline_phase_id: "",
      service_ids: [],
      estimated_value: undefined,
      startDate: "",
      endDate: "",
      location: "",
      status: "",
      tags: [],
      notes: "",
      responsible_id: "",
    },
  });

  React.useEffect(() => {
    if (open && project) {
      // Use pipeline_phase_id as primary, fallback to matching by pipeline_status
      let phaseId = project.pipeline_phase_id;
      if (!phaseId && project.pipeline_status) {
        const matchingStage = stages.find(s => s.name === project.pipeline_status);
        phaseId = matchingStage?.id;
      }

      const formData = {
        id: project.id,
        name: project.name,
        client_id: project.client_id || "",
        pipeline_phase_id: phaseId || "",
        service_ids: project.service_ids || [],
        estimated_value: project.estimated_value,
        startDate: project.startDate,
        endDate: project.endDate,
        location: project.location,
        status: project.status,
        tags: project.tags || [],
        notes: project.notes || "",
        responsible_id: (project as any).responsible_id || "",
      };
      editForm.reset(formData);
    }
  }, [open, project, editForm, stages]);

  // Show all active employees for the responsible dropdown
  const responsibleUserOptions = React.useMemo(() =>
    employees
      .filter(emp => emp.status === 'Ativo') // Only show active employees
      .map(emp => {
        const roleText = emp.role ? ` - ${emp.role}` : '';
        return {
          value: emp.id, // Use employee id
          label: `${emp.name}${roleText}`
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label))
  , [employees]);

  const pipelineStageOptions = React.useMemo(() =>
    stages.filter(s => s.is_active).map(s => ({ value: s.id, label: s.name }))
  , [stages]);

  const submit = async (data: EditProjectFormData) => {
    if (loading) return;
    setLoading(true);

    try {
      const updatedProject: EventProject = {
        id: data.id,
        name: data.name,
        client_id: data.client_id,
        pipeline_status: stages.find(s => s.id === data.pipeline_phase_id)?.name as any || "1º Contato",
        pipeline_phase_id: data.pipeline_phase_id,
        service_ids: data.service_ids,
        estimated_value: data.estimated_value,
        startDate: data.startDate,
        endDate: data.endDate,
        location: data.location,
        status: data.status,
        tags: data.tags,
        notes: data.notes,
        responsible_id: data.responsible_id,
      };

      // Call the hook updateEvent to persist to Supabase
      const result = await updateEvent({
        id: updatedProject.id,
        name: updatedProject.name,
        startDate: updatedProject.startDate,
        endDate: updatedProject.endDate,
        location: updatedProject.location,
        startTime: undefined,
        endTime: undefined,
        revenue: updatedProject.estimated_value,
        status: updatedProject.status,
        description: updatedProject.notes,
        roster: undefined,
        expenses: undefined,
        pipeline_phase_id: updatedProject.pipeline_phase_id, // Primary field
        estimated_value: updatedProject.estimated_value,
        service_ids: updatedProject.service_ids,
        client_id: updatedProject.client_id,
        notes: updatedProject.notes,
        tags: updatedProject.tags,
        responsible_id: updatedProject.responsible_id,
      } as any);

      if (!result) throw new Error("Falha ao atualizar projeto");

      if (onSave) {
        try {
          await onSave(updatedProject);
        } catch (parentError) {
          console.warn("Parent callback error:", parentError);
        }
      }

      showSuccess("Projeto atualizado com sucesso!");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving project:", error);
      showError(error?.message || "Erro ao atualizar projeto.");
    } finally {
      setLoading(false);
    }
  };

  const clientOptions = clients.map(c => ({ value: c.id, label: `${c.name} (${c.email})` }));

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Projeto: {project.name}</DialogTitle>
        </DialogHeader>

        <Form {...editForm}>
          <form onSubmit={editForm.handleSubmit(submit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Projeto *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex.: Evento BFA – Conferência" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clientOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={editForm.control}
                name="pipeline_phase_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fase do Pipeline *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {pipelineStageOptions.map(stage => (
                          <SelectItem key={stage.value} value={stage.value}>
                            {stage.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="responsible_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável Comercial *</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um responsável" />
                        </SelectTrigger>
                        <SelectContent>
                          {responsibleUserOptions.map(u => (
                            <SelectItem key={u.value} value={u.value}>
                              {u.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={editForm.control}
                name="estimated_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Estimado (AOA)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="service_ids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serviços Contratados *</FormLabel>
                    <FormControl>
                      <MultiSelectServices selected={field.value} onChange={field.onChange} placeholder="Selecione serviços..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={editForm.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Fim</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={editForm.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Local</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: CCTA, Talatona" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={editForm.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Observações, follow-up, urgências..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}