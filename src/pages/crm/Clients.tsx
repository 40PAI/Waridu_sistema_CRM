"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useClients } from "@/hooks/useClients";
import { useCommunications } from "@/hooks/useCommunications";
import { useEvents } from "@/hooks/useEvents";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ClientsPage = () => {
  const { clients, loading, fetchClients } = useClients();
  const { communications, loading: commLoading, refreshCommunications } = useCommunications();
  const { events } = useEvents();
  const navigate = useNavigate();

  React.useEffect(() => {
    fetchClients();
    refreshCommunications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clientCommunications = React.useCallback((clientId?: string) => {
    if (!clientId) return [];
    return communications.filter((c) => c.client_id === clientId);
  }, [communications]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Clientes</h1>
        <p className="text-sm text-muted-foreground">Gerencie clientes, histórico e ciclo de vida.</p>
      </div>

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
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell>{c.phone}</TableCell>
                    <TableCell>{c.sector || "—"}</TableCell>
                    <TableCell>{c.lifecycle_stage || "Lead"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/crm/clients/${c.id}`)}>Ver</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Example: Show timeline for first client when selected */}
      {clients[0] && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Comunicações — {clients[0].name}</CardTitle>
          </CardHeader>
          <CardContent>
            {commLoading ? (
              <p>Carregando comunicações...</p>
            ) : (
              <>
                {clientCommunications(clients[0].id).length > 0 ? (
                  <div className="space-y-3">
                    {clientCommunications(clients[0].id).map((comm) => (
                      <div key={comm.id} className="border-l-2 pl-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{comm.type} {comm.subject ? `— ${comm.subject}` : ""}</div>
                            <div className="text-sm text-muted-foreground">{comm.notes}</div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {comm.date ? format(new Date(comm.date), "dd/MM/yyyy HH:mm", { locale: ptBR }) : ""}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhuma comunicação registrada para este cliente.</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClientsPage;