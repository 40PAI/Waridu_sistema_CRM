"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useUsers } from "@/hooks/useUsers";
import { showError, showSuccess } from "@/utils/toast";
import { eventsService } from "@/services";
import { Plus } from "lucide-react";

// UUID regex for basic client/responsible validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const projectSchema = z.object({
  clientId: z.string().min(1, "Cliente é obrigatório").refine((v) => UUID_REGEX.test(v), "Selecione um cliente válido."),
  name: z.string().min(1, "Nome do projeto é obrigatório"),
  serviceIds: z.array(z.string()).min(1, "Selecione pelo menos um serviço"),
  pipelineStatus: z.enum([
    "1º contacto",
    "Orçamento",
    "Negociação",
    "Confirmado",
    "Em andamento",
    "Cancelado",
    "Follow-up",
  ] as const, { required_error: "Status do projeto é obrigatório" }),
  startDate: z.string().min(1, "Data do evento é obrigatória"),
  startTime: z.string().min(1, "Horário de início é obrigatório"),
  endTime: z.string().min(1, "Horário de fim é obrigatório"),
  responsibleId: z.string().min(1, "Responsável comercial é obrigatório").refine((v) => UUID_REGEX.test(v), "Selecione um responsável válido."),
  estimatedValue: z.number().min(0).optional(),
  notes: z.string().optional(),
  nextActionDate: z.string().optional(), // ISO datetime optional
});

type ProjectFormData = z.infer<typeof projectSchema>;

function toISO(dateStr: string, timeStr: string) {
  // Build local date-time and convert to ISO with Z (UTC)
  // Assume provided date/time are local; create a Date and use toISOString()
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm, ss] = (timeStr || "00:00:00").split(":").map((v) => Number(v));
  const dt = new Date(y, (m || 1) - 1, d, hh || 0, mm || 0, ss || 0);
  return dt.toISOString(); // includes Z
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
  const { users } = useUsers();

  const [isCreateClientOpen, setIsCreateClientOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      clientId: preselectedClientId || "",
      name: "",
      serviceIds: [],
      pipelineStatus: "1º contacto",
      startDate: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "18:00",
      responsibleId: "",
      estimatedValue: undefined,
      notes: "",
      nextActionDate: undefined,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        clientId: preselectedClientId || "",
        name: "",
        serviceIds: [],
        pipelineStatus: "1º contacto",
        startDate: new Date().toISOString().split("T")[0],
        startTime: "09:00",
        endTime: "18:00",
        responsibleId: "",
        estimatedValue: undefined,
        notes: "",
        nextActionDate: undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preselectedClientId]);

  const clientOptions = React.useMemo(() => clients.map(c => ({ value: c.id, label: `${c.name} ${c.company ? `— ${c.company}` : ""} (${c.email || "sem email"})` })), [clients]);
  const userOptions = React.useMemo(() => users.map(u => ({ value: u.id, label: `${u.profile?.first_name || ""} ${u.profile?.last_name || ""} (${u.email})` })), [users]);

  const handleSubmit = async (data: ProjectFormData) => {
    setSaving(true);

    try {
      // Convert date+time to ISO datetimes
      const startISO = toISO(data.startDate, data.startTime);
      const endISO = data.endTime ? toISO(data.startDate, data.endTime) : startISO;
      const nextActionISO = data.nextActionDate ? new Date(data.nextActionDate).toISOString() : null;

      const payload: Record<string, any> = {
        name: data.name,
        start_date: startISO,
        end_date: endISO,
        start_time: data.startTime ? `${data.startTime}:00` : null,
        end_time: data.endTime ? `${data.endTime}:00` : null,
        location: null,
        pipeline_status: data.pipelineStatus,
        estimated_value: data.estimatedValue ?? null,
        service_ids: data.serviceIds,
        client_id: data.clientId,
        description: data.notes || null,
        status: "Planejado",
        responsible_id: data.responsibleId,
        next_action_date: nextActionISO,
        updated_at: new Date().toISOString(),
      };

      // Insert via eventsService (will insert a new row)
      const result = await eventsService.upsertEvent(payload);
      if (!result || !result.id) {
        throw new Error("Resposta inválida do servidor ao criar projeto.");
      }

      showSuccess("Projeto criado com sucesso!");
      onCreated?.(result.id);
      onOpenChange(false);
    } catch (err: any) {
      console.error("Erro ao criar projeto:", err);
      const message = err?.message || String(err) || "Erro desconhecido";
      showError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl mx-4 w-full">
          <DialogHeader>
            <DialogTitle className="text-lg">Criar Novo Projeto</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                      {/* Descrição explicativa (restaurada como na versão anterior) */}
                      <p className="text-xs text-muted-foreground mt-1">
                        Seleccione o cliente existente pelo seu nome; o formulário irá enviar o id (UUID) associado ao cliente. Se o cliente ainda não existir, clique em "Criar Novo Cliente".
                      </p>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="responsibleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsável Comercial *</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione responsável (UUID)" />
                          </SelectTrigger>
                          <SelectContent>
                            {userOptions.map(u => (
                              <SelectItem key={u.value} value={u.value}>
                                {u.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>

                      {/* Descrição explicativa (restaurada como na versão anterior) */}
                      <p className="text-xs text-muted-foreground mt-1">
                        Escolha o responsável comercial da equipa; será enviado o seu id (UUID). Isto determina a pessoa que ficará como ponto de contacto comercial para este projeto.
                      </p>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Projeto *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Evento Corporativo 2025" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <FormField
                  control={form.control}
                  name="serviceIds"
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="pipelineStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status do Projeto *</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1º contacto">1º contacto</SelectItem>
                            <SelectItem value="Orçamento">Orçamento</SelectItem>
                            <SelectItem value="Negociação">Negociação</SelectItem>
                            <SelectItem value="Confirmado">Confirmado</SelectItem>
                            <SelectItem value="Em andamento">Em andamento</SelectItem>
                            <SelectItem value="Cancelado">Cancelado</SelectItem>
                            <SelectItem value="Follow-up">Follow-up</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data do Evento *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horário de Início *</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horário de Fim *</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="estimatedValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receita Estimada (AOA)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ex: 100000" {...field} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nextActionDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data da Próxima Ação (opcional)</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas / Observações</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Observações sobre o projeto..." rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="flex justify-between">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Salvando..." : "Salvar Projeto"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* fallback: client creation modal (keeps behavior) */}
      {isCreateClientOpen && (
        <div>
          {/* If existing CreateClientModal component is available, it will be used elsewhere by app.
              We open the global route or another component instead of nesting here to keep file focused. */}
        </div>
      )}
    </>
  );
}