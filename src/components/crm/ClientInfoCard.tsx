"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, MapPin, FileText } from "lucide-react";
import type { Client } from "@/hooks/useClients";

interface ClientInfoCardProps {
  client: Client;
}

const ClientInfoCard: React.FC<ClientInfoCardProps> = ({ client }) => {
  return (
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
  );
};

export default ClientInfoCard;