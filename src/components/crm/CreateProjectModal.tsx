"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
import { useUsers } from "@/hooks/useUsers";
import { useAuth } from "@/contexts/AuthContext";
import { showError, showSuccess } from "@/utils/toast";
import { Plus } from "lucide-react";
import CreateClientModal from "@/components/crm/CreateClientModal";
import { supabase } from "@/integrations/supabase/client";
import { usePipelinePhases } from "@/hooks/usePipelinePhases"; // Importar usePipelinePhases

// UUID regex for basic client/responsible validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const projectSchema = z.object({
  clientId: z.string().min(1, "Cliente é obrigatório").refine((v) => UUID_REGEX.test(v), "Selecione um cliente válido."),
  name: z.string().min(1, "Nome do projeto é obrigatório"),
  serviceIds: z.array(z.string()).min(1, "Selecione pelo menos um serviço"),
  pipelineStatus: z.string().min(1, "Status é obrigatório"),
  startDate: z.string().min(1, "Data de início é obrigatória"),
  startTime: z.string().min(1, "Hora de início é obrigatória"),
  endDate: z.string().min(1, "Data de fim é obrigatória"),
  endTime: z.string().min(1, "Hora de fim é obrigatória"),
  responsibleId: z.string().min(1, "Responsável comercial é obrigatório").refine((v) => UUID_REGEX.test(v), "Selecione um responsável válido."),
  location: z.string().min(1, "Local é obrigatório"),
  estimatedValue: z.number().min(0).optional(),
  notes: z.string().optional(),
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
  const { user } = useAuth();
  const { phases, loading: loadingPhases } = usePipelinePhases(); // Usar usePipelinePhases

  const [isCreateClientOpen, setIsCreateClientOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      clientId: preselectedClientId || "",
      name: "",
      serviceIds: [],
      pipelineStatus: "", // Será definido no useEffect
      startDate: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endDate: "",
      endTime: "",
      responsibleId: "", // Será definido no useEffect
      location: "",
      estimatedValue: undefined,
      notes: "",
    },
  });

  // Definir valores padrão para pipelineStatus e responsibleId
  React.useEffect(() => {
    if (open) {
      const defaultPipelineStatus = phases.length > 0 ? phases[0].name : "1º Contato";
      const defaultResponsibleId = users.find(u => u.role === 'Comercial')?.id || "";

      form.reset({
        clientId: preselectedClientId || "",
        name: "",
        serviceIds: [],
        pipelineStatus: defaultPipelineStatus,
        startDate: new Date().toISOString().split("T")[0],
        startTime: "09:00",
        endDate: "",
        endTime: "",
        responsibleId: defaultResponsibleId,
        location: "",
        estimatedValue: undefined,
        notes: "",
      });
    }
  }, [open, preselectedClientId, form, phases, users]); // Adicionar phases e users como dependências

  const clientOptions = React.useMemo(() => clients.map(c => ({ value: c.id, label: `${c.name} (${c.email || "sem email"})` })), [clients]);

  // Filtrar usuários para mostrar apenas 'Comercial' para o responsável
  const commercialUserOptions = React.useMemo(() => 
    users.filter(u => u.role === 'Comercial').map(u => ({ value: u.id, label: `${u.first_name || ""} ${u.last_name || ""} (${u.email || "sem email"})` }))
  , [users]);

  const handleSubmit = async (data: ProjectFormData) => {
    if (!data.pipelineStatus) {
      showError("Selecione uma fase do pipeline.");
      return;
    }

    setSaving(true);

    const startISO = toISO(data.startDate, data.startTime);
    const endISO = toISO(data.endDate, data.endTime);

    const payload: Record<string, any> = {
      name: data.name,
      start_date: startISO,
      end_date: endISO,
      start_time: data.startTime ? `${data.startTime}:00` : null,
      end_time: data.endTime ? `${data.endTime}:00` : null,
      location: data.location,
      pipeline_status: data.pipelineStatus,
      estimated_value: data.estimatedValue ?? null,
      service_ids: data.serviceIds,
      client_id: data.clientId,
      description: data.notes || null,
      status: "Planejado",
      updated_at: new Date().toISOString(),
      responsible_id: data.responsibleId,
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
                        <FormLabel>Cliente Associado *</FormLabel>
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
                        <FormLabel>Responsável Comercial *</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um usuário" />
                            </SelectTrigger>
                            <SelectContent>
                              {commercialUserOptions.map(u => ( // Usar commercialUserOptions
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
                        <FormLabel>Data de Fim *</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="endTime" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora de Fim *</FormLabel>
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
                        {(loadingPhases ? ["1º Contato", "Orçamento", "Negociação", "Confirmado"] : phases.map(p => p.name)).map((status) => ( // Usar phases.map(p => p.name)
                          <SelectItem key={status} value={status}>
                            {status}
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