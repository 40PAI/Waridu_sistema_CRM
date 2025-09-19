"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { useEmployees } from "@/hooks/useEmployees";
import { showSuccess, showError } from "@/utils/toast";
import { MultiSelectServices } from "@/components/MultiSelectServices";
import { eventsService } from "@/services";
import { Plus } from "lucide-react";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const schema = z.object({
  clientId: z.string().min(1, "Cliente é obrigatório").refine((v) => UUID_REGEX.test(v), "Selecione um cliente válido"),
  name: z.string().min(1, "Nome do projeto é obrigatório"),
  serviceIds: z.array(z.string()).min(1, "Selecione ao menos um serviço"),
  pipelineStatus: z.enum(["1º Contato", "Orçamento", "Negociação", "Confirmado", "Em andamento", "Cancelado", "Follow-up"]),
  startDate: z.string().min(1, "Data é obrigatória"),
  startTime: z.string().min(1, "Hora de início é obrigatória"),
  endTime: z.string().min(1, "Hora de fim é obrigatória"),
  responsibleId: z.string().min(1, "Responsável é obrigatório").refine((v) => UUID_REGEX.test(v), "Selecione um responsável válido"),
  estimatedValue: z.number().nonnegative().nullable().optional(),
  notes: z.string().optional(),
  nextActionAt: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

function toISO(dateStr: string, timeStr: string) {
  // assume local date/time, convert to ISO with timezone 'Z' (UTC)
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm, ss] = (timeStr || "00:00:00").split(":").map((v) => Number(v));
  return new Date(Date.UTC(y, m - 1, d, hh || 0, mm || 0, ss || 0)).toISOString();
}

export default function NewProjectTab({ onCreated }: { onCreated?: (id: number) => void }) {
  const { clients } = useClients();
  const { services } = useServices();
  const { employees } = useEmployees();

  const clientOptions = React.useMemo(() => clients.map((c) => ({ id: c.id, label: `${c.name} ${c.email ? `(${c.email})` : ""}` })), [clients]);
  const serviceOptions = React.useMemo(() => services.map((s) => ({ id: s.id, label: s.name })), [services]);
  const employeeOptions = React.useMemo(() => employees.map((e) => ({ id: e.id, label: `${e.name} ${e.email ? `(${e.email})` : ""}` })), [employees]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientId: "",
      name: "",
      serviceIds: [],
      pipelineStatus: "1º Contato",
      startDate: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "17:00",
      responsibleId: "",
      estimatedValue: undefined,
      notes: "",
      nextActionAt: undefined,
    },
  });

  const [submitting, setSubmitting] = React.useState(false);

  const handleSave = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const start_iso = toISO(values.startDate, values.startTime);
      const end_iso = toISO(values.startDate, values.endTime);
      const nextAction = values.nextActionAt ? new Date(values.nextActionAt).toISOString() : null;

      const payload: any = {
        name: values.name,
        start_date: start_iso,
        end_date: end_iso,
        start_time: values.startTime ? `${values.startTime}:00` : null,
        end_time: values.endTime ? `${values.endTime}:00` : null,
        location: null,
        pipeline_status: values.pipelineStatus,
        estimated_value: values.estimatedValue ?? null,
        service_ids: values.serviceIds,
        client_id: values.clientId,
        description: values.notes ?? null,
        status: "Planejado",
        next_action_date: nextAction,
        updated_at: new Date().toISOString(),
        responsible_id: values.responsibleId,
      };

      const res = await eventsService.upsertEvent(payload);
      if (!res) throw new Error("Resposta inválida do servidor");
      showSuccess("Projeto criado com sucesso.");
      onCreated?.(res.id);
      form.reset();
    } catch (err: any) {
      console.error("Erro salvar projeto:", err);
      showError(err?.message || "Falha ao criar projeto. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-md shadow-sm p-4">
        <h3 className="text-lg font-semibold mb-3">Novo Projeto</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <FormField control={form.control} name="clientId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente *</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="w-full border rounded px-2 py-2"
                    >
                      <option value="">-- selecione um cliente --</option>
                      {clientOptions.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </FormControl>
                  <div className="flex items-center justify-between mt-1">
                    <FormMessage />
                    <button type="button" className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1" onClick={() => window?.alert("Abra o modal 'Criar Novo Cliente' (funcionalidade existente).")}>
                      <Plus className="h-4 w-4" /> Criar Novo Cliente
                    </button>
                  </div>
                </FormItem>
              )} />

              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Projeto *</FormLabel>
                  <FormControl><Input placeholder="Ex: Conferência Anual" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="serviceIds" render={({ field }) => (
                <FormItem>
                  <FormLabel>Serviços Contratados *</FormLabel>
                  <FormControl>
                    <MultiSelectServices selected={field.value} onChange={field.onChange} placeholder="Selecione serviços..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="pipelineStatus" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status do Projeto *</FormLabel>
                    <FormControl>
                      <select {...field} className="w-full border rounded px-2 py-2">
                        <option>1º Contato</option>
                        <option>Orçamento</option>
                        <option>Negociação</option>
                        <option>Confirmado</option>
                        <option>Em andamento</option>
                        <option>Cancelado</option>
                        <option>Follow-up</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="responsibleId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável Comercial *</FormLabel>
                    <FormControl>
                      <select {...field} className="w-full border rounded px-2 py-2">
                        <option value="">-- selecione um funcionário --</option>
                        {employeeOptions.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="startDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data do Evento *</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="startTime" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário de Início *</FormLabel>
                      <FormControl><Input type="time" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="endTime" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário de Fim *</FormLabel>
                      <FormControl><Input type="time" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              <FormField control={form.control} name="estimatedValue" render={({ field }) => (
                <FormItem>
                  <FormLabel>Receita Estimada (opcional)</FormLabel>
                  <FormControl><Input type="number" placeholder="Ex: 300000" {...field} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="nextActionAt" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data da Próxima Ação (opcional)</FormLabel>
                  <FormControl><Input type="datetime-local" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas / Observações (opcional)</FormLabel>
                  <FormControl><Textarea placeholder="Observações..." rows={5} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => form.reset()}>Cancelar</Button>
                <Button type="submit" disabled={submitting}>{submitting ? "Aguarde..." : "Salvar Projeto"}</Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}