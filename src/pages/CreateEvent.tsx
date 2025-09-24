"use client";

import * as React from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { showSuccess, showError } from "@/utils/toast";

// Simple schema to validate key client-side required fields
const eventSchema = z.object({
  name: z.string().min(1, "Nome do evento é obrigatório"),
  startDate: z.string().min(1, "Data de início é obrigatória"),
  startTime: z.string().min(1, "Hora de início é obrigatória"),
  endDate: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().min(1, "Local é obrigatório"),
  revenue: z.number().optional(),
  pipeline_status: z.string().optional(),
  estimated_value: z.number().optional(),
  client_id: z.string().optional(),
  service_ids: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface CreateEventPageProps {
  onAddEvent: (payload: Record<string, any>) => Promise<void> | void;
}

function toISO(dateStr: string, timeStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm, ss] = (timeStr || "00:00:00").split(":").map((v) => Number(v));
  return new Date(Date.UTC(y, m - 1, d, hh || 0, mm || 0, ss || 0)).toISOString();
}

const CreateEventPage = ({ onAddEvent }: CreateEventPageProps) => {
  const navigate = useNavigate();

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      location: "",
      startTime: "09:00",
      endTime: "18:00",
      revenue: 0,
      pipeline_status: "",
      estimated_value: 0,
      client_id: "",
      service_ids: [],
      notes: "",
    },
  });

  const onSubmit = async (data: EventFormData) => {
    try {
      // Build snake_case payload and ISO datetimes
      const start_date = toISO(data.startDate, data.startTime);
      const end_date = data.endDate && data.endTime ? toISO(data.endDate, data.endTime) : start_date;

      const payload: Record<string, any> = {
        name: data.name,
        start_date,
        end_date,
        start_time: data.startTime ? `${data.startTime}:00` : null,
        end_time: data.endTime ? `${data.endTime}:00` : null,
        location: data.location,
        revenue: data.revenue ?? null,
        pipeline_status: data.pipeline_status || null,
        estimated_value: data.estimated_value ?? null,
        client_id: data.client_id || null,
        service_ids: data.service_ids || null,
        description: data.notes || null,
        status: "Planejado",
        updated_at: new Date().toISOString(),
      };

      // Basic client-side check for required fields (NOT NULL)
      if (!payload.name || !payload.start_date || !payload.start_time || !payload.location) {
        showError("Preencha todos os campos obrigatórios (nome, data/hora de início e local).");
        return;
      }

      await onAddEvent(payload);
      showSuccess("Evento criado!");
      if (data.pipeline_status) {
        navigate("/crm/pipeline");
      } else {
        navigate("/roster-management");
      }
    } catch (err: any) {
      console.error("CreateEvent error:", err);
      const msg = err?.message ?? String(err);
      if (/invalid uuid|client_id/i.test(msg)) {
        showError("client_id inválido — selecione um cliente existente.");
      } else if (/start_date|start_time|date/i.test(msg)) {
        showError("Erro nas datas/hora: verifique o formato.");
      } else {
        showError("Erro ao criar evento: " + msg);
      }
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Criar Novo Evento</CardTitle>
        <CardDescription>Preencha os detalhes abaixo.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Evento *</FormLabel>
                <FormControl><Input placeholder="Ex: Conferência" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid md:grid-cols-2 gap-4">
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

            <div className="grid md:grid-cols-2 gap-4">
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

            <FormField control={form.control} name="location" render={({ field }) => (
              <FormItem>
                <FormLabel>Local *</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid md:grid-cols-2 gap-4">
              <FormField control={form.control} name="estimated_value" render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Estimado (AOA)</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="pipeline_status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status Inicial</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Sem pipeline</SelectItem>
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
            </div>

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Observações</FormLabel>
                <FormControl><Textarea {...field} rows={3} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <Button type="submit">Criar Evento</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CreateEventPage;