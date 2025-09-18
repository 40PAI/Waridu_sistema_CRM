"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showError, showSuccess } from "@/utils/toast";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (clientId: string) => void;
  client?: any;
}

const SERVICE_OPTIONS = [
  "Sonorização",
  "Interpretação simultânea",
  "Transmissão ao vivo",
  "Broadcasting",
  "Iluminação",
  "Painel LED",
];

const SECTOR_OPTIONS = ["Tecnologia", "Financeiro", "Saúde"];
const PERSONA_OPTIONS = ["CEO", "CTO", "Marketing"];
const LIFECYCLE_OPTIONS = ["Lead", "MQL", "SQL", "Ativo", "Perdido"];

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function CreateClientModal({ open, onOpenChange, onCreated, client }: Props) {
  const { upsertClient, clients } = useClients();
  const { createService, refreshServices } = useServices();

  const [name, setName] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [nif, setNif] = React.useState("");
  const [sector, setSector] = React.useState("");
  const [persona, setPersona] = React.useState("");
  const [lifecycleStage, setLifecycleStage] = React.useState("Lead");
  const [notes, setNotes] = React.useState("");
  const [serviceChecks, setServiceChecks] = React.useState<Record<string, boolean>>(() =>
    SERVICE_OPTIONS.reduce((acc, s) => ((acc[s] = false), acc), {} as Record<string, boolean>),
  );

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [addServiceOpen, setAddServiceOpen] = React.useState(false);
  const [newServiceName, setNewServiceName] = React.useState("");
  const [newServiceDesc, setNewServiceDesc] = React.useState("");
  const [savingService, setSavingService] = React.useState(false);

  const isEditing = !!client;

  React.useEffect(() => {
    if (open) {
      if (client) {
        setName(client.name || "");
        setCompany(client.company || "");
        setEmail(client.email || "");
        setPhone(client.phone || "");
        setNif(client.nif || "");
        setSector(client.sector || "");
        setPersona(client.persona || "");
        setLifecycleStage(client.lifecycle_stage || "Lead");
        setNotes(client.notes || "");
        setServiceChecks(SERVICE_OPTIONS.reduce((acc, s) => ((acc[s] = client.tags?.includes(s) || false), acc), {} as Record<string, boolean>));
      } else {
        setName("");
        setCompany("");
        setEmail("");
        setPhone("");
        setNif("");
        setSector("");
        setPersona("");
        setLifecycleStage("Lead");
        setNotes("");
        setServiceChecks(SERVICE_OPTIONS.reduce((acc, s) => ((acc[s] = false), acc), {} as Record<string, boolean>));
      }
      setErrors({});
      setSaving(false);
      setNewServiceName("");
      setNewServiceDesc("");
    }
  }, [open, client]);

  // realtime validation handlers
  React.useEffect(() => {
    const newErrors: Record<string, string> = {};
    if (email && !isEmailValid(email)) newErrors.email = "Formato de email inválido";
    if (nif && nif.trim().length === 0) newErrors.nif = "NIF inválido";
    setErrors((prev) => ({ ...prev, ...newErrors }));
  }, [email, nif]);

  const toggleService = (name: string) => {
    setServiceChecks((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleCreateService = async () => {
    if (!newServiceName.trim()) {
      showError("Nome do serviço é obrigatório.");
      return;
    }
    setSavingService(true);
    try {
      await createService({ name: newServiceName.trim(), description: newServiceDesc.trim() || undefined });
      await refreshServices();
      showSuccess("Serviço adicionado com sucesso!");
      setNewServiceName("");
      setNewServiceDesc("");
      setAddServiceOpen(false);
    } catch (error) {
      showError("Erro ao adicionar serviço.");
    } finally {
      setSavingService(false);
    }
  };

  const validateBeforeSave = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Nome é obrigatório";
    if (!company.trim()) e.company = "Empresa é obrigatória";
    if (!email.trim() || !isEmailValid(email)) e.email = "Email válido é obrigatório";
    if (!phone.trim()) e.phone = "Contacto é obrigatório";
    if (!nif.trim()) e.nif = "NIF é obrigatório";

    // Check for duplicates
    const existingByEmail = clients.find(c => c.email?.toLowerCase() === email.toLowerCase() && c.id !== client?.id);
    const existingByNif = clients.find(c => c.nif === nif && c.id !== client?.id);
    if (existingByEmail) e.email = "Já existe um cliente com este email";
    if (existingByNif) e.nif = "Já existe um cliente com este NIF";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validateBeforeSave()) return;
    setSaving(true);
    try {
      const payload: any = {
        name: name.trim(),
        company: company.trim(),
        email: email.trim(),
        phone: phone.trim(),
        nif: nif.trim(),
        sector: sector || null,
        persona: persona || null,
        lifecycle_stage: lifecycleStage,
        notes: notes.trim() || null,
        tags: SERVICE_OPTIONS.filter((s) => serviceChecks[s]),
      };

      if (client) {
        payload.id = client.id; // For editing
      }

      const savedClient = await upsertClient(payload);
      if (!savedClient || !savedClient.id) {
        throw new Error("Falha ao salvar cliente");
      }

      showSuccess(isEditing ? "Cliente atualizado com sucesso!" : "Cliente criado com sucesso!");
      onCreated?.(savedClient.id);
      onOpenChange(false);
    } catch (err: any) {
      console.error("Error saving client:", err);
      showError(err?.message || "Erro ao salvar cliente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Linha 1: Nome + Empresa */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client-name">Nome completo *</Label>
                <Input id="client-name" value={name} onChange={(e) => setName(e.target.value)} className="w-full" />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-company">Empresa *</Label>
                <Input id="client-company" value={company} onChange={(e) => setCompany(e.target.value)} />
                {errors.company && <p className="text-xs text-destructive">{errors.company}</p>}
              </div>
            </div>

            {/* Linha 2: Email + Telefone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client-email">E-mail *</Label>
                <Input id="client-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-phone">Telefone/Contacto *</Label>
                <Input id="client-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>
            </div>

            {/* Linha 3: NIF + Setor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client-nif">NIF *</Label>
                <Input id="client-nif" value={nif} onChange={(e) => setNif(e.target.value)} />
                {errors.nif && <p className="text-xs text-destructive">{errors.nif}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-sector">Setor</Label>
                <Select value={sector} onValueChange={setSector}>
                  <SelectTrigger id="client-sector">
                    <SelectValue placeholder="Selecione o setor" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTOR_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Linha 4: Persona + Ciclo de Vida */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client-persona">Persona</Label>
                <Select value={persona} onValueChange={setPersona}>
                  <SelectTrigger id="client-persona">
                    <SelectValue placeholder="Selecione a persona" />
                  </SelectTrigger>
                  <SelectContent>
                    {PERSONA_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-lifecycle">Ciclo de Vida</Label>
                <Select value={lifecycleStage} onValueChange={setLifecycleStage}>
                  <SelectTrigger id="client-lifecycle">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LIFECYCLE_OPTIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Linha 5: Observações */}
            <div className="space-y-2">
              <Label htmlFor="client-notes">Observações</Label>
              <Textarea id="client-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>

            {/* Linha 6: Serviços de interesse */}
            <div className="space-y-2">
              <Label>Serviços de interesse</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {SERVICE_OPTIONS.map((s) => (
                  <label key={s} className="flex items-center gap-2">
                    <Checkbox checked={!!serviceChecks[s]} onCheckedChange={() => toggleService(s)} />
                    <span className="text-sm">{s}</span>
                  </label>
                ))}
              </div>
              <Button variant="link" size="sm" onClick={() => setAddServiceOpen(true)} className="mt-2">
                + Adicionar Novo Serviço
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sub-dialog para adicionar novo serviço */}
      <Dialog open={addServiceOpen} onOpenChange={setAddServiceOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Serviço</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="service-name">Nome do Serviço *</Label>
              <Input
                id="service-name"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                placeholder="Ex: Cobertura de Casamento"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-desc">Descrição (Opcional)</Label>
              <Textarea
                id="service-desc"
                value={newServiceDesc}
                onChange={(e) => setNewServiceDesc(e.target.value)}
                placeholder="Descreva o serviço brevemente..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddServiceOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateService} disabled={savingService}>
              {savingService ? "Adicionando..." : "Adicionar Serviço"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}