import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TaskTableProps {
  tasks: any[];
  eventMap: Record<number, string>;
  onEdit: (task: any) => void;
  onDelete: (taskId: string) => void;
}

export const TaskTable = ({ tasks, eventMap, onEdit, onDelete }: TaskTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead>Atribuída a</TableHead>
          <TableHead>Evento</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Data de Criação</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.length > 0 ? tasks.map(({ task, employee }) => (
          <TableRow key={task.id}>
            <TableCell className="font-medium max-w-[200px] truncate">{task.title}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={employee?.avatar} />
                  <AvatarFallback>{employee?.name?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{employee?.name || "Não atribuída"}</p>
                  <p className="text-xs text-muted-foreground">{employee?.email}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>{eventMap[task.event_id] || "Sem evento"}</TableCell>
            <TableCell>
              <Badge variant={task.done ? "default" : "secondary"}>
                {task.done ? "Concluída" : "Pendente"}
              </Badge>
            </TableCell>
            <TableCell>{format(new Date(task.created_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
            <TableCell className="text-right space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEdit(task)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
              <Button variant="outline" size="sm" className="text-destructive" onClick={() => onDelete(task.id)}>
                <Trash2 className="h-4 w-4 mr-1" />
                Remover
              </Button>
            </TableCell>
          </TableRow>
        )) : (
          <TableRow>
            <TableCell colSpan={6} className="text-center h-24">
              Nenhuma tarefa encontrada.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};