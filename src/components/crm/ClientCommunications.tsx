"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Calendar, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Communication } from "@/hooks/useCommunications";

interface ClientCommunicationsProps {
  communications: Communication[];
  onViewAll?: () => void;
  onAddNew?: () => void;
}

const ClientCommunications: React.FC<ClientCommunicationsProps> = ({ 
  communications, 
  onViewAll, 
  onAddNew 
}) => {
  const getIcon = (type: Communication['type']) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'call': return <Phone className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  if (communications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Comunicações</CardTitle>
          <CardDescription>Últimas interações com este cliente.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p>Nenhuma comunicação registrada.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={onAddNew}>
              Adicionar Comunicação
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Comunicações</CardTitle>
        <CardDescription>Últimas interações com este cliente.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {communications.slice(0, 5).map(comm => (
            <div key={comm.id} className="p-2 border rounded">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getIcon(comm.type)}
                  <Badge variant="outline" className="text-xs">{comm.type}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(comm.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </span>
              </div>
              {comm.subject && <p className="font-medium text-sm mt-1">{comm.subject}</p>}
              <p className="text-sm text-muted-foreground mt-1">{comm.notes}</p>
            </div>
          ))}
          {communications.length > 5 && (
            <Button variant="outline" size="sm" className="w-full" onClick={onViewAll}>
              Ver Todas ({communications.length})
            </Button>
          )}
        </div>
       <dyad-write path="src/components/crm/ClientHeader.tsx" description="Criando componente de cabeçalho da ficha do cliente">
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Edit, Plus, MoreHorizontal, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import type { Client } from "@/hooks/useClients";

interface ClientHeaderProps {
  client: Client;
  onEdit: () => void;
  onAddProject: () => void;
}

const ClientHeader: React.FC<ClientHeaderProps> = ({ client, onEdit, onAddProject }) => {
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
          <Button onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button onClick={onAddProject}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Projeto
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
    </div>
  );
};

export default ClientHeader;