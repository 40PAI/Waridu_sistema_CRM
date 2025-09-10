import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { CheckCircle, Circle } from "lucide-react";

type Task = {
  id: string;
  title: string;
  description?: string;
  done: boolean;
};

// Mock data - will be replaced with real data from state
const mockTasks: Task[] = [
  { id: "1", title: "Verificar equipamentos de áudio", description: "Testar microfones e mixers antes do evento", done: true },
  { id: "2", title: "Preparar cabos e conectores", description: "Organizar e verificar todos os cabos necessários", done: false },
  { id: "3", title: "Configurar iluminação", description: "Montar e testar o setup de iluminação", done: false },
  { id: "4", title: "Revisar roteiro do evento", description: "Familiarizar-se com a ordem do dia", done: true },
];

const TechnicianTasks = () => {
  const [tasks, setTasks] = React.useState<Task[]>(mockTasks);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, done: !task.done } : task
    ));
  };

  const markAll = (done: boolean) => {
    setTasks(tasks.map(task => ({ ...task, done })));
  };

  const completedTasks = tasks.filter(task => task.done).length;
  const totalTasks = tasks.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Minhas Tarefas</h1>
          <p className="text-sm text-muted-foreground">
            Checklist de tarefas para seus eventos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => markAll(false)} disabled={completedTasks === 0}>
            Desmarcar todas
          </Button>
          <Button onClick={() => markAll(true)} disabled={completedTasks === totalTasks}>
            Marcar todas
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Tarefas</CardTitle>
          <CardDescription>
            {completedTasks} de {totalTasks} tarefas concluídas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tasks.length > 0 ? tasks.map((task) => (
            <div key={task.id} className="flex items-start space-x-3">
              <Checkbox 
                id={task.id} 
                checked={task.done} 
                onCheckedChange={() => toggleTask(task.id)}
                className="mt-1"
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor={task.id}
                  className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                    task.done ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {task.title}
                </label>
                {task.description && (
                  <p className={`text-sm text-muted-foreground ${task.done ? "line-through" : ""}`}>
                    {task.description}
                  </p>
                )}
              </div>
              <div className="ml-auto">
                {task.done ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma tarefa encontrada.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TechnicianTasks;