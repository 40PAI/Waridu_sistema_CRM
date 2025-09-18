"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { VerticalTimeline, VerticalTimelineElement } from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Client } from "@/hooks/useClients";
import type { Communication } from "@/hooks/useCommunications";
import { Search, Plus, Mail, Phone, Calendar, MessageSquare } from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { useCommunications } from "@/hooks/useCommunications";
import { showSuccess, showError } from "@/utils/toast";

interface ClientDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  communications: Communication[];
}

const ClientDetailModal: React.FC<ClientDetailModalProps> = ({ open, onOpenChange, client, communications }) => {
  const { upsertClient } = useClients();
  const { createCommunication } = useCommunications();

  const [filterType, setFilterType] = React.useState<string>("all");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isEditing, setIsEditing] = React.useState(false);
  const [editData, setEditData] = React.useState<Partial<Client>>({});
  const [showAddCommunication, setShowAddCommunication] = React.useState(false);
  const [newComm, setNewComm] = React.useState({
    type: 'note' as Communication['type'],
    subject: '',
    notes: ''
  });

  React.useEffect(() => {
    if (client) {
      setEditData(client);
    }
  }, [client]);

  if (!client) return null;

  const filteredCommunications = communications.filter(comm => {
    const matchesType = filterType === "all" || comm.type === filterType;
    const matchesSearch = !searchTerm || 
      comm.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleSaveEdit = async () => {
    try {
      await upsertClient({ ...client, ...editData });
      showSuccess("Cliente atualizado com sucesso!");
      setIsEditing(false);
    } catch (error) {
      showError("Erro ao atualizar cliente.");
    }
  };

  const handleAddCommunication = async () => {
    if (!newComm.notes.trim()) {
      showError("Descreva a comunicação antes de adicionar.");
      return;
    }

    try {
      await createCommunication({
        client_id: client.id,
        type: newComm.type,
        subject: newComm.subject || undefined,
        notes: newComm.notes,
        user_id: "current-user",
        date: new Date().toISOString(),
      });
      showSuccess("Comunicação registrada.");
      setNewComm({ type: 'note', subject: '', notes: '' });
      setShowAddCommunication(false);
    } catch (err) {
      showError("Falha ao registrar comunicação.");
    }
  };

  const getIconForType = (type: Communication['type']) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'call': return <Phone className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Ficha de Cliente: {client.name}</span>
            <div className="flex gap-2">
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Editar
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleSaveEdit}>
                    Salvar
                  </Button>
                </>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium">Nome</label>
                {isEditing ? (
                  <Input 
                    value={editData.name || ''} 
                    onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))} 
                  />
                ) : (
                  <p className="text-sm">{client.name}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Email</label>
                {isEditing ? (
                  <Input 
                    type="email"
                    value={editData.email || ''} 
                    onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))} 
                  />
                ) : (
                  <p className="text-sm">{client.email || "—"}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Telefone</label>
                {isEditing ? (
                  <Input 
                    value={editData.phone || ''} 
                    onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))} 
                  />
                ) : (
                  <p className="text-sm">{client.phone || "—"}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">NIF</label>
                {isEditing ? (
                  <Input 
                    value={editData.nif || ''} 
                    onChange={(e) => setEditData(prev => ({ ...prev, nif: e.target.value }))} 
                  />
                ) : (
                  <p className="text-sm">{client.nif || "—"}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Setor</label>
                  {isEditing ? (
                    <Select 
                      value={editData.sector || ''} 
                      onValueChange={(value) => setEditData(prev => ({ ...prev, sector: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                        <SelectItem value="Financeiro">Financeiro</SelectItem>
                        <SelectItem value="Saúde">Saúde</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm">{client.sector || "—"}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Persona</label>
                  {isEditing ? (
                    <Select 
                      value={editData.persona || ''} 
                      onValueChange={(value) => setEditData(prev => ({ ...prev, persona: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CEO">CEO</SelectItem>
                        <SelectItem value="CTO">CTO</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm">{client.persona || "—"}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Ciclo de Vida</label>
                {isEditing ? (
                  <Select 
                    value={editData.lifecycle_stage || 'Lead'} 
                    onValueChange={(value) => setEditData(prev => ({ ...prev, lifecycle_stage: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lead">Lead</SelectItem>
                      <SelectItem value="MQL">MQL</SelectItem>
                      <SelectItem value="SQL">SQL</SelectItem>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Perdido">Perdido</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline">{client.lifecycle_stage || "Lead"}</Badge>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Tags</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {client.tags?.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  )) || "—"}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Observações</label>
                {isEditing ? (
                  <Input 
                    value={editData.notes || ''} 
                    onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))} 
                  />
                ) : (
                  <p className="text-sm">{client.notes || "—"}</p>
                )}
              </div>
            </div>
          </div>

          {/* Timeline de Comunicações */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Histórico de Comunicações</h3>
              <Button variant="outline" size="sm" onClick={() => setShowAddCommunication(!showAddCommunication)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>

            {showAddCommunication && (
              <div className="p-4 border rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Select 
                    value={newComm.type} 
                    onValueChange={(value) => setNewComm(prev => ({ ...prev, type: value as Communication['type'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="call">Chamada</SelectItem>
                      <SelectItem value="meeting">Reunião</SelectItem>
                      <SelectItem value="note">Nota</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input 
                    placeholder="Assunto (opcional)" 
                    value={newComm.subject} 
                    onChange={(e) => setNewComm(prev => ({ ...prev, subject: e.target.value }))} 
                  />
                </div>
                <Input 
                  placeholder="Detalhes da comunicação..." 
                  value={newComm.notes} 
                  onChange={(e) => setNewComm(prev => ({ ...prev, notes: e.target.value }))} 
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddCommunication}>Salvar</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowAddCommunication(false)}>Cancelar</Button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Buscar por assunto ou conteúdo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="email">Emails</SelectItem>
                  <SelectItem value="call">Chamadas</SelectItem>
                  <SelectItem value="meeting">Reuniões</SelectItem>
                  <SelectItem value="note">Notas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {filteredCommunications.length > 0 ? (
                <VerticalTimeline layout="1-column-left" className="vertical-timeline-custom-line">
                  {filteredCommunications.map((comm) => (
                    <VerticalTimelineElement
                      key={comm.id}
                      className="vertical-timeline-element--work"
                      date={format(new Date(comm.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      iconStyle={{ background: 'rgb(33, 150, 243)', color: '#fff' }}
                      icon={getIconForType(comm.type)}
                    >
                      <h3 className="vertical-timeline-element-title">{comm.type}</h3>
                      {comm.subject && <h4 className="vertical-timeline-element-subtitle">{comm.subject}</h4>}
                      <p>{comm.notes}</p>
                      {comm.provider_meta?.threadId && (
                        <Badge variant="outline" className="mt-2">Thread: {comm.provider_meta.threadId}</Badge>
                      )}
                    </VerticalTimelineElement>
                  ))}
                </VerticalTimeline>
              ) : (
                <p className="text-muted-foreground text-center py-8">Nenhuma comunicação encontrada.</p>
              )}
            </div>
          </div>
        </div>

        {/*
          Intentionally removed explicit close button: user can click outside to close.
          Dialog supports overlay click to close by default.
        */}
      </DialogContent>
    </Dialog>
  );
};

export default ClientDetailModal;