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
import type { Event, Roster, Expense, InventoryMaterial } from "@/types";
import { showSuccess, showError } from "@/utils/toast";
import { Employee } from "../employees/EmployeeDialog";
import { useAuth } from "@/contexts/AuthContext";
import { hasActionPermission } from "@/config/roles";
import { useAutoId } from "@/hooks/useAutoId";
import { useDirty } from "@/hooks/useDirty";

const EXPENSE_CATEGORIES = ["Transporte", "Alimentação", "Hospedagem", "Marketing", "Aluguel de Equipamento", "Outros"];

interface RosterDialogProps {
  event: Event;
  employees: Employee[];
  onSaveDetails: (eventId: number, details: { roster: Roster; expenses: Expense[] }) => void;
  onCreateMaterialRequest: (eventId: number, items: Record<string, number>, requestedBy: { name: string; email: string; role: string }) => void;
  materials: InventoryMaterial[];
  onRequestsChange?: () => void;
}

export function RosterDialog({ event, employees, onSaveDetails, onCreateMaterialRequest, materials, onRequestsChange }: RosterDialogProps) {
  // Generate unique IDs for form fields
  const getId = useAutoId('roster-dialog');
  
  // Ref for first field focus
  const firstFieldRef = React.useRef<HTMLInputElement>(null);
  
  const [open, setOpen] = React.useState(false);
  const [teamLead, setTeamLead] = React.useState("");
  const [selectedEmployees, setSelectedEmployees] = React.useState<Employee[]>([]);
  const [nameFilter, setNameFilter] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  
  const [materialFilter, setMaterialFilter] = React.useState("");
  const [selectedMaterials, setSelectedMaterials] = React.useState<Record<string, number>>({});
  
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);
  
  // Store initial values for dirty state detection
  const [initialValues, setInitialValues] = React.useState({
    teamLead: "",
    selectedEmployees: [] as Employee[],
    selectedMaterials: {} as Record<string, number>,
    expenses: [] as Expense[]
  });
  
  // Check if form has changes (dirty state)
  const currentValues = {
    teamLead,
    selectedEmployees,
    selectedMaterials,
    expenses
  };
  const isDirty = useDirty(initialValues, currentValues);

  const { user } = useAuth();
  const userRole = user?.profile?.role;
  const canAllocateMaterials = !!userRole && hasActionPermission(userRole, 'materials:write');

  const activeEmployees = React.useMemo(() => employees.filter(e => e.status === 'Ativo'), [employees]);

  React.useEffect(() => {
    if (open) {
      const initialTeamLead = event.roster?.teamLead || "";
      const fullTeamMembers = event.roster?.teamMembers
        .map(member => activeEmployees.find(e => e.id === member.id))
        .filter(Boolean) as Employee[];
      const initialSelectedEmployees = fullTeamMembers || [];
      const initialSelectedMaterials = event.roster?.materials || {};
      const initialExpenses = event.expenses || [];
      
      // Set current values
      setTeamLead(initialTeamLead);
      setSelectedEmployees(initialSelectedEmployees);
      setSelectedMaterials(initialSelectedMaterials);
      setExpenses(initialExpenses);
      
      // Set initial values for dirty state comparison
      setInitialValues({
        teamLead: initialTeamLead,
        selectedEmployees: initialSelectedEmployees,
        selectedMaterials: initialSelectedMaterials,
        expenses: initialExpenses
      });
      
      // Focus first field for accessibility
      setTimeout(() => {
        firstFieldRef.current?.focus();
      }, 100);
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
  }, [materialFilter, materials]);

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
    setExpenses([...expenses, { id: `exp-${Date.now()}`, description: "", amount: 0, category: "Outros" }]);
  };

  const handleUpdateExpense = (index: number, field: 'description' | 'amount' | 'category', value: string | number) => {
    const newExpenses = [...expenses];
    const expenseToUpdate = { ...newExpenses[index] };

    if (field === 'amount') {
      expenseToUpdate.amount = Number(value) || 0;
    } else if (field === 'description') {
      expenseToUpdate.description = String(value);
    } else if (field === 'category') {
      expenseToUpdate.category = String(value);
    }
    
    newExpenses[index] = expenseToUpdate;
    setExpenses(newExpenses);
  };

  const handleRemoveExpense = (index: number) => {
    const newExpenses = expenses.filter((_, i) => i !== index);
    setExpenses(newExpenses);
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);

    const rosterData: Roster = {
      teamLead,
      teamMembers: selectedEmployees.map(e => ({ id: e.id, name: e.name, role: e.role })),
      materials: canAllocateMaterials ? selectedMaterials : (event.roster?.materials || {}),
    };
    const details = {
      roster: rosterData,
      expenses: expenses,
    };

    if (!canAllocateMaterials) {
      const hasRequestedItems = Object.values(selectedMaterials).some(qty => qty > 0);
      if (hasRequestedItems) {
        if (!user || !user.email || !user.profile) {
          showError("Sessão inválida. Faça login novamente.");
          setIsSaving(false);
          return;
        }
        await onCreateMaterialRequest(event.id, selectedMaterials, {
          name: user.profile.first_name || user.email,
          email: user.email,
          role: user.profile.role,
        });
        showSuccess("Requisição de materiais enviada para aprovação.");
        if (onRequestsChange) {
          onRequestsChange();
        }
      }
    }

    try {
      await onSaveDetails(event.id, details);
      
      // For users without material allocation permission, reset selectedMaterials after request
      if (!canAllocateMaterials) {
        const effectiveMaterials = event.roster?.materials || {};
        setSelectedMaterials(effectiveMaterials);
        
        // Update initial values to reflect the clean state
        setInitialValues({
          teamLead,
          selectedEmployees,
          selectedMaterials: effectiveMaterials,
          expenses
        });
      } else {
        // For users with permission, update initial values to reflect saved state
        setInitialValues({
          teamLead,
          selectedEmployees,
          selectedMaterials,
          expenses
        });
      }
      
      if (canAllocateMaterials || Object.values(selectedMaterials).some(qty => qty > 0)) {
        showSuccess("Detalhes do evento salvos com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao salvar detalhes do evento:", error);
      showError("Erro ao salvar detalhes. Tente novamente.");
    }
    
    // DO NOT close modal - keep it open as requested
    setIsSaving(false);
  };

  const handleSendRequest = async () => {
    if (!user || !user.email || !user.profile) {
      console.error("Erro de autenticação:", { 
        hasUser: !!user, 
        hasEmail: !!user?.email, 
        hasProfile: !!user?.profile 
      });
      showError("Sessão inválida. Faça login novamente.");
      return;
    }
    
    const hasRequestedItems = Object.values(selectedMaterials).some(qty => qty > 0);
    if (!hasRequestedItems) {
      console.warn("Tentativa de envio de requisição sem materiais selecionados");
      showError("Selecione pelo menos um material para requisitar.");
      return;
    }

    try {
      console.log("Enviando requisição de materiais:", {
        eventId: event.id,
        materials: selectedMaterials,
        requestedBy: {
          name: user.profile.first_name || user.email,
          email: user.email,
          role: user.profile.role,
        }
      });

      await onCreateMaterialRequest(event.id, selectedMaterials, {
        name: user.profile.first_name || user.email,
        email: user.email,
        role: user.profile.role,
      });
      
      showSuccess("Requisição de materiais enviada para o gestor de materiais.");
      if (onRequestsChange) {
        onRequestsChange();
      }
    } catch (error: any) {
      console.error("Erro ao enviar requisição de materiais:", {
        error,
        message: error?.message,
        code: error?.code,
        details: error?.details || error?.detail,
        eventId: event.id,
        selectedMaterials
      });
      
      // Show detailed error message if available
      const errorMessage = error?.message || error?.details?.message || error?.detail || "Erro desconhecido";
      showError(`Erro ao enviar requisição: ${errorMessage}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">{event.roster ? "Editar Detalhes" : "Gerenciar Evento"}</Button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-[800px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={getId('title')}
        aria-describedby={getId('description')}
      >
        <DialogHeader>
          <DialogTitle id={getId('title')}>Gerenciar Evento: {event.name}</DialogTitle>
          <DialogDescription id={getId('description')}>Selecione a equipe, materiais e adicione despesas para este evento.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="equipe" className="pt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="equipe">Equipe</TabsTrigger>
            <TabsTrigger value="materiais">Materiais</TabsTrigger>
            <TabsTrigger value="despesas">Despesas</TabsTrigger>
          </TabsList>
          <TabsContent value="equipe" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label id={getId('team-lead-label')}>Responsável pela Equipe</Label>
              <Combobox
                options={employeeOptions}
                value={teamLead}
                onChange={setTeamLead}
                placeholder="Selecione o responsável..."
                searchPlaceholder="Buscar funcionário..."
                emptyMessage="Nenhum funcionário encontrado."
                aria-labelledby={getId('team-lead-label')}
              />
            </div>
            <div className="space-y-2">
              <Label id={getId('team-members-label')}>Membros da Equipe</Label>
              <div className="flex gap-2">
                <Input 
                  id={getId('name-filter')}
                  name="nameFilter"
                  autoComplete="off"
                  placeholder="Filtrar por nome..." 
                  value={nameFilter} 
                  onChange={(e) => setNameFilter(e.target.value)}
                  ref={firstFieldRef}
                  aria-label="Filtrar funcionários por nome"
                />
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger 
                    className="w-[200px]"
                    id={getId('role-filter')}
                    aria-label="Filtrar funcionários por função"
                  >
                    <SelectValue />
                  </SelectTrigger>
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
                      <Button 
                        type="button"
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7" 
                        onClick={() => handleSelectEmployee(emp)}
                        aria-label={`Adicionar ${emp.name} à equipe`}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
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
                      <Button 
                        type="button"
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7 text-destructive" 
                        onClick={() => handleDeselectEmployee(emp)}
                        aria-label={`Remover ${emp.name} da equipe`}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="materiais" className="space-y-4 mt-4">
            <Input 
              id={getId('material-filter')}
              name="materialFilter"
              autoComplete="off"
              placeholder="Buscar material..." 
              value={materialFilter} 
              onChange={(e) => setMaterialFilter(e.target.value)}
              aria-label="Filtrar materiais por nome"
            />
            <ScrollArea className="h-80 rounded-md border p-4">
              <div className="space-y-3">
                {filteredMaterials.map((material) => (
                  <div key={material.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 flex-shrink min-w-0">
                      <Label htmlFor={getId(`mat-${material.id}`)} className="truncate" title={material.name}>
                        {material.name} <span className="text-xs text-muted-foreground">({Object.values(material.locations).reduce((a, b) => a + b, 0)})</span>
                      </Label>
                    </div>
                    <Input 
                      id={getId(`mat-${material.id}`)}
                      name={`material-${material.id}`}
                      type="number" 
                      autoComplete="off"
                      className="h-8 w-20" 
                      value={selectedMaterials[material.id] || ''} 
                      placeholder="0" 
                      onChange={(e) => handleQuantityChange(material.id, parseInt(e.target.value) || 0, Object.values(material.locations).reduce((a, b) => a + b, 0))} 
                      min={0} 
                      max={Object.values(material.locations).reduce((a, b) => a + b, 0)}
                      aria-label={`Quantidade de ${material.name}`}
                    />
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
                <Button type="button" variant="outline" size="sm" onClick={handleAddExpense}>
                  <PlusCircle className="h-4 w-4 mr-2" /> Adicionar Despesa
                </Button>
            </div>
            <ScrollArea className="h-80 rounded-md border p-4">
                <div className="space-y-4">
                {expenses.length > 0 ? expenses.map((expense, index) => (
                    <div key={expense.id} className="flex items-center gap-2">
                      <Input
                          id={getId(`expense-desc-${index}`)}
                          name={`expense-description-${index}`}
                          autoComplete="off"
                          placeholder="Descrição"
                          value={expense.description}
                          onChange={(e) => handleUpdateExpense(index, 'description', e.target.value)}
                          className="flex-1"
                          aria-label={`Descrição da despesa ${index + 1}`}
                      />
                      <Select value={expense.category || ''} onValueChange={(value) => handleUpdateExpense(index, 'category', value)}>
                        <SelectTrigger 
                          className="w-[200px]"
                          id={getId(`expense-cat-${index}`)}
                          aria-label={`Categoria da despesa ${index + 1}`}
                        >
                          <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPENSE_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input
                          id={getId(`expense-amount-${index}`)}
                          name={`expense-amount-${index}`}
                          type="number"
                          autoComplete="off"
                          placeholder="Valor"
                          value={expense.amount || ''}
                          onChange={(e) => handleUpdateExpense(index, 'amount', e.target.value)}
                          className="w-32"
                          aria-label={`Valor da despesa ${index + 1}`}
                      />
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleRemoveExpense(index)}
                        aria-label={`Remover despesa ${index + 1}`}
                      >
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
        <DialogFooter className="flex justify-between">
          <Button 
            type="button"
            variant="outline" 
            onClick={handleSendRequest} 
            disabled={!Object.values(selectedMaterials).some(qty => qty > 0)}
          >
            Enviar Requisição
          </Button>
          <Button 
            type="button" 
            onClick={handleSave} 
            disabled={isSaving || !isDirty}
          >
            {isSaving ? "Salvando..." : "Salvar Detalhes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}