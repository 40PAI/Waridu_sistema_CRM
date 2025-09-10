import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { CheckCircle, Circle, AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Task = {
  id: string;
  title: string;
  description?: string;
  done: boolean;
  has_issues?: boolean;
  issue_description?: string;
  created_at: string;
};

const MaterialManagerTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [issueTaskId, setIssueTaskId] = React.useState<string | null>(null);
  const [issueDescription, setIssueDescription] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .eq("assigned_to", user.id)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setTasks((data || []) as Task[]);
      } catch {
        showError("Erro ao carregar as tarefas.");
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [user]);

  const toggleTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const { error } = await supabase.from("tasks").update({ done: !task.done, has_issues: false, issue_description: null }).eq("id", id);
    if (error) return showError("Erro ao atualizar a tarefa.");
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done, has_issues: false, issue_description: "" } as any : t)));
  };

  const markAll = async (done: boolean) => {
    const ids = tasks.map((t) => t.id);
    if (!ids.length) return;
    const { error } = await supabase.from("tasks").update({ done }).in("id", ids);
    if (error) return showError("Erro ao atualizar as tarefas.");
    setTasks(tasks.map((t) => ({ ...t, done })));
  };

  const reportIssue = async () => {
    if (!issueTaskId) return;
    const { error } = await supabase.from("tasks").update({ has_issues: true, issue_description: issueDescription, done: false }).eq("id", issueTaskId);
    if (error) return showError("Erro ao reportar o problema.");
    setTasks(tasks.map((t) => (t.id === issueTaskId ? { ...t, has_issues: true, issue_description: issueDescription, done: false } as any : t)));
    showSuccess("Problema reportado com sucesso!");
    setIssueTaskId(null);
    setIssueDescription("");
  };

  const completed = tasks.filter((t) => t.done).length;

  if (loading) return <div className="flex items-center justify-center h-full"><p>Carregando tarefas...</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Minhas Tarefas</h1>
          <p className="text-sm text-muted-foreground">{completed} de {tasks.length} tarefas concluídas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => markAll(false)} disabled={completed === 0}>Desmarcar todas</Button>
          <Button onClick={() => markAll(true)} disabled={completed === tasks.length}>Marcar todas</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Tarefas</CardTitle>
          <CardDescription>Checklist de atividades do inventário e requisições.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tasks.length ? tasks.map((task) => (
            <div key={task.id} className="flex items-start space-x-3 p-3 rounded-lg border">
              <Checkbox id={task.id} checked={task.done} onCheckedChange={() => toggleTask(task.id)} className="mt-1" />
              <div className="grid gap-1.5 leading-none flex-1">
                <label htmlFor={task.id} className={`text-sm font-medium ${task.done ? "line-through text-muted-foreground" : ""}`}>{task.title}</label>
                {task.description && <p className={`text-sm text-muted-foreground ${task.done ? "line-through" : ""}`}>{task.description}</p>}
                {task.has_issues && (
                  <div className="mt-2 p-2 bg-yellow-100 border border-yellow-200 rounded-md">
                    <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4 text-yellow-600" /><span className="text-sm font-medium text-yellow-800">Problema Reportado</span></div>
                    <p className="text-sm text-yellow-700 mt-1">{task.issue_description}</p>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center gap-2">
                {task.done ? <CheckCircle className="h-5 w-5 text-green-500" /> : task.has_issues ? <AlertCircle className="h-5 w-5 text-yellow-500" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                {!task.done && !task.has_issues && (
                  <Dialog open={task.id === issueTaskId} onOpenChange={(open) => !open && setIssueTaskId(null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setIssueTaskId(task.id)} className="text-xs h-8">Problema</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reportar Problema</DialogTitle>
                        <DialogDescription>Descreva o problema encontrado na tarefa "{task.title}".</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="issue-description" className="text-right">Descrição</Label>
                          <Textarea id="issue-description" value={issueDescription} onChange={(e) => setIssueDescription(e.target.value)} className="col-span-3" placeholder="Descreva o problema..." />
                        </div>
                      </div>
                      <DialogFooter><Button onClick={reportIssue}>Reportar</Button></DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          )) : <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tarefa encontrada.</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialManagerTasks;