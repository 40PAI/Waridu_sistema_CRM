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
import { useAuth } from "@/contexts/AuthContext";
import { showError, showSuccess } from "@/utils/toast";
import { Plus } from "lucide-react";
import CreateClientModal from "@/components/crm/CreateClientModal";

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
  pipelineStatus: z.enum(["1º Contato", "Orçamento", "Negociação", "Confirmado"]),
});

type ProjectFormData = z.infer<typeof projectSchema>;

function toISO(dateStr: string, timeStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm, ss] = (timeStr || "00:00:00").split(":").map((v) => Number(v));
  return new Date(Date.UTC(y, m - 1, d, hh || 0, mm || 0, ss || 0)).toISOString();
}

export default function CreateProjectDialog({ open, onOpenChange, onCreated, preselectedClientId }: any) {
  const { clients } = useClients();
  const { services } = useServices();
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
      startDate: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endDate: "",
      endTime: "",
      location: "",
      estimatedValue: undefined,
      notes: "",
      pipelineStatus: "1º Contato",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        clientId: preselectedClientId || "",
        name: "",
        serviceIds: [],
        startDate: new Date().toISOString().split("T")[0],
        startTime: "09:00",
        endDate: "",
        endTime: "",
        location: "",
        estimatedValue: undefined,
        notes: "",
        pipelineStatus: "1º Contato",
      });
    }
  }, [open, preselectedClientId]);

  const clientOptions = React.useMemo(() => clients.map(c => ({ value: c.id, label: `${c.name} (${c.email || "sem email"})` })), [clients]);

  const onSubmit = async (data: ProjectFormData) => {
    if (!UUID_REGEX.test(data.clientId)) {
      showError("Cliente inválido. Selecione um cliente válido (UUID).");
      return;
    }
    setSaving(true);

    const start_date = toISO(data.startDate, data.startTime);
    const end_date = data.endDate && data.endTime ? toISO(data.endDate, data.endTime) : start_date;

    const payload: Record<string, any> = {
      name: data.name,
      start_date,
      end_date,
      start_time: data.startTime ? `${data.startTime}:00` : null,
      end_time: data.endTime ? `${data.endTime}:00` : null,
      location: data.location,
      pipeline_status: data.pipelineStatus,
      estimated_value: data.estimatedValue ?? null,
      service_ids: data.serviceIds,
      client_id: data.clientId,
      description: data.notes ?? null,
      status: "Planejado",
      updated_at: new Date().toISOString(),
    };

    try {
      const result = await updateEvent(payload as any);
      if (!result) throw new Error("Nenhuma resposta do servidor");
      showSuccess("Projeto criado");
      onCreated?.(result.id);
      onOpenChange(false);
    } catch (err: any) {
      console.error("Erro criar projeto:", err);
      const msg = err?.message ?? String(err);
      if (/uuid/i.test(msg) || /client_id/i.test(msg)) {
        showError("Erro: client_id inválido (deve ser UUID).");
      } else if (/start_date|start_time|date/i.test(msg)) {
        showError("Erro nas datas/horas. Verifique os valores enviados.");
      } else if (/pipeline_status/i.test(msg)) {
        showError("Status do pipeline inválido.");
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
        <DialogContent className="max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Projeto</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente *</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Combobox options={clientOptions} value={field.value} onChange={field.onChange} placeholder="Selecione um cliente..." />
                        <Button type="button" variant="outline" size="icon" onClick={() => setIsCreateClientOpen(true)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="serviceIds" render={({ field }) => (
                <FormItem>
                  <FormLabel>Serviços *</FormLabel>
                  <FormControl><MultiSelectServices selected={field.value} onChange={field.onChange} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

              <FormField control={form.control} name="pipelineStatus" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
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
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl><Textarea rows={3} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
                <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <CreateClientModal open={isCreateClientOpen} onOpenChange={setIsCreateClientOpen} />
    </>
  );
}