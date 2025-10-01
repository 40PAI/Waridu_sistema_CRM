import * as React from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import type { Event, Expense } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

interface ExpenseManagerProps {
  events: Event[];
  onUpdateEventDetails: (eventId: number, details: { roster?: any; expenses: Expense[] }) => void;
  loading: boolean;
}

const EXPENSE_CATEGORIES = ["Transporte", "Alimentação", "Hospedagem", "Marketing", "Aluguel de Equipamento", "Outros"];

const ExpenseManager = ({ events, onUpdateEventDetails, loading }: ExpenseManagerProps) => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingExpense, setEditingExpense] = React.useState<{ eventId: number; expense: Expense } | null>(null);
  
  const [selectedEvent, setSelectedEvent] = React.useState<string>("");
  const [description, setDescription] = React.useState("");
  const [amount, setAmount] = React.useState<number | "">("");
  const [category, setCategory] = React.useState("");

  const allExpenses = React.useMemo(() => {
    return events.flatMap(event => 
      (event.expenses || []).map(expense => ({
        ...expense,
        eventId: event.id,
        eventName: event.name,
      }))
    );
  }, [events]);

  const openDialog = (data: { eventId: number; expense: Expense } | null = null) => {
    setEditingExpense(data);
    if (data) {
      setSelectedEvent(String(data.eventId));
      setDescription(data.expense.description);
      setAmount(data.expense.amount);
      setCategory(data.expense.category || "Outros");
    } else {
      setSelectedEvent("");
      setDescription("");
      setAmount("");
      setCategory("");
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!selectedEvent || !description || !amount || !category) {
      showError("Todos os campos são obrigatórios.");
      return;
    }

    const eventId = Number(selectedEvent);
    const event = events.find(e => e.id === eventId);
    if (!event) {
      showError("Evento não encontrado.");
      return;
    }

    const newExpense: Expense = {
      id: editingExpense ? editingExpense.expense.id : `exp-${Date.now()}`,
      description,
      amount: Number(amount),
      category,
    };

    let updatedExpenses: Expense[];
    if (editingExpense) {
      updatedExpenses = (event.expenses || []).map(exp => 
        exp.id === editingExpense.expense.id ? newExpense : exp
      );
    } else {
      updatedExpenses = [...(event.expenses || []), newExpense];
    }

    onUpdateEventDetails(eventId, { roster: event.roster, expenses: updatedExpenses });
    showSuccess("Despesa salva com sucesso!");
    setIsDialogOpen(false);
  };

  const handleDelete = (eventId: number, expenseId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const updatedExpenses = (event.expenses || []).filter(exp => exp.id !== expenseId);
    onUpdateEventDetails(eventId, { roster: event.roster, expenses: updatedExpenses });
    showSuccess("Despesa removida com sucesso!");
  };

  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => openDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Despesa
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Evento</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Valor (AOA)</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allExpenses.length > 0 ? allExpenses.map(exp => (
            <TableRow key={exp.id}>
              <TableCell>{exp.eventName}</TableCell>
              <TableCell>{exp.description}</TableCell>
              <TableCell>{exp.category || 'N/A'}</TableCell>
              <TableCell>{exp.amount.toLocaleString('pt-AO')}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => openDialog({ eventId: exp.eventId, expense: exp })}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(exp.eventId, exp.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center">Nenhuma despesa registrada.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingExpense ? "Editar Despesa" : "Adicionar Despesa"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="event">Evento</Label>
              <Select value={selectedEvent} onValueChange={setSelectedEvent} disabled={!!editingExpense}>
                <SelectTrigger id="event"><SelectValue placeholder="Selecione um evento" /></SelectTrigger>
                <SelectContent>
                  {events.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input id="description" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category"><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (AOA)</Label>
              <Input id="amount" type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpenseManager;