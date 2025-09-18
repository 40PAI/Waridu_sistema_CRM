"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useClients } from "@/hooks/useClients";
import { useEvents } from "@/hooks/useEvents";
import { useCommunications } from "@/hooks/useCommunications";
import { useServices } from "@/hooks/useServices";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import CreateClientModal from "@/components/crm/CreateClientModal";
import ClientDetailModal from "@/components/crm/ClientDetailModal";
import { useState } from "react";
import { showSuccess } from "@/utils/toast";
import { MultiSelectServices } from "@/components/MultiSelectServices";

const ClientsPage = () => {
  const { clients, fetchClients } = useClients();
  const { events } = useEvents();
  const { communications } = useCommunications();
  const { services } = useServices();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [createdClientId, setCreatedClientId] = useState<string | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  // Modal state for "Ver"
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  // New: service filters (array of service ids)
  const [serviceFilter, setServiceFilter] = useState<string[]>([]);

  const openView = (clientId: string) => {
    setSelectedClientId(clientId);
    setIsViewOpen(true);
  };

  const closeView = () => {
    setIsViewOpen(false);
    setSelectedClientId(null);
  };

  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null;
  const selectedClientEvents = selectedClientId ? events.filter((e) => e.client_id === selectedClientId) : [];
  const selectedClientCommunications = selectedClientId ? communications.filter((c) => c.client_id === selectedClientId) : [];

  const handleEditClient = (client: any) => {
    setEditingClient(client);
    setIsCreateOpen(true);
  };

  const handleCreateClient = () => {
    setEditingClient(null);
    setIsCreateOpen(true);
  };

  const handleClientCreated = (clientId: string) => {
    setCreatedClientId(clientId);
    // Show suggestion to create project
    showSuccess("Cliente criado! Quer criar um projeto para ele?");
  };

  const handleCreateProjectForClient = () => {
    if (createdClientId) {
      setIsProjectModalOpen(true);
    }
  };

  // Filtering clients by selected services (match ANY selected service)
  const filteredClients = React.useMemo(() => {
    if (!serviceFilter || serviceFilter.length === 0) return clients;
    return clients.filter((c) => {
      const clientTags = c.tags || [];
      return clientTags.some((t: string) => serviceFilter.includes(t));
    });
  }, [clients, serviceFilter]);

  // Helper map service id -> name
  const serviceNameById = React.useMemo(() => {
    const map: Record<string, string> = {};
    services.forEach(s => (map[s.id] = s.name));
    return map;
  }, [services]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Clientes</h1>
            <p className="text-sm text-muted-foreground">Gerencie clientes, histórico e ciclo de vida.</p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleCreateClient}>+ Novo Cliente</Button>
          </div>
        </div>

        {createdClientId && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <p className="text-sm text-green-800">Cliente criado com sucesso! Quer criar um projeto para ele?</p>
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={handleCreateProjectForClient}>Criar Projeto</Button>
                <Button size="sm" variant="outline" onClick={() => setCreatedClientId(null)}>Depois</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters: services multi-select */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Filtre a lista de clientes por serviços de interesse (seleção múltipla)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:gap-4">
              <div className="flex-1">
                <MultiSelectServices selected={serviceFilter} onChange={setServiceFilter} />
              </div>
              <div className="flex items-center gap-2 mt-2 md:mt-0">
                <Button variant="outline" onClick={() => setServiceFilter([])}>Limpar filtros</Button>
              </div>
            </div>

            {/* Applied filters chips */}
            {serviceFilter.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {serviceFilter.map(id => (
                  <Badge key={id} variant="secondary" className="inline-flex items-center gap-2">
                    <span>{serviceNameById[id] || id}</span>
                    <button onClick={() => setServiceFilter(prev => prev.filter(x => x !== id))} className="ml-1">
                      ✕
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
            <CardDescription>Abrir a ficha do cliente em um modal para ver detalhes rapidamente.</CardDescription>
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
                    <TableHead>Serviços</TableHead>
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
                          {(c.service_ids || []).map((serviceId: string) => (
                            <Badge key={serviceId} variant="outline" className="text-xs">
                              {serviceNameById[serviceId] || serviceId}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openView(c.id)}>
                            Ver
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEditClient(c)}>
                            Editar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <CreateClientModal
        open={isCreateOpen}
        onOpenChange={(v) => {
          setIsCreateOpen(v);
          if (!v) setEditingClient(null);
          if (!v) {
            fetchClients();
          }
        }}
        onCreated={handleClientCreated}
        client={editingClient}
      />

      <ClientDetailModal
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        client={selectedClient}
        communications={selectedClientCommunications}
      />
    </>
  );
};

export default ClientsPage;