"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useServices } from "@/hooks/useServices";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function CommercialServicesPage() {
  const { services } = useServices();
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    return services.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));
  }, [services, query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Serviços Waridu</h1>
        <p className="text-sm text-muted-foreground">Catálogo de serviços (apenas leitura). Gerido pela Administração.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catálogo (Leitura)</CardTitle>
          <CardDescription>Este catálogo é gerido pela Administração.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input placeholder="Pesquisar por nome..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Criação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(svc => (
                  <TableRow key={svc.id}>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">{svc.name}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{svc.description || "Sem descrição"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="max-w-lg truncate">{svc.description || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={svc.status && String(svc.status).toLowerCase() === "ativo" ? "default" : "secondary"}>
                        {svc.status ? String(svc.status) : (svc.status === undefined ? "Ativo" : "Inativo")}
                      </Badge>
                    </TableCell>
                    <TableCell>{svc.created_at ? new Date(svc.created_at).toLocaleString() : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filtered.length === 0 && <div className="py-6 text-center text-muted-foreground">Nenhum serviço encontrado.</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}