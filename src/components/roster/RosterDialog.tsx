import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Combobox } from "@/components/ui/combobox";
import { PlusCircle, XCircle, Trash2 } from "lucide-react";
import { Event, Roster, Expense } from "@/App";
import { showSuccess, showError } from "@/utils/toast";
import { Employee } from "../employees/EmployeeDialog";
import { useAuth } from "@/contexts/AuthContext";
import { hasActionPermission } from "@/config/roles";

// Mock data
const materials = [
    { id: 'MAT001', name: 'Câmera Sony A7S III', totalQuantity: 5 },
    { id: 'MAT002', name: 'Lente Canon 24-70mm', totalQuantity: 8 },
    { id: 'MAT003', name: 'Kit de Luz Aputure 300D', totalQuantity: 3 },
    { id: 'MAT004', name: 'Microfone Rode NTG5', totalQuantity: 10 },
    { id: 'MAT005', name: 'Tripé Manfrotto', totalQuantity: 12 },
    { id: 'MAT006', name: 'Cabo HDMI 10m', totalQuantity: 30 },
    { id: 'MAT007', name: 'Gravador Zoom H6', totalQuantity: 4 },
    { id: 'MAT008', name: 'Monitor de Referência', totalQuantity: 2 },
];

interface RosterDialogProps {
  event: Event;
  employees: Employee[];
  onSaveDetails: (eventId: number, details: { roster: Roster; expenses: Expense[] }) => void;
  onCreateMaterialRequest: (eventId: number, items: Record<string, number>, requestedBy: { name: string; email: string; role: string }) => void;
}

