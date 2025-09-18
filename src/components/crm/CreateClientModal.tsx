"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { showError, showSuccess } from "@/utils/toast";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { CreateProjectDialog } from "@/components/crm/CreateProjectDialog";
import { useEvents } from "@/hooks/useEvents";
import { useNavigate } from "react-router-dom";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // optional callback so parent can refresh or react after new client created
  onCreated?: (clientId: string) => void;
}

const SERVICE_OPTIONS = [
  "Sonorização",
  "Interpretação simultânea",
  "Transmissão ao vivo",
  "Broadcasting",
  "Iluminação",
  "Painel LED",
];

function isEmailValid(email: string) {
  // simple regex for basic validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function CreateClientModal({ open, onOpenChange, onCreated }: Props) {
  const { upsertClient } = useClients();
  const { services } = useServices();
  const { fetchEvents } = useEvents();
  const navigate = useNavigate();

  const [name, setName] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [nif, setNif] = React.useState("");
  const [position, setPosition] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [serviceChecks, setServiceChecks] = React.useState<Record<string, boolean>>(() =>
    SERVICE_OPTIONS.reduce((acc, s) => ((acc[s] = false), acc), {} as Record<string, boolean>),
  );

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  // Controls CreateProjectDialog open state after create
  const [openCreateProject, setOpenCreateProject] = React.useState(false);
  const [createdClientId, setCreatedClientId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      // reset form when modal closes
      setName("");
      setCompany("");
      setEmail("");
      setPhone("");
      setNif("");
      setPosition("");
      setNotes("");
      setServiceChecks(SERVICE_OPTIONS.reduce((acc, s) => ((acc[s] = false), acc), {} as Record<string, boolean>));
      setErrors({});
      setSaving(false);
      setCreatedClientId(null);
      setOpenCreateProject(false);
    }
  }, [open]);

  // realtime validation handlers
  React.useEffect(() => {
    const newErrors: Record<string, string> = {};
    if (email && !isEmailValid(email)) newErrors.email = "Formato de email inválido";
    if (nif && nif.trim().length === 0) newErrors.nif = "NIF inválido";
    setErrors((prev) => ({ ...prev, ...newErrors }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, nif]);

  const toggleService = (name: string) => {
    setServiceChecks((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const validateBeforeSave = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Nome é obrigatório";
    if (!company.trim()) e.company = "Empresa é obrigatória";
    if (!email.trim() || !isEmailValid(email)) e.email = "Email válido é obrigatório";
    if (!phone.trim()) e.phone = "Contacto é obrigatório";
    if (!nif.trim()) e.nif = "NIF é obrigatório";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (createProjectAfter = false) => {
    if (!validateBeforeSave()) return;
    setSaving(true);
    try {
      // Persist client - adapt fields to existing clients table shape
      const payload: any = {
        name: name.trim(),
        company: company.trim(),
        email: email.trim(),
        phone: phone.trim(),
        nif: nif.trim(),
        notes: notes.trim() || null,
        persona: position.trim() || null,
        tags: SERVICE_OPTIONS.filter((s) => serviceChecks[s]),
      };

      const client = await upsertClient(payload);
      if (!client || !client.id) {
        throw new Error("Falha ao criar cliente");
      }

      showSuccess("Cliente criado com sucesso!");
      setCreatedClientId(client.id);
      onCreated?.(client.id);

      // if asked, open project modal
      if (createProjectAfter) {
        // open project dialog pre-filled with client
        setOpenCreateProject(true);
      }
    } catch (err: any) {
      console.error("Error creating client:", err);
      showError(err?.message || "Erro ao criar cliente.");
    } finally {
      setSaving(false);
    }
  };

  // minimal inline spinner
  const SpinnerSmall = () => (
    <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-600 mr-2" />
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
            <CardDescription>Preencha os dados do cliente. Campos marcados com * são obrigatórios.</CardDescription>
          </DialogHeader>

          <div className="grid gap-3 py-4">
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

            <div className="space-y-2">
              <Label htmlFor="client-nif">NIF *</Label>
              <Input id="client-nif" value={nif} onChange={(e) => setNif(e.target.value)} />
              {errors.nif && <p className="text-xs text-destructive">{errors.nif}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-position">Cargo</Label>
              <Input id="client-position" value={position} onChange={(e) => setPosition(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-notes">Observações</Label>
              <Textarea id="client-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
            </div>

            <div>
              <Label>Serviços de interesse</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {SERVICE_OPTIONS.map((s) => (
                  <label key={s} className="flex items-center gap-2">
                    <Checkbox checked={!!serviceChecks[s]} onCheckedChange={() => toggleService(s)} />
                    <span className="text-sm">{s}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  // save and immediately open Create Project dialog when success
                  handleSave(true);
                }}
                disabled={saving}
              >
                Criar Projeto para este Cliente
              </Button>

              <Button onClick={() => handleSave(false)} disabled={saving}>
                {saving ? (
                  <>
                    <SpinnerSmall /> Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* After creating client, open project modal pre-filled with this client */}
      {createdClientId && (
        <CreateProjectDialog
          open={openCreateProject}
          onOpenChange={(v) => {
            setOpenCreateProject(v);
            if (!v) {
              // close create client modal when project dialog closes to return user to clients list
              onOpenChange(false);
            }
          }}
          clients={[{ id: createdClientId, name: name } as any]}
          services={services.map((s: any) => ({ id: s.id, name: s.name }))}
          onCreate={async (_payload) => {
            // Instead of trying to import/create via supabase here, navigate to the project page (client preselected)
            // This keeps behavior consistent and avoids importing supabase internals dynamically.
            navigate(`/crm/projects/new?client=${createdClientId}`);
          }}
        />
      )}
    </>
  );
}