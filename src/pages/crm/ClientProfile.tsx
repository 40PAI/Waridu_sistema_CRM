"use client";

import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { useClients } from "@/hooks/useClients";
import { useEvents } from "@/hooks/useEvents";
import { useCommunications } from "@/hooks/useCommunications";
import ClientHeader from "@/components/crm/ClientHeader";
import ClientMetrics from "@/components/crm/ClientMetrics";
import ClientInfoCard from "@/components/crm/ClientInfoCard";
import ClientProjectsList from "@/components/crm/ClientProjectsList";
import ClientCommunications from "@/components/crm/ClientCommunications";
import QuickActions from "@/components/crm/QuickActions";
import GmailIntegration from "@/components/crm/GmailIntegration";
import ClientDetailModal from "@/components/crm/ClientDetailModal";

const ClientProfile = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { clients } = useClients();
  const { events } = useEvents();
  const { communications } = useCommunications();

  const client = clients.find(c => c.id === clientId);
  const clientEvents = events.filter(e => e.client_id === clientId);
  const clientCommunications = communications.filter(c => c.client_id === clientId);

  const [showEditModal, setShowEditModal] = React.useState(false);

  if (!client) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p>Cliente não encontrado.</p>
          <Link to="/crm/clients">
            <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Voltar para Clientes</button>
          </Link>
        </div>
      </div>
    );
  }

  const handleEdit = () => setShowEditModal(true);
  const handleAddProject = () => {
    // Navigate to create project with client pre-selected
    window.location.href = `/crm/projects/new?client=${client.id}`;
  };

  return (
    <div className="space-y-6">
      <ClientHeader 
        client={client} 
        onEdit={handleEdit} 
        onAddProject={handleAddProject} 
      />

      <ClientMetrics events={clientEvents} communications={clientCommunications} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          <ClientInfoCard client={client} />
          <ClientProjectsList events={clientEvents} clientId={client.id} />
        </div>

        {/* Coluna Secundária */}
        <div className="space-y-6">
          <GmailIntegration />
          <ClientCommunications 
            communications={clientCommunications} 
            onViewAll={() => setShowEditModal(true)}
            onAddNew={() => setShowEditModal(true)}
          />
          <QuickActions client={client} onAddCommunication={() => setShowEditModal(true)} />
        </div>
      </div>

      {/* Modal de Edição */}
      {showEditModal && (
        <ClientDetailModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          client={client}
          communications={clientCommunications}
        />
      )}
    </div>
  );
};

export default ClientProfile;