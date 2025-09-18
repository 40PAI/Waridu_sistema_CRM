"use client";

import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useClients } from "@/hooks/useClients";
import { useEvents } from "@/hooks/useEvents";
import { useCommunications } from "@/hooks/useCommunications";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Edit, Plus, Mail, Phone, MapPin, Calendar, DollarSign, Users, FileText, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { showSuccess, showError } from "@/utils/toast";
import ClientDetailModal from "@/components/crm/ClientDetailModal";
import GmailIntegration from "@/components/crm/GmailIntegration";

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
        <Card>
          <CardContent className="p-6">
            <p>Cliente não encontrado.</p>
            <Link to="/crm/clients">
              <Button variant="outline" className="mt-4">Voltar para Clientes</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Métricas rápidas
  const totalProjects = clientEvents.length;
  const confirmedProjects = clientEvents.filter(e => e.pipeline_status === 'Confirmado').length;
  const totalRevenue = clientEvents.reduce((sum, e) => sum + (e.estimated_value || 0), 0);
  const lastContact = clientCommunications.length > 0 ? clientCommunications[0].date : null;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/crm/clients">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{client.name}</h1>
            <p className="text-muted-foreground">{client.company || "Empresa não informada"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowEditModal(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button asChild>
            <Link to={`/crm/projects/new?client=${client.id}`}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Projeto
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Exportar PDF</DropdownMenuItem>
              <DropdownMenuItem>Excluir Cliente</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Avatar e Tags */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src="" />
          <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex gap-2">
          <Badge variant="outline">{client.lifecycle_stage || "Lead"}</Badge>
          {client.sector && <Badge variant="secondary">{client.sector}</Badge>}
          {client.persona && <Badge variant="secondary">{client.persona}</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações Principais */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Principais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{client.email || "Não informado"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{client.phone || "Não informado"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{client.address || "Não informado"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>NIF: {client.nif || "Não informado"}</span>
                </div>
              </div>
              {client.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium">Observações</h4>
                    <p className="text-sm text-muted-foreground">{client.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Métricas Rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{totalProjects}</p>
                    <p className="text-xs text-muted-foreground">Projetos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">AOA {totalRevenue.toLocaleString("pt-AO")}</p>
                    <p className="text-xs text-muted-foreground">Receita Estimada</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{confirmedProjects}</p>
                    <p className="text-xs text-muted-foreground">Confirmados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">
                      {lastContact ? format(new Date(lastContact), "dd/MM", { locale: ptBR }) : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">Último Contato</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Projetos Associados */}
          <Card>
            <CardHeader>
              <CardTitle>Projetos Associados</CardTitle>
              <CardDescription>Lista de projetos deste cliente.</CardDescription>
            </CardHeader>
            <CardContent>
              {clientEvents.length > 0 ? (
                <div className="space-y-2">
                  {clientEvents.map(event => (
                    <div key={event.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{event.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.startDate), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{event.pipeline_status || "Planejado"}</Badge>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/crm/projects/${event.id}`}>Ver</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum projeto associado.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Secundária */}
        <div className="space-y-6">
          {/* Integração Gmail */}
          <GmailIntegration />

          {/* Histórico de Comunicações */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Comunicações</CardTitle>
              <CardDescription>Últimas interações com este cliente.</CardDescription>
            </CardHeader>
            <CardContent>
              {clientCommunications.length > 0 ? (
                <div className="space-y-2">
                  {clientCommunications.slice(0, 5).map(comm => (
                    <div key={comm.id} className="p-2 border rounded">
                      <p className="font-medium">{comm.subject || comm.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(comm.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  ))}
                  {clientCommunications.length > 5 && (
                    <Button variant="outline" size="sm" className="w-full">
                      Ver Todas ({clientCommunications.length})
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhuma comunicação registrada.</p>
              )}
            </CardContent>
          </Card>

          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Comunicação
              </Button>
              <Button className="w-full" variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Enviar Email
              </Button>
            </CardContent>
          </Card>
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