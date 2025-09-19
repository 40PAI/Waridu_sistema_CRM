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

// Schema de validação com defaults e regras obrigatórias
const eventSchema = z.object({
  name: z.string().min(1, "Nome do evento é obrigatório"),
  startDate: z.string().min(1, "Data de início é obrigatória"),
  endDate: z.string().optional(),
  location: z.string().min(1, "Local do evento é obrigatório"),
  startTime: z.string().min(1, "Hora de início é obrigatória").regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato inválido (HH:MM)"),
  endTime: z.string().min(1, "Hora de fim é obrigatória").regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato inválido (HH:MM)"),
  revenue: z.number().optional().default(0),
  pipeline_status: z.string().optional(),
  estimated_value: z.number().optional().default(0),
  client_id: z.string().optional(),
  service_ids: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface CreateEventPageProps {
  onAddEvent: (event: { 
    name: string; 
    startDate: string; 
    endDate: string; 
    location: string;
    startTime: string;
    endTime: string;
    revenue?: number;
    pipeline_status?: string | null;
    estimated_value?: number;
    client_id?: string;
    service_ids?: string[];
    notes?: string;
  }) => Promise<void> | void;
}

const CreateEventPage = ({ onAddEvent }: CreateEventPageProps) => {
  const navigate = useNavigate();

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: "",
      startDate: new Date().toISOString().split('T')[0], // Data de hoje
      endDate: "",
      location: "",
      startTime: "09:00", // Default obrigatório
      endTime: "18:00",   // Default obrigatório
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
      // Garante que endDate não seja vazio (usa startDate se vazio)
      const endDate = data.endDate || data.startDate;

      await onAddEvent({
        name: data.name,
        startDate: data.startDate,
        endDate: endDate,
        location: data.location,
        startTime: data.startTime, // Sempre string válida
        endTime: data.endTime,     // Sempre string válida
        revenue: data.revenue || undefined,
        pipeline_status: data.pipeline_status || null,
        estimated_value: data.estimated_value || undefined,
        client_id: data.client_id || undefined,
        service_ids: data.service_ids || undefined,
        notes: data.notes || undefined,
      });

      showSuccess("Evento criado com sucesso!");
      
      // Navigate to pipeline if it's a commercial project, otherwise to roster management
      if (data.pipeline_status) {
        navigate("/crm/pipeline");
      } else {
        navigate("/roster-management");
      }
    } catch (error) {
      console.error("Error creating event:", error);
      showError("Erro ao criar evento. Verifique os campos e tente novamente.");
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Criar Novo Evento</CardTitle>
        <CardDescription>
          Preencha os detalhes abaixo para registrar um novo evento. Horários são obrigatórios e pré-definidos para facilitar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Evento *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Conferência Anual de Tecnologia" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FormField
                control={form.control}
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
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de Início * (default: 09:00)</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
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

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de Fim * (default: 18:00)</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Local do Evento *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Centro de Convenções, Luanda" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="revenue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receita Bruta do Evento (AOA)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ex: 50000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pipeline_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status Inicial (Pipeline)</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione se é um projeto comercial" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Não é projeto comercial</SelectItem>
                        <SelectItem value="1º Contato">1º Contato</SelectItem>
                        <SelectItem value="Orçamento">Orçamento</SelectItem>
                        <SelectItem value="Negociação">Negociação</SelectItem>
                        <SelectItem value="Confirmado">Confirmado</SelectItem>
                        <SelectItem value="Cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estimated_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Estimado (AOA)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ex: 30000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Cliente</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Empresa Acme" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="service_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IDs dos Serviços (separados por vírgula)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: service-1, service-2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações Adicionais</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Qualquer detalhe importante..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Criando..." : "Criar Evento"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CreateEventPage;