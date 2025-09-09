import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { Role, Event } from "@/App";
import { Employee } from "@/components/employees/EmployeeDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface RoleDetailPageProps {
  roles: Role[];
  employees: Employee[];
  events: Event[];
}

type Task = { id: string; title: string; done: boolean };

const defaultTasksByRole: Record<string, string[]> = {
  "Gerente de Eventos": [
    "Revisar cronograma do evento",
    "Confirmar equipe e materiais",
    "Alinhar com cliente e fornecedores",
  ],
  "Técnico de Som": [
    "Checar microfones e mixers",
    "Testar PA e retorno",
    "Montar e passar o som",
  ],
  "Coordenadora": [
    "Acompanhar check-in",
    "Sincronizar comunicação da equipe",
    "Garantir cumprimento do roteiro",
  ],
  "Assistente": [
    "Apoiar montagem",
    "Apoiar logística",
    "Auxiliar equipe técnica",
  ],
  "Técnico de Luz": [
    "Montar iluminação",
    "Programar cenas",
    "Operar durante o evento",
  ],
  "VJ": [
    "Organizar conteúdos visuais",
    "Ajustar mapeamento",
    "Operar VJ set",
  ],
};

const RoleDetailPage = ({ roles, employees, events }: RoleDetailPageProps) => {
  const { roleId } = useParams();
  const role = roles.find((r) => r.id === roleId);

  const employeesInRole = React.useMemo(
    () => (role ? employees.filter((e) => e.role === role.name) : []),
    [employees, role]
  );

  const eventsForRole = React.useMemo(() => {
    if (!role) return [];
    return events.filter((ev) =>
      ev.roster?.teamMembers?.some((m) => m.role === role.name)
    );
  }, [events, role]);

  const initialTasks: Task[] = React.useMemo(() => {
    const base = role ? defaultTasksByRole[role.name] || [
      "Verificar responsabilidades",
      "Confirmar agenda",
      "Reportar status",
    ] : [];
    return base.map((t, idx) => ({ id: `${idx}`, title: t, done: false }));
  }, [role]);

  const [tasks, setTasks] = React.useState<Task[]>(initialTasks);

  React.useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const toggleTask = (id: string, done: boolean) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done } : t)));
  };

  const markAll = (done: boolean) => {
    setTasks((prev) => prev.map((t) => ({ ...t, done })));
  };

  if (!role) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Função não encontrada</CardTitle>
          <CardDescription>Verifique se a função ainda existe.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/roles">
            <Button variant="outline">Voltar para Funções</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">{role.name}</h1>
          <p className="text-sm text-muted-foreground">
            Equipe, eventos e tarefas desta função.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => markAll(false)}>Desmarcar todas</Button>
          <Button onClick={() => markAll(true)}>Marcar todas</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Equipe ({employeesInRole.length})</CardTitle>
            <CardDescription>Funcionários com esta função.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {employeesInRole.length > 0 ? employeesInRole.map((emp) => (
              <div key={emp.id} className="flex items-center justify-between border rounded-md p-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={emp.avatar} />
                    <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{emp.name}</p>
                    <p className="text-xs text-muted-foreground">{emp.email}</p>
                  </div>
                </div>
                <Badge variant={emp.status === "Ativo" ? "default" : "secondary"}>
                  {emp.status}
                </Badge>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">Nenhum funcionário nesta função.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Checklist de Tarefas</CardTitle>
            <CardDescription>Atividades típicas para esta função.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.map((task) => (
              <label key={task.id} className="flex items-center gap-3 text-sm">
                <Checkbox checked={task.done} onCheckedChange={(v) => toggleTask(task.id, Boolean(v))} />
                <span className={task.done ? "line-through text-muted-foreground" : ""}>{task.title}</span>
              </label>
            ))}
            {tasks.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma tarefa definida.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Eventos Relacionados ({eventsForRole.length})</CardTitle>
          <CardDescription>Eventos onde esta função está escalada.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventsForRole.length > 0 ? eventsForRole.map((ev) => (
                <TableRow key={ev.id}>
                  <TableCell className="font-medium">{ev.name}</TableCell>
                  <TableCell>
                    {ev.startDate}{ev.endDate && ev.endDate !== ev.startDate ? ` - ${ev.endDate}` : ""}
                  </TableCell>
                  <TableCell>{ev.location}</TableCell>
                  <TableCell>
                    <Badge variant={ev.status === "Planejado" ? "secondary" : ev.status === "Em Andamento" ? "default" : ev.status === "Concluído" ? "outline" : "destructive"}>
                      {ev.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Nenhum evento relacionado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Link to="/roles">
          <Button variant="outline">Voltar</Button>
        </Link>
      </div>
    </div>
  );
};

export default RoleDetailPage;