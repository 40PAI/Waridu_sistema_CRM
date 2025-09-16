"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type PipelineStatus = "1º Contato" | "Orçamento" | "Negociação" | "Confirmado" | "Cancelado";

interface Client { id: string; name: string; company?: string; email?: string; nif?: string }
interface Service { id: string; name: string }

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
    estimated_currency?: string;
    startDate: string;
    endDate: string;
    location?: string;
    notes?: string;
    tags?: string[];
  }) => Promise<void>;
}

const DEFAULT_SERVICES = [
  { id: "sonorizacao", name: "Sonorização" },
  { id: "interpretacao", name: "Interpretação simultânea" },
  { id: "transmissao", name: "Transmissão ao vivo" },
  { id: "broadcasting", name: "Broadcasting" },
  { id: "iluminacao", name: "Iluminação" },
  { id: "painel_led", name: "Painel LED" },
];

const CreateProjectDialog: React.FC<Props> = ({ open, onOpenChange, clients = [], services = DEFAULT_SERVICES, onCreate }) => {
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [showNewClientForm, setShowNewClientForm] = useState(false);

  // new client mini-form
  const [newClientName, setNewClientName] = useState("");
  const [newClientCompany, setNewClientCompany] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientNif, setNewClientNif] = useState("");
  const [creatingClient, setCreatingClient] = useState(false);

  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>("1º Contato");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [estimatedValue, setEstimatedValue] = useState<number | "">("");
  const [estimatedCurrency, setEstimatedCurrency] = useState<"AOA" | "USD">("AOA");
  const [startDate, setStartDate] = useState<string>(() => format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState<string>(() => format(new Date(), "yyyy-MM-dd"));
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const resetForm = () => {
    setName("");
    setClientId("");
    setShowNewClientForm(false);
    setNewClientName("");
    setNewClientCompany("");
    setNewClientEmail("");
    setNewClientNif("");
    setPipelineStatus("1º Contato");
    setServiceIds([]);
    setEstimatedValue("");
    setEstimatedCurrency("AOA");
    setStartDate(format(new Date(), "yyyy-MM-dd"));
    setEndDate(format(new Date(), "yyyy-MM-dd"));
    setLocation("");
    setNotes("");
    setTags([]);
    setNewTag("");
    setSubmitting(false);
  };

  const toggleService = (id: string) => {
    setServiceIds(prev => (prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]));
  };

  const addTag = () => {
    const t = newTag.trim();
    if (t && !tags.includes(t)) {
      setTags(prev => [...prev, t]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag));

  const createClientInline = async () => {
    const nameTrim = newClientName.trim();
    const emailTrim = newClientEmail.trim();
    if (!nameTrim || !emailTrim) {
      showError("Nome e email do cliente são obrigatórios.");
      return;
    }
    setCreatingClient(true);
    try {
      const { data, error } = await supabase
        .from("clients")
        .insert({
          name: nameTrim,
          email: emailTrim,
          nif: newClientNif.trim() || null,
          notes: newClientCompany.trim() ? `Empresa: ${newClientCompany.trim()}` : null,
        })
        .select()
        .single();

      if (error) throw error;
      showSuccess("Cliente criado com sucesso!");
      // set created client as selected
      setClientId(data.id);
      setShowNewClientForm(false);
      // Clear mini-form
      setNewClientName("");
      setNewClientCompany("");
      setNewClientEmail("");
      setNewClientNif("");
    } catch (err: any) {
      console.error("Erro criando cliente:", err);
      showError(err?.message || "Erro ao criar cliente.");
    } finally {
      setCreatingClient(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) {
      showError("Nome do projeto é obrigatório.");
      return;
    }
    if (!startDate) {
      showError("Data de início prevista é obrigatória.");
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
        estimated_currency: estimatedCurrency,
        startDate,
        endDate,
        location: location || undefined,
        notes: notes || undefined,
        tags,
      });
      showSuccess("Projeto criado com sucesso!");
      onOpenChange(false);
    } catch (err: any) {
      console.error("Erro ao criar projeto:", err);
      showError(err?.message || "Erro ao criar projeto.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[820px]">
        <DialogHeader>
          <DialogTitle>Novo Projeto</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="client-select">Cliente</Label>
              <div className="flex gap-2">
                <Select value={clientId} onValueChange={(v) => {
                  if (v === "__create_new__") {
                    setShowNewClientForm(true);
                    setClientId("");
                  } else {
                    setClientId(v);
                    setShowNewClientForm(false);
                  }
                }}>
                  <SelectTrigger id="client-select" className="w-full">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} {c.company ? `— ${c.company}` : ""}
                      </SelectItem>
                    ))}
                    <SelectItem value="__create_new__">+ Criar novo cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {showNewClientForm && (
              <div className="md:col-span-2 p-4 border rounded bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Criar novo cliente</h4>
                  <Button variant="ghost" size="sm" onClick={() => setShowNewClientForm(false)}>Fechar</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Nome *</Label>
                    <Input value={newClientName} onChange={(e) => setNewClientName(e.target.value)} />
                  </div>
                  <div>
                    <Label>Empresa</Label>
                    <Input value={newClientCompany} onChange={(e) => setNewClientCompany(e.target.value)} />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} />
                  </div>
                  <div>
                    <Label>NIF</Label>
                    <Input value={newClientNif} onChange={(e) => setNewClientNif(e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-end mt-3">
                  <Button variant="outline" onClick={() => {
                    setShowNewClientForm(false);
                    setNewClientName("");
                    setNewClientCompany("");
                    setNewClientEmail("");
                    setNewClientNif("");
                  }} className="mr-2">Cancelar</Button>
                  <Button onClick={createClientInline} disabled={creatingClient}>
                    {creatingClient ? "Criando..." : "Criar Cliente"}
                  </Button>
                </div>
              </div>
            )}

            <div>
              <Label>Serviço(s)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {services.map(s => {
                  const checked = serviceIds.includes(s.id);
                  return (
                    <label key={s.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleService(s.id)}
                        className="h-4 w-4"
                      />
                      <span>{s.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <Label htmlFor="project-name">Nome do Projeto</Label>
              <Input id="project-name" value={name} onChange={(e) => setName(e.target.value)} placeholder='Ex: "Evento BFA – Conferência"' />
            </div>

            <div>
              <Label htmlFor="pipeline-status">Status inicial da Pipeline</Label>
              <Select value={pipelineStatus} onValueChange={(v) => setPipelineStatus(v as PipelineStatus)}>
                <SelectTrigger id="pipeline-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1º Contato">1º Contato</SelectItem>
                  <SelectItem value="Orçamento">Orçamento</SelectItem>
                  <SelectItem value="Negociação">Negociação</SelectItem>
                  <SelectItem value="Confirmado">Confirmado</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Receita estimada</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Valor"
                />
                <Select value={estimatedCurrency} onValueChange={(v) => setEstimatedCurrency(v as "AOA" | "USD")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AOA">Kz (AOA)</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Data de início prevista</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            <div>
              <Label>Data de fim prevista (opcional)</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>

            <div className="md:col-span-2">
              <Label>Localização</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex: Centro de Conferências de Talatona" />
            </div>

            <div className="md:col-span-2">
              <Label>Notas rápidas / Observações</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Informações de reunião inicial, follow-up, urgências..." />
            </div>

            <div className="md:col-span-2">
              <Label>Tags (opcional)</Label>
              <div className="flex gap-2 items-center">
                <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Ex: urgente" />
                <Button type="button" onClick={addTag}>Adicionar</Button>
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                {tags.map(t => (
                  <Badge key={t} className="flex items-center gap-2">
                    <span>{t}</span>
                    <button type="button" onClick={() => removeTag(t)} className="text-destructive">×</button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancelar</Button>
            <Button type="submit" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Criando..." : "Criar Projeto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;