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
import type { EventProject, PipelineStatus } from "@/types/crm";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { useEvents } from "@/hooks/useEvents";
import { useUsers } from "@/hooks/useUsers"; // Import useUsers
import { showError, showSuccess } from "@/utils/toast";
import { MultiSelectServices } from "@/components/MultiSelectServices"; // <-- added import

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const editProjectSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Nome do projeto é obrigatório"),
  client_id: z.string().min(1, "Cliente é obrigatório").refine((val) => UUID_REGEX.test(val), "ID do cliente inválido"),
  pipeline_status: z.enum(["1º Contato", "Orçamento", "Negociação", "Confirmado", "Cancelado"], { required_error: "Status é obrigatório" }),
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

const PIPELINE_STATUSES: PipelineStatus[] = [
  "1º Contato",
  "Orçamento",
  "Negociação",
  "Confirmado",
  "Cancelado",
];

export default function EditProjectDialog({ open, onOpenChange, project, onSave }: EditProjectDialogProps) {
  const { clients } = useClients();
  const { services } = useServices();
  const { updateEvent } = useEvents();
  const { users: allUsers } = useUsers(); // All users for general reference if needed
  const { users: commercialUsers } = useUsers('Comercial'); // Filter to only Comercial users for responsible dropdown

  const [form, setForm] = React.useState<Partial<EventProject>>({});
  const [loading, setLoading] = React.useState(false);

  const editForm = useForm<EditProjectFormData>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: {
      id: 0,
      name: "",
      client_id: "",
      pipeline_status: "1º Contato",
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
      const formData = {
        id: project.id,
        name: project.name,
        client_id: project.client_id || "",
        pipeline_status: project.pipeline_status || "1º Contato",
        service_ids: project.service_ids || [],
        estimated_value: project.estimated_value,
        startDate: project.startDate,
        endDate: project.endDate,
        location: project.location,
        status: project.status,
        tags: project.tags || [],
        notes: project.notes || "",
        responsible_id: (project as any).responsible_id || "", // Load existing responsible_id
      };
      setForm(formData);
      editForm.reset(formData);
    }
  }, [open, project, editForm]);

  const updateField = (key: keyof EventProject, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleService = (id: string) => {
    setForm((prev) => ({
      ...prev,
      service_ids: prev.service_ids?.includes(id)
        ? prev.service_ids.filter((s) => s !== id)
        : [...(prev.service_ids ?? []), id],
    }));
  };

  // Filter to only commercial users for the responsible dropdown
  const commercialUserOptions = React.useMemo(() => 
    commercialUsers.map(u => ({ value: u.id, label: `${u.first_name || ""} ${u.last_name || ""} (${u.email})` }))
  , [commercialUsers]);

  const submit = async (data: EditProjectFormData) => {
    if (loading) return; // Prevent double submission
    setLoading(true);

    try {
      const updatedProject: EventProject = {
        id: data.id,
        name: data.name,
        client_id: data.client_id,
        pipeline_status: data.pipeline_status,
        service_ids: data.service_ids,
        estimated_value: data.estimated_value,
        startDate: data.startDate,
        endDate: data.endDate,
        location: data.location,
        status: data.status,
        tags: data.tags,
        notes: data.notes,
        // cast to any to allow assignment; EventProject type augmented
        ...(data.responsible_id ? { responsible_id: data.responsible_id } : {}),
      };

      console.log("Updating project with data:", updatedProject);

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
        pipeline_status: updatedProject.pipeline_status,
        estimated_value: updatedProject.estimated_value,
        service_ids: updatedProject.service_ids,
        client_id: updatedProject.client_id,
        notes: updatedProject.notes,
        tags: updatedProject.tags,
        responsible_id: (updatedProject as any).responsible_id, // Save the responsible ID
        updated_at: new Date().toISOString(),
      } as any);

      if (!result) throw new Error("Falha ao atualizar projeto");

      // Optional parent callback
      if (onSave) {
        try {
          await onSave(updatedProject);
        } catch (parentError) {
          console.warn("Parent callback error:", parentError);
          // Don't fail the whole operation for parent callback errors
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
                name="pipeline_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PIPELINE_STATUSES.map(status => (
                          <SelectItem key={status} value={status}>
                            {status}
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
                          <SelectValue placeholder="Selecione um responsável com role 'Comercial' (UUID)" />
                        </SelectTrigger>
                        <SelectContent>
                          {commercialUserOptions.map(u => (
                            <SelectItem key={u.value} value={u.value}>
                              {u.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>

                    <p className="text-xs text-muted-foreground mt-1">
                      Escolha o responsável comercial da equipa; será enviado o seu id (UUID). Isto determina a pessoa que ficará como ponto de contacto comercial para este projeto. Apenas usuários com role 'Comercial' são mostrados.
                    </p>

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