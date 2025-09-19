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
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { MultiSelectServices } from "@/components/MultiSelectServices";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { useEvents } from "@/hooks/useEvents";
import { useUsers } from "@/hooks/useUsers";
import { showError, showSuccess } from "@/utils/toast";

const pipelineStatuses = [
  "1º Contato",
  "Orçamento",
  "Negociação",
  "Confirmado",
  "Em andamento",
  "Cancelado",
  "Follow-up",
] as const;

const projectSchema = z.object({
  clientId: z.string().min(1, "Selecione um cliente"),
  name: z.string().min(1, "Nome do projeto é obrigatório"),
  serviceIds: z.array(z.string()).min(1, "Selecione ao menos um serviço"),
  pipelineStatus: z.enum(pipelineStatuses as unknown as [string, ...string[]]),
  date: z.string().min(1, "Data do evento é obrigatória"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  estimatedValue: z.preprocess((v) => (v === "" ? undefined : Number(v)), z.number().nonnegative().optional()),
  responsibleId: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof projectSchema>;

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

  const form = useForm<FormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      clientId: preselectedClientId || "",
      name: "",
      serviceIds: [],
      pipelineStatus: "1º Contato",
      date: new Date().toISOString().slice(0, 10),
      startTime: "",
      endTime: "",
      estimatedValue: undefined,
      responsibleId: "",
      notes: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      fetchClients();
      refreshUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = async (data: FormValues) => {
    try {
      // Build event payload consistent with useEvents.updateEvent expectation
      const payload: any = {
        name: data.name,
        start_date: data.date,
        end_date: data.date,
        start_time: data.startTime || null,
        end_time: data.endTime || null,
        location: undefined,
        revenue: data.estimatedValue ?? null,
        status: data.pipelineStatus === "Confirmado" ? "Planejado" : "Planejado",
        description: data.notes || null,
        pipeline_status: data.pipelineStatus,
        estimated_value: data.estimatedValue ?? null,
        service_ids: data.serviceIds,
        client_id: data.clientId,
        updated_at: new Date().toISOString(),
      };

      // use updateEvent which handles insert when id is absent
      const result: any = await updateEvent(payload as any);
      const createdId = result?.id ?? result?.data?.id ?? null;

      showSuccess("Projeto salvo com sucesso!");
      onOpenChange(false);
      if (onCreated && createdId) onCreated(createdId);
    } catch (err: any) {
      console.error("Erro ao criar projeto:", err);
      showError(err?.message || "Erro ao criar projeto.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Projeto</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">-- Selecionar --</SelectItem>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} {c.email ? `(${c.email})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Projeto</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do projeto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serviceIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serviços Contratados</FormLabel>
                  <FormControl>
                    <MultiSelectServices selected={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="pipelineStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status do Projeto</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {pipelineStatuses.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data do Evento</FormLabel>
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
                      <FormLabel>Horário Início</FormLabel>
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
                      <FormLabel>Horário Fim</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="estimatedValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Receita Estimada (AOA)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="responsibleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável Comercial</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione responsável" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">-- Nenhum --</SelectItem>
                          {users.map(u => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.first_name || u.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div /> {/* spacer */}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas / Reunião</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Notas da reunião ou observações" rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <div className="flex justify-end gap-2 w-full">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button type="submit">Criar Projeto</Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}