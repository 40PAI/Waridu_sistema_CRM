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
import { Plus, Upload } from "lucide-react";
import CreateClientModal from "./CreateClientModal"; // Reuse existing modal

const projectSchema = z.object({
  clientId: z.string().min(1, "Cliente é obrigatório"),
  name: z.string().min(1, "Nome do projeto é obrigatório"),
  serviceIds: z.array(z.string()).min(1, "Selecione pelo menos um serviço"),
  startDate: z.string().min(1, "Data de início é obrigatória"),
  endDate: z.string().optional(),
  location: z.string().optional(),
  estimatedValue: z.number().optional(),
  notes: z.string().optional(),
  pipelineStatus: z.enum(["1º Contato", "Orçamento", "Negociação", "Confirmado"], { required_error: "Status inicial é obrigatório" }),
  responsibleId: z.string().optional(),
  nextAction: z.string().optional(),
  nextActionDate: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (projectId: number) => void;
  preselectedClientId?: string;
}

const PIPELINE_STATUSES = [
  { value: "1º Contato", label: "1º Contato" },
  { value: "Orçamento", label: "Orçamento" },
  { value: "Negociação", label: "Negociação" },
  { value: "Confirmado", label: "Confirmado" },
] as const;

export default function CreateProjectModal({ open, onOpenChange, onCreated, preselectedClientId }: CreateProjectModalProps) {
  const { clients, upsertClient } = useClients();
  const { services } = useServices();
  const { updateEvent } = useEvents();
  const { user } = useAuth();

  const [isCreateClientOpen, setIsCreateClientOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [saveAndCreateAnother, setSaveAndCreateAnother] = React.useState(false);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      clientId: preselectedClientId || "",
      name: "",
      serviceIds: [],
      startDate: "",
      endDate: "",
      location: "",
      estimatedValue: undefined,
      notes: "",
      pipelineStatus: "1º Contato",
      responsibleId: "",
      nextAction: "",
      nextActionDate: "",
    },
  });

  // Filter commercial users for responsible dropdown
  const commercialUsers = React.useMemo(() => {
    // Assuming we have a way to get users with role 'Comercial'
    // For now, placeholder - in real app, use a users hook
    return [
      { id: "user1", name: "João Silva", email: "joao@waridu.com" },
      { id: "user2", name: "Maria Santos", email: "maria@waridu.com" },
    ];
  }, []);

  const clientOptions = React.useMemo(() =>
    clients.map(c => ({ value: c.id, label: `${c.name} (${c.email})` })),
    [clients]
  );

  const handleCreateClient = async (clientData: any) => {
    try {
      const newClient = await upsertClient(clientData);
      form.setValue("clientId", newClient.id);
      setIsCreateClientOpen(false);
      showSuccess("Cliente criado com sucesso!");
    } catch (error) {
      showError("Erro ao criar cliente.");
    }
  };

  const onSubmit = async (data: ProjectFormData) => {
    setSaving(true);
    try {
      const eventPayload = {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate || data.startDate,
        location: data.location || "",
        description: data.notes || "",
        pipeline_status: data.pipelineStatus,
        estimated_value: data.estimatedValue,
        service_ids: data.serviceIds,
        client_id: data.clientId,
        status: "Planejado",
        // Optional fields
        responsible_id: data.responsibleId,
        next_action: data.nextAction,
        next_action_date: data.nextActionDate,
      };

      const result = await updateEvent(eventPayload as any);
      showSuccess("Projeto criado com sucesso!");

      onCreated?.(result.id);

      if (saveAndCreateAnother) {
        form.reset();
        setSaveAndCreateAnother(false);
      } else {
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error("Error creating project:", error);
      showError(error?.message || "Erro ao criar projeto.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndCreateAnother = async () => {
    setSaveAndCreateAnother(true);
    await form.handleSubmit(onSubmit)();
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
              {/* Cliente Associado */}
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente Associado *</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Combobox
                          options={clientOptions}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Selecione um cliente..."
                          searchPlaceholder="Buscar cliente..."
                          emptyMessage="Nenhum cliente encontrado."
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setIsCreateClientOpen(true)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nome do Projeto */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Projeto *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex.: Evento Corporativo 2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Serviços de Interesse */}
              <FormField
                control={form.control}
                name="serviceIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serviços de Interesse *</FormLabel>
                    <FormControl>
                      <MultiSelectServices
                        selected={field.value}
                        onChange={field.onChange}
                        placeholder="Selecione os serviços..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Datas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início Prevista *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                      <FormLabel>Data de Término Prevista</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Local e Orçamento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local do Evento/Projeto</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: Centro de Convenções, Luanda" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="estimatedValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Orçamento Estimado (AOA)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Status e Responsável */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pipelineStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status Inicial *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PIPELINE_STATUSES.map(status => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
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
                  name="responsibleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsável pelo Projeto</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o responsável" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {commercialUsers.map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Próxima Ação (opcional) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nextAction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Próxima Ação Agendada</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: Reunião de follow-up" {...field} />
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
                      <FormLabel>Data da Próxima Ação</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Observações */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detalhes adicionais sobre o projeto..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Upload de Anexos (placeholder) */}
              <div className="space-y-2">
                <Label>Upload de Anexos (Opcional)</Label>
                <div className="flex items-center gap-2">
                  <Input type="file" multiple className="hidden" id="attachments" />
                  <Label htmlFor="attachments" className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    <Upload className="h-4 w-4" />
                    Selecionar arquivos
                  </Label>
                </div>
              </div>

              <DialogFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleSaveAndCreateAnother} disabled={saving}>
                    Salvar e Criar Outro
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Sub-modal para criar cliente */}
      <CreateClientModal
        open={isCreateClientOpen}
        onOpenChange={setIsCreateClientOpen}
        onCreated={(clientId) => {
          form.setValue("clientId", clientId);
        }}
      />
    </>
  );
}