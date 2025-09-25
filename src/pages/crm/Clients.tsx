"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useClients } from "@/hooks/useClients";
import { useEvents } from "@/hooks/useEvents";
import { useCommunications } from "@/hooks/useCommunications";
import { useServices } from "@/hooks/useServices";
import { useClientFilters } from "@/hooks/useClientFilters";
import { showSuccess } from "@/utils/toast";
import CreateClientModal from "@/components/crm/CreateClientModal";
import ClientDetailModal from "@/components/crm/ClientDetailModal";
import ClientFilters from "@/components/crm/ClientFilters";
import ClientTable from "@/components/crm/ClientTable";
import CreateProjectModal from "@/components/crm/CreateProjectModal";
import { useState } from "react";

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

  const openView = (clientId: string) => {
    setSelectedClientId(clientId);
    setIsViewOpen(true);
  };

  const closeView = () => {
    setIsViewOpen(false);
    setSelectedClientId(null);
  };

  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null;
  const selectedClientEvents = selectedClientId ? (events || []).filter((e) => e.client_id === selectedClientId) : []; // Safely access events
  const selectedClientCommunications = selectedClientId ? (communications || []).filter((c) => c.client_id === selectedClientId) : [];

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
    showSuccess("Cliente criado! Quer criar um projeto para ele?");
  };

  const handleCreateProjectForClient = () => {
    if (createdClientId) {
      setIsProjectModalOpen(true);
    }
  };

  const handleCreateProjectFromModal = (clientId: string) => {
    setCreatedClientId(clientId);
    setIsProjectModalOpen(true);
    setIsViewOpen(false); // Fechar o modal de detalhes
  };

  // Helper maps
  const clientEventsMap = React.useMemo(() => {
    const map: Record<string, any[]> = {};
    (events || []).forEach(e => { // Safely access events
      if (e.client_id) {
        if (!map[e.client_id]) map[e.client_id] = [];
        map[e.client_id].push(e);
      }
    });
    return map;
  }, [events]);

  const clientCommunicationsMap = React.useMemo(() => {
    const map: Record<string, any[]> = {};
    (communications || []).forEach(c => {
      if (c.client_id) {
        if (!map[c.client_id]) map[c.client_id] = [];
        map[c.client_id].push(c);
      }
    });
    return map;
  }, [communications]);

  // Use the custom hook for filters
  const {
    filters,
    activeFilters,
    filteredClients,
    activeFiltersCount,
    updateFilter,
    toggleActiveFilter,
    clearFilters,
  } = useClientFilters(clients, clientEventsMap, clientCommunicationsMap);

  // Service name map for display
  const serviceNameById = React.useMemo(() => {
    const map: Record<string, string> = {};
    services.forEach(s => (map[s.id] = s.name));
    return map;
  }, [services]);

  React.useEffect(() => {
    // This effect is now handled inside the hook
  }, [clients]);

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

        <ClientFilters
          filters={filters}
          activeFilters={activeFilters}
          activeFiltersCount={activeFiltersCount}
          onUpdateFilter={updateFilter}
          onToggleActiveFilter={toggleActiveFilter}
          onClearFilters={clearFilters}
          onApplyFilters={() => {}} // Filters are applied in real-time via the hook
        />

        <ClientTable
          clients={filteredClients}
          serviceNameById={serviceNameById}
          onViewClient={openView}
          onEditClient={handleEditClient}
        />
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
        onCreateProject={handleCreateProjectFromModal}
      />

      <CreateProjectModal
        open={isProjectModalOpen}
        onOpenChange={(v) => {
          setIsProjectModalOpen(v);
          if (!v) setCreatedClientId(null);
        }}
        preselectedClientId={createdClientId}
      />
    </>
  );
};

export default ClientsPage;