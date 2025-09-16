"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { showError, showSuccess } from "@/utils/toast";
import { cn } from "@/lib/utils";

type PipelineStatus = '1º Contato' | 'Orçamento' | 'Negociação' | 'Confirmado' | 'Em andamento' | 'Cancelado' | 'Acompanhamento';

interface Client { id: string; name: string; }
interface Service { id: string; name: string; }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients?: Client[];
  services?: Service[];
  onCreate: (payload: {
    name: string;
    client_id?: string;
    pipeline_status?: PipelineStatus;
    service_ids?: string[];
    estimated_value?: number;
    startDate: string;
    endDate: string;
    location?: string;
    notes?: string;
    tags?: string[];
  }) => Promise<void>;
}

const CreateProjectDialog: React.FC<Props> = ({ open, onOpenChange, clients = [], services = [], onCreate }) => {
  const [name, setName] = React.useState("");
  const [clientId, setClientId] = React.useState("");
  const [pipelineStatus, setPipelineStatus] = React.useState<PipelineStatus>('1º Contato');
  const [serviceIds, setServiceIds] = React.useState<string[]>([]);
  const [estimatedValue, setEstimatedValue] = React.useState<number | "">("");
  const [startDate, setStartDate] = React.useState<string>(() => format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = React.useState<string>(() => format(new Date(), "yyyy-MM-dd"));
  const [location, setLocation] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [newTag, setNewTag] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setName("");
      setClientId("");
      setPipelineStatus("1º Contato");
      setServiceIds([]);
      setEstimatedValue("");
      setStartDate(format(new Date(), "yyyy-MM-dd"));
      setEndDate(format(new Date(), "yyyy-MM-dd"));
      setLocation("");
      setNotes("");
      setTags([]);
      setNewTag("");
      setSubmitting(false);
    }
  }, [open]);

  const toggleService = (id: string) => {
    setServiceIds(prev => (prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]));
  };

  const addTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) {
      showError("O nome do projeto é obrigatório.");
      return;
    }
    if (!startDate || !endDate) {
      showError("Datas de início e fim são obrigatórias.");
      return;
    }
    setSubmitting(true);
    try {
      await onCreate({
        name: name.trim(),
        client_id: clientId || undefined,
        pipeline_status: pipelineStatus,
        service_ids: serviceIds,
        estimated_value: estimatedValue === "" ? undefined : Number(estimatedValue),
        startDate,
        endDate,
        location: location || undefined,
        notes: notes || undefined,
        tags,
      });
      showSuccess("Projeto criado com sucesso!");
      onOpenChange(false);
    } catch (err: any) {
      console.error("Create project error:", err);
      showError(err?.message || "Erro ao criar projeto.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Projeto</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="proj-name">Nome do Projeto *</Label>
              <Input id="proj-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Evento Corporativo XYZ" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proj-client">Cliente</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger id="proj-client">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pipeline-status">Status do Pipeline</Label>
              <Select value={pipelineStatus} onValueChange={(v) => setPipelineStatus(v as PipelineStatus)}>
                <SelectTrigger id="pipeline-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1º Contato">1º Contato</SelectItem>
                  <SelectItem value="Orçamento">Orçamento</SelectItem>
                  <SelectItem value="Negociação">Negociação</SelectItem>
                  <SelectItem value="Confirmado">Confirmado</SelectItem>
                  <SelectItem value="Em andamento">Em andamento</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                  <SelectItem value="Acompanhamento">Acompanhamento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated-value">Valor Estimado (AOA)</Label>
              <Input
                id="estimated-value"
                type="number"
                min={0}
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Ex: 50000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date">Data de Início *</Label>
              <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">Data de Fim *</Label>
              <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label>Serviços</Label>
              <div className="flex flex-wrap gap-2">
                {services.map(s => {
                  const active = serviceIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleService(s.id)}
                      className={cn(
                        "px-3 py-1 rounded border text-sm",
                        active ? "bg-primary text-primary-foreground border-primary" : "border-border"
                      )}
                    >
                      {s.name}
                    </button>
                  );
                })}
                {services.length === 0 && <div className="text-sm text-muted-foreground">Sem serviços cadastrados</div>}
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="location">Localização</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex: Centro de Convenções" />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label>Tags (para destacar urgências ou informativos)</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="text-destructive font-bold leading-none">×</button>
                  </Badge>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Ex: urgente, follow-up pendente"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  />
                  <Button type="button" onClick={addTag}>Adicionar</Button>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Observações sobre o projeto..." />
            </div>
          </div>

          <DialogFooter className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Criando..." : "Criar Projeto"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;