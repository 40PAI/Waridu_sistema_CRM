"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { MultiSelectServices } from "@/components/MultiSelectServices"; // Import the component used in projects

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (clientId: string) => void;
  client?: any;
}

const SECTOR_OPTIONS = ["Tecnologia", "Financeiro", "Saúde", "Construção", "Educação", "Retail", "Outro"];
const LIFECYCLE_OPTIONS = ["Lead", "Oportunidade", "Cliente Ativo", "Cliente Perdido"];

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function CreateClientModal({ open, onOpenChange, onCreated, client }: Props) {
  const { upsertClient, clients } = useClients();
  const { services } = useServices(); // Get services for MultiSelectServices

  const [name, setName] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [nif, setNif] = React.useState("");
  const [sector, setSector] = React.useState("");
  const [position, setPosition] = React.useState(""); // Cargo/Departamento
  const [lifecycleStage, setLifecycleStage] = React.useState("Lead");
  const [notes, setNotes] = React.useState("");
  const [selectedServices, setSelectedServices] = React.useState<string[]>([]); // For MultiSelectServices

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
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
        setPosition(client.position || "");
        setLifecycleStage(client.lifecycle_stage || "Lead");
        setNotes(client.notes || "");
        setSelectedServices(client.service_ids || []); // Use service_ids
      } else {
        setName("");
        setCompany("");
        setEmail("");
        setPhone("");
        setNif("");
        setSector("");
        setPosition("");
        setLifecycleStage("Lead");
        setNotes("");
        setSelectedServices([]);
      }
      setErrors({});
      setSaving(false);
    }
  }, [open, client]);

  // Validação em tempo real
  React.useEffect(() => {
    const newErrors: Record<string, string> = {};
    if (email && !isEmailValid(email)) newErrors.email = "Formato de email inválido";
    if (nif && nif.trim().length === 0) newErrors.nif = "NIF inválido";
    setErrors((prev) => ({ ...prev, ...newErrors }));
  }, [email, nif]);

  const validateBeforeSave = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Nome é obrigatório";
    if (!company.trim()) e.company = "Empresa é obrigatória";
    if (!email.trim() || !isEmailValid(email)) e.email = "Email válido é obrigatório";
    if (!phone.trim()) e.phone = "Contacto é obrigatório";
    if (!nif.trim()) e.nif = "NIF é obrigatório";

    // Verificar duplicatas
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
        company: company.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        nif: nif.trim() || null,
        sector: sector || null,
        position: position.trim() || null, // Cargo/Departamento
        lifecycle_stage: lifecycleStage,
        notes: notes.trim() || null,
        service_ids: selectedServices, // Save selected services
      };

      if (client) {
        payload.id = client.id;
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
    <TooltipProvider>
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
                <div className="flex items-center gap-2">
                  <Label htmlFor="client-sector">Setor</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-800 text-white rounded-md shadow-lg max-w-xs">
                      <p>Área de atuação do cliente (ex.: Educação, Saúde, Governo, Tecnologia).</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input 
                  id="client-sector"
                  value={sector} 
                  onChange={(e) => setSector(e.target.value)} 
                  placeholder="Ex: Tecnologia, Financeiro, Saúde, Construção..."
                />
              </div>
            </div>

            {/* Linha 4: Cargo/Departamento + Ciclo de Vida */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="client-position">Cargo/Departamento</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-800 text-white rounded-md shadow-lg max-w-xs">
                      <p>Cargo ou departamento do contacto no cliente (ex.: Diretor de TI, Gestor de Compras).</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input 
                  id="client-position"
                  value={position} 
                  onChange={(e) => setPosition(e.target.value)} 
                  placeholder="Ex: Diretor de TI, Gestor de Compras..."
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="client-lifecycle">Ciclo de Vida</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-800 text-white rounded-md shadow-lg max-w-sm">
                      <p>Etapa da relação com a Waridu:<br />
                        - Lead: Primeiro contacto<br />
                        - MQL: Interessado (pedido de orçamento)<br />
                        - SQL: Em negociação com vendas<br />
                        - Cliente ativo: Contrato assinado<br />
                        - Cliente recorrente: Já fez mais de 1 projeto<br />
                        - Cliente perdido: Não converteu / desistiu</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
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

            {/* Linha 6: Serviços de Interesse (MultiSelectServices instead of tags textarea) */}
            <div className="space-y-2">
              <Label>Serviços de Interesse</Label>
              <MultiSelectServices
                selected={selectedServices}
                onChange={setSelectedServices}
                placeholder="Selecione serviços de interesse..."
              />
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
    </TooltipProvider>
  );
}