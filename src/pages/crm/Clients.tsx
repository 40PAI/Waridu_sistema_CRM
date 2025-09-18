"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useClients } from "@/hooks/useClients";
import { useEvents } from "@/hooks/useEvents";
import { useCommunications } from "@/hooks/useCommunications";
import { useServices } from "@/hooks/useServices";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import CreateClientModal from "@/components/crm/CreateClientModal";
import { useState } from "react";

const ClientsPage = () => {
  const { clients, fetchClients } = useClients();
  const { events } = useEvents();
  const { communications } = useCommunications();
  const { services } = useServices();

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Clientes</h1>
            <p className="text-sm text-muted-foreground">Gerencie clientes, histórico e ciclo de vida.</p>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setIsCreateOpen(true)}>+ Novo Cliente</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
            <CardDescription>Atribua roles diretamente para dar acesso às páginas.</CardDescription>
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
                    <TableHead>Tags</TableHead>
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
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {c.tags?.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/crm/clients/${c.id}`}>Ver</Link>
                        </Button>
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
          // When closed, ensure clients refreshed
          if (!v) {
            fetchClients();
          }
        }}
        onCreated={() => {
          // refresh clients list (useClients.upsertClient already refreshes but ensure)
          fetchClients();
        }}
      />
    </>
  );
};

export default ClientsPage;