import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { CheckCircle, Circle, AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { showSuccess, showError } from "@/utils/toast";

type Task = {
  id: string;
  title: string;
  description?: string;
  done: boolean;
  hasIssues?: boolean;
  issueDescription?: string;
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
  const [issueTaskId, setIssueTaskId] = React.useState<string | null>(null);
  const [issueDescription, setIssueDescription] = React.useState("");

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, done: !task.done, hasIssues: false, issueDescription: "" } : task
    ));
  };

  const markAll = (done: boolean) => {
    setTasks(tasks.map(task => ({ ...task, done })));
  };

  const openIssueDialog = (id: string) => {
    setIssueTaskId(id);
    const task = tasks.find(t => t.id === id);
    setIssueDescription(task?.issueDescription || "");
  };

  const reportIssue = () => {
    if (!issueTaskId) return;
    
    setTasks(tasks.map(task => 
      task.id === issueTaskId 
        ? { ...task, hasIssues: true, issueDescription, done: false } 
        : task
    ));
    
    // In a real app, this would send a notification to coordinators/admins
    showSuccess("Problema reportado com sucesso!");
    setIssueTaskId(null);
    setIssueDescription("");
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
            <div key={task.id} className="flex items-start space-x-3 p-3 rounded-lg border">
              <Checkbox 
                id={task.id} 
                checked={task.done} 
                onCheckedChange={() => toggleTask(task.id)}
                className="mt-1"
              />
              <div className="grid gap-1.5 leading-none flex-1">
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
                {task.hasIssues && (
                  <div className="mt-2 p-2 bg-yellow-100 border border-yellow-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">Problema Reportado</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">{task.issueDescription}</p>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center gap-2">
                {task.done ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : task.hasIssues ? (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
                {!task.done && !task.hasIssues && (
                  <Dialog open={issueTaskId === task.id} onOpenChange={(open) => !open && setIssueTaskId(null)}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openIssueDialog(task.id)}
                        className="text-xs h-8"
                      >
                        Problema
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reportar Problema</DialogTitle>
                        <DialogDescription>
                          Descreva o problema encontrado com a tarefa "{task.title}".
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="issue-description" className="text-right">
                            Descrição
                          </Label>
                          <Textarea
                            id="issue-description"
                            value={issueDescription}
                            onChange={(e) => setIssueDescription(e.target.value)}
                            className="col-span-3"
                            placeholder="Descreva o problema encontrado..."
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={reportIssue}>Reportar</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
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