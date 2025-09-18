"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useClients, type Client } from "@/hooks/useClients";
import { useCommunications } from "@/hooks/useCommunications";
import { useEvents } from "@/hooks/useEvents";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ClientDetailModal from "@/components/crm/ClientDetailModal";

const ClientsPage = () => {
  const { clients, loading, fetchClients, upsertClient } = useClients();
  const { communications, loading: commLoading, refreshCommunications } = useCommunications();
  const { events } = useEvents();
  const navigate = useNavigate();

  const [sectorFilter, setSectorFilter] = React.useState("all");
  const [personaFilter, setPersonaFilter] = React.useState("all");
  const [lifecycleFilter, setLifecycleFilter] = React.useState("all");
  const [tagFilter, setTagFilter] = React.useState<string[]>([]);
  const [editingTags, setEditingTags] = React.useState<string | null>(null);
  const [newTag, setNewTag] = React.useState("");
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  React.useEffect(() => {
    fetchClients();
    refreshCommunications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredClients = React.useMemo(() => {
    return clients.filter(client => {
      const matchesSector = sectorFilter === "all" || client.sector === sectorFilter;
      const matchesPersona = personaFilter === "all" || client.persona === personaFilter;
      const matchesLifecycle = lifecycleFilter === "all" || client.lifecycle_stage === lifecycleFilter;
      const matchesTags = tagFilter.length === 0 || tagFilter.every(tag => client.tags?.includes(tag));
      return matchesSector && matchesPersona && matchesLifecycle && matchesTags;
    });
  }, [clients, sectorFilter, personaFilter, lifecycleFilter, tagFilter]);

  const allTags = React.useMemo(() => {
    const tags = new Set<string>();
    clients.forEach(client => client.tags?.forEach(tag => tags.add(tag)));
    return Array.from(tags);
  }, [clients]);

  const handleAddTag = async (clientId: string) => {
    if (!newTag.trim()) return;
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    const updatedTags = [...(client.tags || []), newTag.trim()];
    await upsertClient({ ...client, tags: updatedTags });
    setNewTag("");
    setEditingTags(null);
  };

  const handleRemoveTag = async (clientId: string, tagToRemove: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    const updatedTags = (client.tags || []).filter(tag => tag !== tagToRemove);
    await upsertClient({ ...client, tags: updatedTags });
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setModalOpen(true);
  };

  const clientCommunications = React.useCallback((clientId?: string) => {
    if (!clientId) return [];
    return communications.filter((c) => c.client_id === clientId);
  }, [communications]);

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground">Gerencie clientes, histórico e ciclo de vida.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Setor</Label>
              <Select value={sectorFilter} onValueChange={setSectorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os setores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                  <SelectItem value="Financeiro">Financeiro</SelectItem>
                  <SelectItem value="Saúde">Saúde</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Persona</Label>
              <Select value={personaFilter} onValueChange={setPersonaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as personas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="CEO">CEO</SelectItem>
                  <SelectItem value="CTO">CTO</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ciclo de Vida</Label>
              <Select value={lifecycleFilter} onValueChange={setLifecycleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os ciclos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Lead">Lead</SelectItem>
                  <SelectItem value="MQL">MQL</SelectItem>
                  <SelectItem value="SQL">SQL</SelectItem>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Perdido">Perdido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1">
                {allTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={tagFilter.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setTagFilter(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Lista de Clientes</CardTitle>
            <div className="flex items-center gap-2">
              <Button onClick={() => navigate('/crm/clients/create')}>Novo Cliente</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Ciclo</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.email}</TableCell>
                      <TableCell>{c.phone}</TableCell>
                      <TableCell>{c.sector || "—"}</TableCell>
                      <TableCell>{c.lifecycle_stage || "Lead"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {c.tags?.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {editingTags === c.id ? (
                            <div className="flex gap-1 mt-1">
                              <Input
                                placeholder="Nova tag"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTag(c.id)}
                                className="w-20 h-6 text-xs"
                              />
                              <Button size="sm" onClick={() => handleAddTag(c.id)} className="h-6">Add</Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => setEditingTags(c.id)} className="h-6 text-xs">
                              + Tag
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleViewClient(c)}>Ver</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <ClientDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        client={selectedClient}
        communications={communications}
      />
    </>
  );
};

export default ClientsPage;