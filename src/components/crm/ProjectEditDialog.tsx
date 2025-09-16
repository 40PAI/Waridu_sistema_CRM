"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { showError, showSuccess } from "@/utils/toast";

interface FollowUp {
  id: string;
  action: string;
  date: string;
  notes?: string;
}

interface Project {
  id: number;
  name: string;
  client_id?: string;
  pipeline_status: '1º Contato' | 'Orçamento' | 'Negociação' | 'Confirmado';
  service_ids: string[];
  estimated_value?: number;
  startDate: string;
  tags?: string[];
  follow_ups?: FollowUp[];
  notes?: string;
}

interface ProjectEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onSave: (updatedProject: Project) => Promise<void>;
  clients: { id: string; name: string }[];
  services: { id: string; name: string }[];
}

export const ProjectEditDialog = ({ open, onOpenChange, project, onSave, clients, services }: ProjectEditDialogProps) => {
  const [name, setName] = React.useState("");
  const [clientId, setClientId] = React.useState<string>("");
  const [pipelineStatus, setPipelineStatus] = React.useState<Project['pipeline_status']>('1º Contato');
  const [serviceIds, setServiceIds] = React.useState<string[]>([]);
  const [estimatedValue, setEstimatedValue] = React.useState<number | "">("");
  const [startDate, setStartDate] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [newTag, setNewTag] = React.useState("");
  const [followUps, setFollowUps] = React.useState<FollowUp[]>([]);
  const [newFollowUpAction, setNewFollowUpAction] = React.useState("");
  const [newFollowUpNotes, setNewFollowUpNotes] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("general");

  React.useEffect(() => {
    if (project) {
      setName(project.name);
      setClientId(project.client_id || "");
      setPipelineStatus(project.pipeline_status);
      setServiceIds(project.service_ids || []);
      setEstimatedValue(project.estimated_value ?? "");
      setStartDate(project.startDate);
      setTags(project.tags || []);
      setFollowUps(project.follow_ups || []);
      setNotes(project.notes || "");
    } else {
      setName("");
      setClientId("");
      setPipelineStatus('1º Contato');
      setServiceIds([]);
      setEstimatedValue("");
      setStartDate("");
      setTags([]);
      setFollowUps([]);
      setNotes("");
    }
  }, [project, open]);

  const handleAddTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleAddFollowUp = () => {
    if (!newFollowUpAction.trim()) {
      showError("Ação do follow-up é obrigatória.");
      return;
    }
    const newEntry: FollowUp = {
      id: `fu-${Date.now()}`,
      action: newFollowUpAction.trim(),
      date: new Date().toISOString(),
      notes: newFollowUpNotes.trim() || undefined,
    };
    setFollowUps([newEntry, ...followUps]);
    setNewFollowUpAction("");
    setNewFollowUpNotes("");
  };

  const handleRemoveFollowUp = (id: string) => {
    setFollowUps(followUps.filter(fu => fu.id !== id));
  };

  const handleToggleService = (serviceId: string) => {
    if (serviceIds.includes(serviceId)) {
      setServiceIds(serviceIds.filter(id => id !== serviceId));
    } else {
      setServiceIds([...serviceIds, serviceId]);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showError("Nome do projeto é obrigatório.");
      return;
    }
    if (!startDate) {
      showError("Data de início é obrigatória.");
      return;
    }
    if (estimatedValue !== "" && (typeof estimatedValue !== "number" || estimatedValue < 0)) {
      showError("Valor estimado deve ser um número positivo.");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        id: project?.id || 0,
        name: name.trim(),
        client_id: clientId || undefined,
        pipeline_status: pipelineStatus,
        service_ids: serviceIds,
        estimated_value: estimatedValue === "" ? undefined : Number(estimatedValue),
        startDate,
        tags,
        follow_ups: followUps,
        notes,
      });
      showSuccess("Projeto salvo com sucesso!");
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar projeto:", error);
      showError("Erro ao salvar projeto.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-w-full">
        <DialogHeader>
          <DialogTitle>{project ? `Editar Projeto: ${project.name}` : "Novo Projeto"}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList>
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="services">Serviços</TabsTrigger>
            <TabsTrigger value="followups">Follow-ups</TabsTrigger>
            <TabsTrigger value="notes">Notas</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Nome *</Label>
                <Input
                  id="project-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-client">Cliente</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger id="project-client">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pipeline-status">Status do Pipeline</Label>
                <Select value={pipelineStatus} onValueChange={setPipelineStatus}>
                  <SelectTrigger id="pipeline-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1º Contato">1º Contato</SelectItem>
                    <SelectItem value="Orçamento">Orçamento</SelectItem>
                    <SelectItem value="Negociação">Negociação</SelectItem>
                    <SelectItem value="Confirmado">Confirmado</SelectItem>
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start-date">Data de Início *</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <div key={tag} className="flex items-center gap-1 bg-muted rounded px-2 py-1 text-sm">
                      <span>{tag}</span>
                      <button type="button" onClick={() => handleRemoveTag(tag)} className="text-destructive font-bold leading-none">×</button>
                    </div>
                  ))}
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                    placeholder="Adicionar tag"
                    className="border border-border rounded px-2 py-1 text-sm"
                  />
                  <Button size="sm" onClick={handleAddTag}>Adicionar</Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-4 mt-4">
            <Label>Serviços</Label>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded p-2">
              {services.map(service => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => handleToggleService(service.id)}
                  className={cn(
                    "rounded px-3 py-1 text-sm border",
                    serviceIds.includes(service.id) ? "bg-primary text-primary-foreground border-primary" : "border-border"
                  )}
                >
                  {service.name}
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="followups" className="space-y-4 mt-4">
            <Label>Histórico de Follow-ups</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-2">
              {followUps.length === 0 && <p className="text-sm text-muted-foreground">Nenhum follow-up registrado.</p>}
              {followUps.map(fu => (
                <div key={fu.id} className="border rounded p-2 flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{fu.action}</p>
                    <p className="text-xs text-muted-foreground">{fu.notes}</p>
                    <p className="text-xs text-muted-foreground">{format(parseISO(fu.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                  </div>
                  <button type="button" onClick={() => handleRemoveFollowUp(fu.id)} className="text-destructive font-bold text-xl leading-none">×</button>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-followup-action">Nova Ação *</Label>
              <Input
                id="new-followup-action"
                value={newFollowUpAction}
                onChange={(e) => setNewFollowUpAction(e.target.value)}
              />
              <Label htmlFor="new-followup-notes">Notas</Label>
              <Textarea
                id="new-followup-notes"
                value={newFollowUpNotes}
                onChange={(e) => setNewFollowUpNotes(e.target.value)}
                rows={3}
              />
              <Button onClick={handleAddFollowUp}>Adicionar Follow-up</Button>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4 mt-4">
            <Label htmlFor="project-notes">Notas Gerais</Label>
            <Textarea
              id="project-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              placeholder="Observações gerais sobre o projeto..."
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};