"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MultiSelectServices } from "@/components/MultiSelectServices";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { useEmployees } from "@/hooks/useEmployees";
import { eventsService } from "@/services";
import { showError, showSuccess } from "@/utils/toast";
import CreateClientModal from "@/components/crm/CreateClientModal";
import { Plus } from "lucide-react";
import { usePipelinePhases } from "@/hooks/usePipelinePhases";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const projectSchema = z.object({
  clientId: z.string().min(1, "Cliente é obrigatório").refine((v) => UUID_REGEX.test(v), "Selecione um cliente válido."),
  name: z.string().min(1, "Nome do projeto é obrigatório"),
  serviceIds: z.array(z.string()).min(1, "Selecione pelo menos um serviço"),
  phaseName: z.string().min(1, "Selecione a fase"),
  startDate: z.string().min(1, "Data do evento é obrigatória"),
  startTime: z.string().min(1, "Horário de início é obrigatório"),
  endTime: z.string().optional(),
  responsibleId: z.string().min(1, "Responsável comercial é obrigatório").refine((v) => UUID_REGEX.test(v), "Selecione um responsável válido"),
  estimatedValue: z.number().min(0).optional(),
  notes: z.string().optional(),
  nextActionDate: z.string().optional(),
});

type FormValues = z.infer<typeof projectSchema>;

export default function CreateProjectTab({ preselectedClientId, onCreated }: { preselectedClientId?: string; onCreated?: (createdEvent: any) => void }) {
  const { clients } = useClients();
  const { services } = useServices();
  const { employees } = useEmployees();
  const { activePhases } = usePipelinePhases();

  const [isCreateClientOpen, setIsCreateClientOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      clientId: preselectedClientId || "",
      name: "",
      serviceIds: [],
      phaseName: activePhases[0]?.name || "",
      startDate: new Date().toISOString().slice(0, 10),
      startTime: "09:00",
      endTime: "",
      responsibleId: "",
      estimatedValue: undefined,
      notes: "",
      nextActionDate: undefined,
    },
  });

  React.useEffect(() => {
    if (preselectedClientId) form.setValue("clientId", preselectedClientId);
  }, [preselectedClientId, form]);

  React.useEffect(() => {
    // garantir que a fase default esteja selecionada quando lista carregar
    if (activePhases.length > 0 && !form.getValues("phaseName")) {
      form.setValue("phaseName", activePhases[0].name);
    }
  }, [activePhases, form]);

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const normalizeTime = (t?: string) => (t ? (t.length === 5 ? `${t}:00` : t) : null);
      const payload: any = {
        name: values.name,
        start_date: values.startDate,
        end_date: values.startDate,
        start_time: normalizeTime(values.startTime),
        end_time: normalizeTime(values.endTime),
        location: null,
        estimated_value: values.estimatedValue ?? null,
        service_ids: values.serviceIds,
        client_id: values.clientId,
        description: values.notes ?? null,
        status: values.phaseName,          // <- salva a fase no campo status
        responsible_id: values.responsibleId,
        next_action_date: values.nextActionDate ? new Date(values.nextActionDate).toISOString() : null,
      };

      const result = await eventsService.upsertEvent(payload);
      if (!result || !result.id) throw new Error("Resposta inválida do servidor");
      showSuccess("Projeto criado com sucesso e adicionado ao Pipeline.");
      form.reset();
      onCreated?.(result);
    } catch (err: any) {
      console.error("Erro criar projeto:", err);
      showError("Erro ao criar projeto. Por favor, verifique os campos e tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Criar Projeto</h2>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsCreateClientOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Novo Cliente
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Dados essenciais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="clientId">Cliente *</Label>
                <select id="clientId" {...form.register("clientId")} className="w-full rounded border px-3 py-2">
                  <option value="">Selecione um cliente</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `— ${c.company}` : ""} ({c.email || "sem email"})
                    </option>
                  ))}
                </select>
                <p className="text-sm text-destructive mt-1">{form.formState.errors.clientId?.message as string || ""}</p>
              </div>

              <div>
                <Label htmlFor="projectName">Nome do projeto *</Label>
                <Input id="projectName" {...form.register("name")} />
                <p className="text-sm text-destructive mt-1">{form.formState.errors.name?.message as string || ""}</p>
              </div>

              <div>
                <Label htmlFor="responsibleId">Responsável Comercial *</Label>
                <select id="responsibleId" {...form.register("responsibleId")} className="w-full rounded border px-3 py-2">
                  <option value="">Selecione responsável</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.email})
                    </option>
                  ))}
                </select>
                <p className="text-sm text-destructive mt-1">{form.formState.errors.responsibleId?.message as string || ""}</p>
              </div>

              <div>
                <Label htmlFor="phaseName">Fase *</Label>
                <select id="phaseName" {...form.register("phaseName")} className="w-full rounded border px-3 py-2">
                  {activePhases.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-destructive mt-1">{form.formState.errors.phaseName?.message as string || ""}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Evento</CardTitle>
              <CardDescription>Datas e valores</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="startDate">Data *</Label>
                  <Input id="startDate" type="date" {...form.register("startDate")} />
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.startDate?.message as string || ""}</p>
                </div>
                <div>
                  <Label htmlFor="startTime">Hora Início *</Label>
                  <Input id="startTime" type="time" {...form.register("startTime")} />
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.startTime?.message as string || ""}</p>
                </div>
              </div>

              <div>
                <Label htmlFor="endTime">Hora Fim</Label>
                <Input id="endTime" type="time" {...form.register("endTime")} />
              </div>

              <div>
                <Label htmlFor="estimatedValue">Receita Estimada (AOA)</Label>
                <Input id="estimatedValue" type="number" {...form.register("estimatedValue", { valueAsNumber: true })} />
              </div>

              <div>
                <Label htmlFor="nextActionDate">Próxima Ação (opcional)</Label>
                <Input id="nextActionDate" type="datetime-local" {...form.register("nextActionDate")} />
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Serviços & Notas</CardTitle>
              <CardDescription>Selecione os serviços e adicione notas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-1 font-medium text-sm">Serviços *</div>
                <div id="services">
                  <MultiSelectServices selected={form.getValues("serviceIds")} onChange={(v) => form.setValue("serviceIds", v)} />
                </div>
                <p className="text-sm text-destructive mt-1">{form.formState.errors.serviceIds?.message as string || ""}</p>
              </div>

              <div>
                <Label htmlFor="notes">Notas</Label>
                <Textarea id="notes" {...form.register("notes")} rows={4} />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => form.reset()} disabled={saving}>Cancelar</Button>
                <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar Projeto"}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>

      <CreateClientModal open={isCreateClientOpen} onOpenChange={setIsCreateClientOpen} />
    </>
  );
}