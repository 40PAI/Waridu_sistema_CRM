"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NewClientFormSchema, type NewClientForm, formToClientsInsert } from "@/utils/clientMappers";
import { showSuccess, showError } from "@/utils/toast";
import { useClients } from "@/hooks/useClients";

interface ClientFormProps {
  onSubmit: (data: NewClientForm) => Promise<void>;
  initialData?: Partial<NewClientForm>;
  loading?: boolean;
}

const SECTOR_OPTIONS = ["Tecnologia", "Financeiro", "Saúde", "Construção", "Educação", "Retail", "Outro"];
const LIFECYCLE_OPTIONS = ["Lead", "Oportunidade", "Cliente Ativo", "Cliente Perdido"];

const ClientForm: React.FC<ClientFormProps> = ({ onSubmit, initialData, loading }) => {
  const form = useForm<NewClientForm>({
    resolver: zodResolver(NewClientFormSchema),
    defaultValues: {
      fullName: initialData?.fullName || "",
      company: initialData?.company || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      nif: initialData?.nif || "",
      sector: initialData?.sector || "",
      lifecycleStage: initialData?.lifecycleStage || "Lead",
      roleOrDepartment: initialData?.roleOrDepartment || "",
      notes: initialData?.notes || "",
    },
  });

  const handleSubmit = async (data: NewClientForm) => {
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
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo *</FormLabel>
              <FormControl>
                <Input placeholder="Nome completo do cliente" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Empresa</FormLabel>
              <FormControl>
                <Input placeholder="Nome da empresa" {...field} />
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
          name="sector"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Setor</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o setor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SECTOR_OPTIONS.map((sector) => (
                    <SelectItem key={sector} value={sector}>
                      {sector}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lifecycleStage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ciclo de Vida</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o ciclo de vida" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {LIFECYCLE_OPTIONS.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="roleOrDepartment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Função na Empresa</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Diretor de TI, Gerente de Marketing" {...field} />
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


        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar Cliente"}
        </Button>
      </form>
    </Form>
  );
};

export default ClientForm;