export function RosterDialog({ event, employees, onSaveDetails, onCreateMaterialRequest }: RosterDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [teamLead, setTeamLead] = React.useState("");
  const [selectedEmployees, setSelectedEmployees] = React.useState<Employee[]>([]);
  const [nameFilter, setNameFilter] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  
  const [materialFilter, setMaterialFilter] = React.useState("");
  const [selectedMaterials, setSelectedMaterials] = React.useState<Record<string, number>>({});
  
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);

  const { user } = useAuth();
  const canAllocateMaterials = !!user && hasActionPermission(user.role, 'materials:write');

  const activeEmployees = React.useMemo(() => employees.filter(e => e.status === 'Ativo'), [employees]);

  React.useEffect(() => {
    if (open) {
      setTeamLead(event.roster?.teamLead || "");
      const fullTeamMembers = event.roster?.teamMembers
        .map(member => activeEmployees.find(e => e.id === member.id))
        .filter(Boolean) as Employee[];
      setSelectedEmployees(fullTeamMembers || []);
      setSelectedMaterials(event.roster?.materials || {});
      setExpenses(event.expenses || []);
    } else {
      setTeamLead("");
      setSelectedEmployees([]);
      setSelectedMaterials({});
      setExpenses([]);
      setNameFilter("");
      setRoleFilter("all");
      setMaterialFilter("");
      setIsSaving(false);
    }
  }, [open, event, activeEmployees]);

  const employeeRoles = React.useMemo(() => ["all", ...new Set(activeEmployees.map(e => e.role))], [activeEmployees]);
  const employeeOptions = React.useMemo(() => activeEmployees.map(e => ({ value: e.id, label: e.name })), [activeEmployees]);

  const availableEmployees = React.useMemo(() => {
    return activeEmployees
      .filter(employee => {
        if (employee.id === teamLead) return false;
        if (selectedEmployees.some(selected => selected.id === employee.id)) return false;
        const nameMatch = employee.name.toLowerCase().includes(nameFilter.toLowerCase());
        const roleMatch = roleFilter === 'all' || employee.role === roleFilter;
        return nameMatch && roleMatch;
      });
  }, [selectedEmployees, nameFilter, roleFilter, activeEmployees, teamLead]);

  const filteredMaterials = React.useMemo(() => {
    return materials.filter(material => material.name.toLowerCase().includes(materialFilter.toLowerCase()));
  }, [materialFilter]);

  const handleSelectEmployee = (employee: Employee) => setSelectedEmployees(prev => [...prev, employee]);
  const handleDeselectEmployee = (employee: Employee) => setSelectedEmployees(prev => prev.filter(e => e.id !== employee.id));

  const handleQuantityChange = (materialId: string, quantity: number, maxQuantity: number) => {
    if (quantity > maxQuantity) quantity = maxQuantity;
    if (quantity <= 0) {
        const newSelection = { ...selectedMaterials };
        delete newSelection[materialId];
        setSelectedMaterials(newSelection);
    } else {
        setSelectedMaterials(prev => ({ ...prev, [materialId]: quantity }));
    }
  };

  const handleAddExpense = () => {
    setExpenses([...expenses, { id: `exp-${Date.now()}`, description: "", amount: 0 }]);
  };

  const handleUpdateExpense = (index: number, field: 'description' | 'amount', value: string | number) => {
    const newExpenses = [...expenses];
    if (field === 'amount') {
      newExpenses[index][field] = Number(value) || 0;
    } else {
      newExpenses[index][field] = String(value);
    }
    setExpenses(newExpenses);
  };

  const handleRemoveExpense = (index: number) => {
    const newExpenses = expenses.filter((_, i) => i !== index);
    setExpenses(newExpenses);
  };

  const handleSave = () => {
    if (isSaving) return;
    setIsSaving(true);

    const rosterData: Roster = {
      teamLead,
      teamMembers: selectedEmployees.map(e => ({ id: e.id, name: e.name, role: e.role })),
      materials: canAllocateMaterials ? selectedMaterials : {}, // se não puder alocar, não grava materiais
    };
    const details = {
      roster: rosterData,
      expenses: expenses,
    };

    if (!canAllocateMaterials) {
      const hasRequestedItems = Object.values(selectedMaterials).some(qty => qty > 0);
      if (hasRequestedItems) {
        if (!user) {
          showError("Sessão inválida. Faça login novamente.");
          setIsSaving(false);
          return;
        }
        onCreateMaterialRequest(event.id, selectedMaterials, {
          name: user.name,
          email: user.email,
          role: user.role,
        });
        showSuccess("Requisição de materiais enviada para aprovação.");
      }
      onSaveDetails(event.id, details);
      showSuccess("Detalhes da equipe/ despesas salvos.");
      setOpen(false);
      setIsSaving(false);
      return;
    }

    onSaveDetails(event.id, details);
    showSuccess("Detalhes do evento salvos com sucesso!");
    setOpen(false);
    setIsSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">{event.roster ? "Editar Detalhes" : "Gerenciar Evento"}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Evento: {event.name}</DialogTitle>
          <DialogDescription>Selecione a equipe, materiais e adicione despesas para este evento.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="equipe" className="pt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="equipe">Equipe</TabsTrigger>
            <TabsTrigger value="materiais">Materiais</TabsTrigger>
            <TabsTrigger value="despesas">Despesas</TabsTrigger>
          </TabsList>
          <TabsContent value="equipe" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Responsável pela Equipe</Label>
              <Combobox
                options={employeeOptions}
                value={teamLead}
                onChange={setTeamLead}
                placeholder="Selecione o responsável..."
                searchPlaceholder="Buscar funcionário..."
                emptyMessage="Nenhum funcionário encontrado."
              />
            </div>
            <div className="space-y-2">
              <Label>Membros da Equipe</Label>
              <div className="flex gap-2">
                <Input placeholder="Filtrar por nome..." value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} />
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {employeeRoles.map(role => <SelectItem key={role} value={role}>{role === 'all' ? 'Todas as Funções' : role}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 items-start">
              <div className="space-y-2">
                <Label>Disponíveis ({availableEmployees.length})</Label>
                <ScrollArea className="h-48 rounded-md border">
                  {availableEmployees.map(emp => (
                    <div key={emp.id} className="flex items-center justify-between p-2 border-b">
                      <div className="text-sm">
                        <p className="font-medium">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">{emp.role}</p>
                      </div>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSelectEmployee(emp)}><PlusCircle className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </ScrollArea>
              </div>
              <div className="space-y-2">
                <Label>Selecionados ({selectedEmployees.length})</Label>
                <ScrollArea className="h-48 rounded-md border">
                  {selectedEmployees.map(emp => (
                    <div key={emp.id} className="flex items-center justify-between p-2 border-b">
                      <div className="text-sm">
                        <p className="font-medium">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">{emp.role}</p>
                      </div>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeselectEmployee(emp)}><XCircle className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="materiais" className="space-y-4 mt-4">
            <Input placeholder="Buscar material..." value={materialFilter} onChange={(e) => setMaterialFilter(e.target.value)} />
            <ScrollArea className="h-80 rounded-md border p-4">
              <div className="space-y-3">
                {filteredMaterials.map((material) => (
                  <div key={material.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 flex-shrink min-w-0">
                      <Label htmlFor={`mat-${material.id}`} className="truncate" title={material.name}>
                        {material.name} <span className="text-xs text-muted-foreground">({material.totalQuantity})</span>
                      </Label>
                    </div>
                    <Input type="number" className="h-8 w-20" value={selectedMaterials[material.id] || ''} placeholder="0" onChange={(e) => handleQuantityChange(material.id, parseInt(e.target.value) || 0, material.totalQuantity)} min={0} max={material.totalQuantity} />
                  </div>
                ))}
              </div>
            </ScrollArea>
            {!canAllocateMaterials && (
              <p className="text-xs text-muted-foreground">
                Você não possui permissão para alocar diretamente. Um pedido será enviado para aprovação.
              </p>
            )}
          </TabsContent>
          <TabsContent value="despesas" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
                <Label>Despesas Adicionais</Label>
                <Button variant="outline" size="sm" onClick={handleAddExpense}>
                <PlusCircle className="h-4 w-4 mr-2" /> Adicionar Despesa
                </Button>
            </div>
            <ScrollArea className="h-80 rounded-md border p-4">
                <div className="space-y-4">
                {expenses.length > 0 ? expenses.map((expense, index) => (
                    <div key={expense.id} className="flex items-center gap-2">
                    <Input
                        placeholder="Descrição (ex: Aluguel de equipamento)"
                        value={expense.description}
                        onChange={(e) => handleUpdateExpense(index, 'description', e.target.value)}
                        className="flex-1"
                    />
                    <Input
                        type="number"
                        placeholder="Valor"
                        value={expense.amount || ''}
                        onChange={(e) => handleUpdateExpense(index, 'amount', e.target.value)}
                        className="w-32"
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveExpense(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    </div>
                )) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhuma despesa adicionada.</p>
                )}
                </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar Detalhes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}