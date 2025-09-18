"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import type { Event } from "@/types";

interface ClientProjectsListProps {
  events: Event[];
  clientId: string;
}

const ClientProjectsList: React.FC<ClientProjectsListProps> = ({ events, clientId }) => {
  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Projetos Associados</CardTitle>
          <CardDescription>Lista de projetos deste cliente.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p>Nenhum projeto associado.</p>
            <Button asChild className="mt-4">
              <Link to={`/crm/projects/new?client=${clientId}`}>
                Criar Primeiro Projeto
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projetos Associados</CardTitle>
        <CardDescription>Lista de projetos deste cliente.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {events.map(event => (
            <div key={event.id} className="flex items-center justify-between p-3 border rounded">
              <div className="flex-1">
                <p className="font-medium">{event.name}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(event.startDate), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                  {event.estimated_value && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      AOA {event.estimated_value.toLocaleString("pt-AO")}
                    </span>
                  )}
                </div>
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
      </CardContent>
    </Card>
  );
};

export default ClientProjectsList;