"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { showError, showSuccess } from "@/utils/toast";
import type { CreatePayload, PipelineStatus, Client, Service } from "@/types/crm";
import { useClients } from "@/hooks/useClients";
import { useEvents } from "@/hooks/useEvents";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  services: Service[];
  onCreate: (payload: CreatePayload) => Promise<void>;
  preselectedClientId?: string;
}

const PIPELINE_STATUSES: PipelineStatus[] = [
  "1º Contato",
  "Orçamento",
  "Negociação",
  "Confirmado",
  "Cancelado",
];

export function CreateProjectDialog({ open, onOpenChange, clients, services, onCreate, preselectedClientId }: CreateProjectDialogProps) {
  const { clients: allClients } = useClients();
  const { updateEvent } = useEvents();

  const [form, setForm] = React.useState<CreatePayload>({
    name: "",
    client_id: preselectedClientId || "",
    pipeline_status: "1º Contato",
    service_ids: [],
    estimated_value: undefined,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    startTime: "",
    endTime: "",
    location: "",
    notes: "",
  });

  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setForm({
        name: "",
        client_id: preselectedClientId || "",
        pipeline_status: "1º Contato",
        service_ids: [],
        estimated_value: undefined,
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date().toISOString().slice(0, 10),
        startTime: "",
        endTime: "",
        location: "",
        notes: "",
      });
    }
  }, [open, preselectedClientId]);

  const updateField = (key: keyof CreatePayload, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleService = (id: string) =>
    setForm((prev) => ({
      ...prev,
      service_ids: prev.service_ids?.includes(id)
        ? prev.service_ids.filter((s) => s !== id)
        : [...(prev.service_ids ?? []), id],
    }));

  const submit = async () => {
    if (!form.name?.trim()) return showError("Nome do projeto é obrigatório");
    if (!form.client_id) return showError("Selecione um cliente");
    if (!form.service_ids?.length) return showError("Selecione pelo menos um serviço");

    setLoading(true);
    try {
      // Create event with pipeline_status
      const eventPayload = {
        name: form.name,
        startDate: form.startDate,
        endDate: form.endDate,
        startTime: form.startTime,
        endTime: form.endTime,
        location: form.location,
        description: form.notes,
        pipeline_status: form.pipeline_status,
        estimated_value: form.estimated_value,
        service_ids: form.service_ids,
        client_id: form.client_id,
        status: "Planejado", // Default operational status
      };

      await updateEvent(eventPayload as any);
      showSuccess("Projeto criado com sucesso!");
      onOpenChange(false);
    } catch (error) {
      showError("Erro ao criar projeto.");
    } finally {
      setLoading(false);
    }
  };

  const clientOptions = allClients.map(c => ({ value: c.id, label: `${c.name} (${c.email})` }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Projeto</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Row 1: Nome do Projeto and Cliente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Nome do Projeto *</Label>
              <Input id="project-name" value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Ex.: Evento BFA – Conferência" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-id">Cliente *</Label>
              {preselectedClientId ? (
                <Input value={clients.find(c => c.id === preselectedClientId)?.name || "Cliente não encontrado"} disabled />
              ) : (
                <Select value={form.client_id} onValueChange={(v) => updateField("client_id", v)}>
                  <SelectTrigger id="client-id">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                    {clientOptions.length === 0 && (
                      <SelectItem value="" disabled>
                        Nenhum cliente encontrado. Crie um cliente primeiro.
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Row 2: Status and Receita Estimada */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pipeline-status">Status Inicial *</Label>
              <Select value={form.pipeline_status} onValueChange={(v) => updateField("pipeline_status", v as PipelineStatus)}>
                <SelectTrigger id="pipeline-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PIPELINE_STATUSES.map(status => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimated-value">Receita Estimada (AOA)</Label>
              <Input id="estimated-value" type="number" value={form.estimated_value ?? ""} onChange={(e) => updateField("estimated_value", Number(e.target.value))} placeholder="0" />
            </div>
          </div>

          {/* Row 3: Datas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Data de Início *</Label>
              <Input id="start-date" type="date" value={form.startDate} onChange={(e) => updateField("startDate", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Data de Fim</Label>
              <Input id="end-date" type="date" value={form.endDate} onChange={(e) => updateField("endDate", e.target.value)} />
            </div>
          </div>

          {/* Row 4: Horas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Hora de Início</Label>
              <Input id="start-time" type="time" value={form.startTime || ""} onChange={(e) => updateField("startTime", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">Hora de Fim</Label>
              <Input id="end-time" type="time" value={form.endTime || ""} onChange={(e) => updateField("endTime", e.target.value)} />
            </div>
          </div>

          {/* Row 5: Local */}
          <div className="space-y-2">
            <Label htmlFor="location">Local</Label>
            <Input id="location" value={form.location ?? ""} onChange={(e) => updateField("location", e.target.value)} placeholder="Ex.: CCTA, Talatona" />
          </div>

          {/* Row 6: Serviços */}
          <div className="space-y-2">
            <Label>Serviços Contratados *</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {services.map((s) => (
                <label key={s.id} className="flex items-center gap-2">
                  <Checkbox checked={form.service_ids?.includes(s.id)} onCheckedChange={() => toggleService(s.id)} />
                  <span className="text-sm">{s.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Row 7: Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas de Reunião</Label>
            <Textarea id="notes" rows={3} value={form.notes ?? ""} onChange={(e) => updateField("notes", e.target.value)} placeholder="Observações, follow-up, urgências..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={loading}>
            {loading ? "Criando..." : "Criar Projeto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}