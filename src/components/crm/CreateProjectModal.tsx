"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Combobox } from "@/components/ui/combobox";
import { MultiSelectServices } from "@/components/MultiSelectServices";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { useEvents } from "@/hooks/useEvents";
import { useAuth } from "@/contexts/AuthContext";
import { showError, showSuccess } from "@/utils/toast";
import { Plus } from "lucide-react";
import CreateClientModal from "@/components/crm/CreateClientModal";
import usePipelineStages from "@/hooks/usePipelineStages";
import { useUsers } from "@/hooks/useUsers";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const projectSchema = z.object({
  clientId: z.string().min(1).refine((v) => UUID_REGEX.test(v), "client_id deve ser um UUID"),
  name: z.string().min(1),
  serviceIds: z.array(z.string()).min(1),
  startDate: z.string().min(1),
  startTime: z.string().min(1),
  endDate: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().min(1),
  estimatedValue: z.number().min(0).optional(),
  notes: z.string().optional(),
  pipelineStatus: z.string().min(1),
  responsibleId: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

function toISO(dateStr: string, timeStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm, ss] = (timeStr || "00:00:00").split(":").map((v) => Number(v));
  return new Date(Date.UTC(y, m - 1, d, hh || 0, mm || 0, ss || 0)).toISOString();
}

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (projectId: number) => void;
  preselectedClientId?: string;
}

export default function CreateProjectModal({ open, onOpenChange, onCreated, preselectedClientId }: CreateProjectModalProps) {
  const { clients, fetchClients } = useClients();
  const { services } = useServices();
  const { users, refreshUsers } = useUsers();
  const { updateEvent } = useEvents();
  const { stages } = usePipelineStages();

  const [isCreateClientOpen, setIsCreateClientOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      clientId: preselectedClientId || "",
      name: "",
      serviceIds: [],
      pipelineStatus: "",
      startDate: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endDate: "",
      endTime: "",
      location: "",
      estimatedValue: undefined,
      notes: "",
      responsibleId: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      const defaultPipelineStatus = stages && stages.length > 0 ? stages[0].id : "";
      const defaultResponsibleId = users.find(u => (u.role || "").toLowerCase() === "comercial")?.id || "";
      form.reset({
        clientId: preselectedClientId || "",
        name: "",
        serviceIds: [],
        pipelineStatus: defaultPipelineStatus,
        startDate: new Date().toISOString().split("T")[0],
        startTime: "09:00",
        endDate: "",
        endTime: "",
        location: "",
        estimatedValue: undefined,
        notes: "",
        responsibleId: defaultResponsibleId,
      });
    }
  }, [open, preselectedClientId, form, stages, users]);

  const clientOptions = React.useMemo(() => clients.map(c => ({ value: c.id, label: `${c.name} (${c.email || "sem email"})` })), [clients]);

  const commercialUserOptions = React.useMemo(() =>
    users.filter(u => (u.role || "").toLowerCase() === "comercial").map(u => ({ value: u.id, label: `${u.first_name || ""} ${u.last_name || ""} (${u.email || "sem email"})` }))
  , [users]);

  const pipelineOptions = React.useMemo(() => 
    stages.filter(s => s.is_active).map(s => ({ value: s.id, label: s.name }))
  , [stages]);

  const handleSubmit = async (data: ProjectFormData) => {
    if (!data.pipelineStatus) {
      showError("Selecione uma fase do pipeline.");
      return;
    }

    setSaving(true);

    const startISO = toISO(data.startDate, data.startTime);
    const endISO = data.endDate ? toISO(data.endDate, data.endTime || data.startTime) : startISO;

    const payload: Record<string, any> = {
      name: data.name,
      start_date: startISO,
      end_date: endISO,
      start_time: data.startTime ? `${data.startTime}:00` : null,
      end_time: data.endTime ? `${data.endTime}:00` : null,
      location: data.location,
      pipeline_stage_id: data.pipelineStatus, // Use stage ID
      estimated_value: data.estimatedValue ?? null,
      service_ids: data.serviceIds,
      client_id: data.clientId,
      description: data.notes || null,
      status: "Planejado",
      responsible_id: data.responsibleId || null,
      // NOTE: do NOT include updated_at/created_at here — DB triggers and central sanitizer manage timestamps.
    };

    try {
      const result = await updateEvent(payload as any);
      if (!result) throw new Error("Falha ao salvar evento");
      showSuccess("Projeto criado com sucesso");
      await fetchClients();
      await refreshUsers();
      onCreated?.(result.id);
      onOpenChange(false);
    } catch (err: any) {
      console.error("Erro ao criar projeto:", err);
      showError("Erro ao criar projeto. Verifique os campos e tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl mx-auto max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Novo Projeto</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-4 pb-4">
            <div className="space-y-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente *</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Combobox
                              options={clientOptions}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Selecione um cliente"
                              searchPlaceholder="Pesquisar cliente..."
                              className="flex-1"
                            />
                            <Button type="button" variant="outline" onClick={() => setIsCreateClientOpen(true)} title="Criar Novo Cliente">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Projeto *</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="responsibleId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsável Comercial</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um responsável" />
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
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="startDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Início *</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="startTime" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora de Início *</FormLabel>
                        <FormControl><Input type="time" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="endDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Fim</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="endTime" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora de Fim</FormLabel>
                        <FormControl><Input type="time" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="location" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Local *</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="estimatedValue" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Estimado</FormLabel>
                        <FormControl><Input type="number" {...field} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar Projeto"}</Button>
                  </div>
                </form>
              </Form>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Serviços de Interesse *</h3>
                <FormField control={form.control} name="serviceIds" render={({ field }) => (
                  <FormControl><MultiSelectServices selected={field.value} onChange={field.onChange} placeholder="Selecione serviços..." /></FormControl>
                )} />
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Status do Projeto *</h3>
                <FormField control={form.control} name="pipelineStatus" render={({ field }) => (
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {pipelineOptions.map((stage) => (
                          <SelectItem key={stage.value} value={stage.value}>
                            {stage.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                )} />
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Observações</h3>
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormControl><Textarea rows={8} {...field} /></FormControl>
                )} />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CreateClientModal open={isCreateClientOpen} onOpenChange={setIsCreateClientOpen} />
    </>
  );
}