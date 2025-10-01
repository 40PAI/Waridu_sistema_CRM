"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Mail, Phone, Calendar, MessageSquare, FileText } from "lucide-react";
import { useCommunications } from "@/hooks/useCommunications";
import { showSuccess, showError } from "@/utils/toast";
import type { Client } from "@/hooks/useClients";

interface QuickActionsProps {
  client: Client;
  onAddCommunication?: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ client, onAddCommunication }) => {
  const { createCommunication } = useCommunications();

  const handleQuickCommunication = async (type: 'email' | 'call' | 'meeting' | 'note', subject?: string) => {
    try {
      await createCommunication({
        client_id: client.id,
        type,
        subject,
        notes: `Comunicação rápida - ${type}`,
        user_id: "current-user", // TODO: get from auth
        date: new Date().toISOString(),
      });
      showSuccess(`${type} registrado com sucesso!`);
      if (onAddCommunication) onAddCommunication();
    } catch (err) {
      showError(`Erro ao registrar ${type}.`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button 
          className="w-full" 
          variant="outline" 
          onClick={() => handleQuickCommunication('email', 'Email enviado')}
        >
          <Mail className="h-4 w-4 mr-2" />
          Email Enviado
        </Button>
        <Button 
          className="w-full" 
          variant="outline" 
          onClick={() => handleQuickCommunication('call', 'Chamada realizada')}
        >
          <Phone className="h-4 w-4 mr-2" />
          Chamada Realizada
        </Button>
        <Button 
          className="w-full" 
          variant="outline" 
          onClick={() => handleQuickCommunication('meeting', 'Reunião agendada')}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Reunião Agendada
        </Button>
        <Button 
          className="w-full" 
          variant="outline" 
          onClick={() => handleQuickCommunication('note', 'Nota interna')}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Nota Interna
        </Button>
        <Button 
          className="w-full" 
          variant="outline" 
          onClick={onAddCommunication}
        >
          <Plus className="h-4 w-4 mr-2" />
          Comunicação Detalhada
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuickActions;