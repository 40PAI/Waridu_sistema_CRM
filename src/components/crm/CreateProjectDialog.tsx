import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { showError } from "@/utils/toast";
import type { CreatePayload, PipelineStatus, Client, Service } from "@/types/crm";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  services: Service[];
  onCreate: (payload: CreatePayload) => Promise<void>;
  loading?: boolean;
}

const columns = [
  { id: "1º Contato", title: "1º Contato" },
  { id: "Orçamento", title: "Orçamento" },
  { id: "Negociação", title: "Negociação" },
  { id: "Confirmado", title: "Confirmado" },
  { id: "Cancelado", title: "Cancelado" },
] satisfies { id: PipelineStatus; title: string }[];

export function CreateProjectDialog({ open, onOpenChange, clients, services, onCreate, loading }: CreateProjectDialogProps) {
  const [form, setForm] = React.useState<CreatePayload>({
    name: "",
    client_id: undefined,
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

  const updateField = (key: keyof CreatePayload, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleService = (id: string) =>
    setForm((prev) => ({
      ...prev,
      service_ids: prev.service_ids?.includes(id)
        ? prev.service_ids.filter((s) => s !== id)
        : [...(prev.service_ids ?? []), id],
    }));

  const submit = async () => {
    // Alinhado com CreateEvent: Nome, Data de Início e Local são obrigatórios.
    if (!form.name?.trim()) return showError("Por favor, preencha os campos obrigatórios: Nome, Data de Início e Local.");
    if (!form.startDate) return showError("Por favor, preencha os campos obrigatórios: Nome, Data de Início e Local.");
    if (!form.location?.trim()) return showError("Por favor, preencha os campos obrigatórios: Nome, Data de Início e Local.");
    if (!form.client_id) return showError("Selecione um cliente");

    try {
      await onCreate({ ...form });
      onOpenChange(false);
      setForm({
        name: "",
        client_id: undefined,
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
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Projeto</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="client-id">Cliente</Label>
            <Select onValueChange={(v) => updateField("client_id", v)} value={form.client_id ?? ""}>
              <SelectTrigger id="client-id">
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-name">Nome do Projeto</Label>
            <Input id="project-name" value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Ex.: Evento BFA – Conferência" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pipeline-status">Status inicial</Label>
            <Select onValueChange={(v) => updateField("pipeline_status", v as PipelineStatus)} value={form.pipeline_status}>
              <SelectTrigger id="pipeline-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {columns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimated-value">Receita estimada</Label>
            <Input id="estimated-value" type="number" value={form.estimated_value ?? ""} onChange={(e) => updateField("estimated_value", Number(e.target.value))} placeholder="0" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-start-date">Data de Início</Label>
            <Input id="event-start-date" type="date" value={form.startDate} onChange={(e) => updateField("startDate", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-start-time">Hora de Início</Label>
            <Input id="event-start-time" type="time" value={form.startTime || ""} onChange={(e) => updateField("startTime", e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-end-date">Data de Fim</Label>
            <Input id="event-end-date" type="date" value={form.endDate} onChange={(e) => updateField("endDate", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-end-time">Hora de Fim</Label>
            <Input id="event-end-time" type="time" value={form.endTime || ""} onChange={(e) => updateField("endTime", e.target.value)} />
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="services">Serviços (selecione 1 ou mais)</Label>
            <div id="services" className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {services.map((s) => (
                <label key={s.id} className="flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer">
                  <Checkbox checked={form.service_ids?.includes(s.id)} onCheckedChange={() => toggleService(s.id)} />
                  <span className="text-sm">{s.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="event-location">Local do Evento</Label>
            <Input id="event-location" value={form.location ?? ""} onChange={(e) => updateField("location", e.target.value)} placeholder="Ex.: CCTA, Talatona" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" rows={3} value={form.notes ?? ""} onChange={(e) => updateField("notes", e.target.value)} placeholder="Observações, follow-up, urgências..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={submit} disabled={loading}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}