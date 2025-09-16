"use client";

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar as CalendarIcon, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface Project {
  id: number;
  name: string;
  client_id?: string;
  pipeline_status?: string;
  service_ids?: string[];
  estimated_value?: number;
  startDate: string;
  tags?: string[]; // Add tags
}

interface Props {
  projects: Project[];
  clientsMap: Record<string, any>;
}

const getStatusBadge = (status?: string) => {
  switch (status) {
    case '1º Contato': return <Badge className="bg-gray-100 text-gray-800">1º Contato</Badge>;
    case 'Orçamento': return <Badge className="bg-blue-100 text-blue-800">Orçamento</Badge>;
    case 'Negociação': return <Badge className="bg-yellow-100 text-yellow-800">Negociação</Badge>;
    case 'Confirmado': return <Badge className="bg-green-100 text-green-800">Confirmado</Badge>;
    default: return <Badge className="bg-gray-100 text-gray-800">1º Contato</Badge>;
  }
};

const ProjectsTable: React.FC<Props> = ({ projects, clientsMap }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Projetos Recentes</CardTitle>
        <CardDescription>Últimos projetos adicionados ao pipeline.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Serviços</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Tags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map(project => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">{project.name}</TableCell>
                    <TableCell>{project.client_id ? clientsMap[project.client_id]?.name || 'Não definido' : 'Não definido'}</TableCell>
                    <TableCell>{getStatusBadge(project.pipeline_status)}</TableCell>
                    <TableCell>{project.service_ids?.length || 0}</TableCell>
                    <TableCell>{project.estimated_value ? `AOA ${project.estimated_value.toLocaleString("pt-AO")}` : '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <CalendarIcon className="h-3 w-3" />
                        {format(new Date(project.startDate), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell>
                      {project.tags && project.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {project.tags.map(tag => (
                            <Badge key={tag} variant={tag === 'urgente' ? 'destructive' : 'secondary'} className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p>Nenhum projeto recente.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectsTable;