"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ClientTableProps {
  clients: any[];
  serviceNameById: Record<string, string>;
  onViewClient: (clientId: string) => void;
  onEditClient: (client: any) => void;
}

const ClientTable: React.FC<ClientTableProps> = ({ clients, serviceNameById, onViewClient, onEditClient }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Clientes ({clients.length})</CardTitle>
        <CardDescription>Abrir a ficha do cliente em um modal para ver detalhes rapidamente.</CardDescription>
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
                <TableHead>Serviços</TableHead>
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
                      {(c.service_ids || []).map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {serviceNameById[tag] || tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => onViewClient(c.id)}>
                        Ver
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => onEditClient(c)}>
                        Editar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientTable;