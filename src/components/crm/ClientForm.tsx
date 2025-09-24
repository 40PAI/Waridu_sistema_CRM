"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { clientSchema, type ClientFormData } from "@/schemas/clientSchema";
import { showSuccess, showError } from "@/utils/toast";
import { useClients } from "@/hooks/useClients";
import { MultiSelectServices } from "@/components/MultiSelectServices";

interface ClientFormProps {
  onSubmit: (data: ClientFormData) => Promise<void>;
  initialData?: Partial<ClientFormData>;
  loading?: boolean;
}

const ClientForm: React.FC<ClientFormProps> = ({ onSubmit, initialData, loading }) => {
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: initialData?.name || "",
      nif: initialData?.nif || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      address: initialData?.address || "",
      notes: initialData?.notes || "",
      sector: initialData?.sector,
      persona: initialData?.persona,
      // service_ids: initialData?.service_ids || [], // Removed from defaultValues
    },
  });

  const handleSubmit = async (data: ClientFormData) => {
    try {
      await onSubmit(data);
      form.reset();
    } catch (error) {
      showError("Erro ao salvar cliente.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome *</FormLabel>
              <FormControl>
                <Input placeholder="Nome do cliente" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="cliente@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input placeholder="+244 999 999 999" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nif"
          render={({ field }) => (
            <FormItem>
              <FormLabel>NIF</FormLabel>
              <FormControl>
                <Input placeholder="Número de Identificação Fiscal" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Input placeholder="Endereço completo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sector"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Setor</FormLabel>
              <FormControl>
                <Input placeholder="Setor (ex: Tecnologia)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="persona"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Persona</FormLabel>
              <FormControl>
                <Input placeholder="Persona (ex: CEO)" {...field} />
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
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea placeholder="Notas sobre o cliente..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* MultiSelectServices is now managed outside the form schema */}
        {/* <FormField
          control={form.control}
          name="service_ids"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Serviços de Interesse</FormLabel>
              <FormControl>
                <MultiSelectServices selected={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        /> */}

        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar Cliente"}
        </Button>
      </form>
    </Form>
  );
};

export default ClientForm;