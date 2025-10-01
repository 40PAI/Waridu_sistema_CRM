"use client";

import * as React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Edit, Plus, MoreHorizontal, ArrowLeft } from "lucide-react";
import type { Client } from "@/hooks/useClients";

interface ClientHeaderProps {
  client: Client;
  onEdit: () => void;
  onAddProject: () => void;
}

const ClientHeader: React.FC<ClientHeaderProps> = ({ client, onEdit, onAddProject }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/crm/clients" className="inline-flex">
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

      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback>{client.name?.charAt(0) ?? "C"}</AvatarFallback>
        </Avatar>

        <div className="flex gap-2 items-center">
          <Badge variant="outline">{client.lifecycle_stage || "Lead"}</Badge>
          {client.sector && <Badge variant="secondary">{client.sector}</Badge>}
          {client.persona && <Badge variant="secondary">{client.persona}</Badge>}
        </div>
      </div>
    </div>
  );
};

export default ClientHeader;