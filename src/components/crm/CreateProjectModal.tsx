"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Combobox } from "@/components/ui/combobox";
import { MultiSelectServices } from "@/components/MultiSelectServices";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { useEmployees } from "@/hooks/useEmployees";
import { useEvents } from "@/hooks/useEvents";
import { useAuth } from "@/contexts/AuthContext";
import { showError, showSuccess } from "@/utils/toast";
import { Plus } from "lucide-react";
import CreateClientModal from "@/components/crm/CreateClientModal";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// UUID regex for basic client/responsible validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const projectSchema = z.object({
  clientId: z.string().min(1, "Cliente é obrigatório").refine((v) => UUID_REGEX.test(v), "Selecione um cliente válido."),
  name: z.string().min(1, "Nome do projeto é obrigatório"),
  serviceIds: z.array(z.string()).min(1, "Selecione pelo menos um serviço"),
  pipelineStatus: z.enum(["1º Contato", "Orçamento", "Negociação", "Confirmado"], { required_error: "Status é obrigatório" }),
  startDate: z.string().min(1, "Data de início é obrigatória"),
  startTime: z.string().min(1, "Hora de início é obrigatória"),
  endDate: z.string().optional(),
  endTime: z.string().optional(),
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
  const { clients } = useClients();
  const { services } = useServices();
  const { employees } = useEmployees(); // allow selecting any employee
  const { updateEvent } = useEvents();
  const { user } = useAuth();

  const [isCreateClientOpen, setIsCreateClientOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      clientId: preselectedClientId || "",
      name: "",
      serviceIds: [],
      pipelineStatus: "1º Contato",
      startDate: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endDate: "",
      endTime: "",
      responsibleId: "",
      location: "",
      estimatedValue: undefined,
      notes: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        clientId: preselectedClientId || "",
        name: "",
        serviceIds: [],
        pipelineStatus: "1º Contato",
        startDate: new Date().toISOString().split("T")[0],
        startTime: "09:00",
        endDate: "",
        endTime: "",
        responsibleId: "",
        location: "",
        estimatedValue: undefined,
        notes: "",
      });
    }
  }, [open, preselectedClientId, form]);

  const clientOptions = React.useMemo(() => clients.map(c => ({ value: c.id, label: `${c.name} (${c.email || "sem email"})` })), [clients]);

  const employeeOptions = React.useMemo(() => employees.map(e => ({ value: e.id, label: `${e.name} (${e.email})` })), [employees]);

  const handleSubmit = async (data: ProjectFormData) => {
    if (!UUID_REGEX.test(data.clientId)) {
      showError("Cliente inválido. Selecione um cliente válido (UUID).");
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
      showSuccess("Projeto criado com sucesso!");
      onCreated?.(result.id);
      onOpenChange(false);
    } catch (err: any) {
      console.error("Erro ao criar projeto:", err);
      const msg = err?.message ?? String(err);
      if (/uuid/i.test(msg) || /client_id/i.test(msg)) {
        showError("Erro: client_id inválido (deve ser UUID).");
      } else if (/start_date|start_time|date/i.test(msg)) {
        showError("Erro nas datas/horas. Verifique os valores enviados.");
      } else if (/pipeline_status/i.test(msg)) {
        showError("Status do pipeline inválido.");
      } else if (/responsible_id/i.test(msg)) {
        showError("Responsável inválido. Selecione um funcionário válido.");
      } else {
        showError("Falha ao criar projeto: " + msg);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {/* constrain size so it doesn't occupy whole screen and make content horizontal */}
        <DialogContent className="max-w-6xl mx-auto max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Novo Projeto</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-4 pb-4">
            {/* Left: primary form */}
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
                              placeholder="Selecione um cliente (UUID)"
                              searchPlaceholder="Pesquisar cliente..."
                              className="flex-1"
                            />
                            <Button type="button" variant="outline" onClick={() => setIsCreateClientOpen(true)} title="Criar Novo Cliente">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </FormControl>
                        <p className="text-xs text-muted-foreground mt-1">
                          Selecione o cliente; o id (UUID) será enviado. Crie um novo cliente se necessário.
                        </p>
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
                              <SelectValue placeholder="Selecione um funcionário (qualquer um)" />
                            </SelectTrigger>
                            <SelectContent>
                              {employeeOptions.map(u => (
                                <SelectItem key={u.value} value={u.value}>
                                  {u.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <p className="text-xs text-muted-foreground mt-1">
                          Agora pode escolher qualquer funcionário como responsável comercial.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="startDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Início *</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="startTime" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora Início *</FormLabel>
                        <FormControl><Input type="time" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="endDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Fim</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="endTime" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora Fim</FormLabel>
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
                        <FormLabel>Valor Estimado (AOA)</FormLabel>
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

            {/* Right: services + pipeline + notes */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Serviços Contratados *</h3>
                <FormField control={form.control} name="serviceIds" render={({ field }) => (
                  <FormControl><MultiSelectServices selected={field.value} onChange={field.onChange} placeholder="Selecione serviços..." /></FormControl>
                )} />
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Status Inicial *</h3>
                <FormField control={form.control} name="pipelineStatus" render={({ field }) => (
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1º Contato">1º Contato</SelectItem>
                        <SelectItem value="Orçamento">Orçamento</SelectItem>
                        <SelectItem value="Negociação">Negociação</SelectItem>
                        <SelectItem value="Confirmado">Confirmado</SelectItem>
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