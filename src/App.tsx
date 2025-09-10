import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import RosterManagement from "@/pages/RosterManagement";
import FinanceDashboard from "@/pages/FinanceDashboard";
import AdminSettings from "@/pages/AdminSettings";
import InviteMember from "@/pages/InviteMember";
import CalendarPage from "@/pages/Calendar";
import CreateEventPage from "@/pages/CreateEvent";
import MaterialsPage, { Material as PageMaterial } from "@/pages/Materials";
import EmployeesPage from "@/pages/Employees";
import RolesPage from "@/pages/Roles";
import RoleDetailPage from "@/pages/RoleDetail";
import LoginPage from "@/pages/Login";
import MaterialRequestsPage from "@/pages/MaterialRequests";
import { Employee } from "@/components/employees/EmployeeDialog";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import DebugPage from "@/pages/Debug";
import { Role as ConfigRole } from "@/config/roles"; // Importar o tipo Role de config

const queryClient = new QueryClient();

// Definindo as interfaces
export interface Expense {
  id: string;
  description: string;
  amount: number;
}

export interface Roster {
  teamLead: string;
  teamMembers: { id: string; name: string; role: string }[];
  materials: Record<string, number>;
}

export type EventStatus = 'Planejado' | 'Em Andamento' | 'Concluído' | 'Cancelado';

export interface Event {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  startTime?: string;
  endTime?: string;
  revenue?: number;
  roster?: Roster;
  expenses?: Expense[];
  status: EventStatus;
  description?: string;
}

export interface Role {
  id: string;
  name: ConfigRole; // Usar o tipo de função do config
}

// Inventário
interface Location {
  id: string;
  name: string;
}

type MaterialStatus = 'Disponível' | 'Em uso' | 'Manutenção';

export interface InventoryMaterial {
  id: string;
  name: string;
  status: MaterialStatus;
  category: string;
  description: string;
  locations: Record<string, number>; // distribuição por localização
}

interface AllocationHistoryEntry {
  id: string;
  date: string;
  eventId: number;
  eventName: string;
  materials: Record<string, number>;
}

// Requisições de Materiais (novo)
export type MaterialRequestStatus = 'Pendente' | 'Aprovada' | 'Rejeitada';

export interface MaterialRequestItem {
  materialId: string;
  quantity: number;
}

export interface MaterialRequest {
  id: string;
  eventId: number;
  items: MaterialRequestItem[];
  requestedBy: { name: string; email: string; role: string };
  status: MaterialRequestStatus;
  reason?: string; // motivo da rejeição (quando houver)
  createdAt: string;
  decidedAt?: string;
}

const App = () => {
  const initialEvents: Event[] = [
    { id: 1, name: "Conferência Anual de Tecnologia", startDate: "2024-08-15", endDate: "2024-08-17", location: "Centro de Convenções", startTime: "09:00", endTime: "18:00", revenue: 50000, expenses: [{id: 'exp1', description: 'Catering', amount: 5000}], status: 'Concluído', description: 'Evento anual para discutir as novas tendências em tecnologia.' },
    { id: 2, name: "Lançamento do Produto X", startDate: "2024-09-01", endDate: "2024-09-01", location: "Sede da Empresa", startTime: "19:00", endTime: "22:00", revenue: 25000, status: 'Planejado' },
    { id: 3, name: "Workshop de Marketing Digital", startDate: "2024-09-10", endDate: "2024-09-12", location: "Online", startTime: "14:00", endTime: "17:00", revenue: 10000, status: 'Planejado' },
    { id: 4, name: "Festa de Fim de Ano", startDate: "2024-12-20", endDate: "2024-12-20", location: "Salão de Festas", startTime: "20:00", revenue: 75000, status: 'Cancelado' },
    { id: 5, name: "Imersão de Vendas Q3", startDate: "2024-09-09", endDate: "2024-09-13", location: "Hotel Fazenda", status: 'Em Andamento', description: 'Treinamento intensivo para a equipe de vendas.' },
  ];

  const initialEmployees: Employee[] = [
    { id: 'EMP001', name: 'Ana Silva', role: 'Admin', email: 'ana.silva@email.com', avatar: '/avatars/01.png', status: 'Ativo', costPerDay: 500 },
    { id: 'EMP002', name: 'Carlos Souza', role: 'Técnico', email: 'carlos.souza@email.com', avatar: '/avatars/02.png', status: 'Ativo', costPerDay: 350 },
    { id: 'EMP003', name: 'Beatriz Costa', role: 'Coordenador', email: 'beatriz.costa@email.com', avatar: '/avatars/03.png', status: 'Inativo', costPerDay: 400 },
    { id: 'EMP004', name: 'Daniel Martins', role: 'Gestor de Material', email: 'daniel.martins@email.com', avatar: '/avatars/04.png', status: 'Ativo', costPerDay: 200 },
  ];

  const initialLocations: Location[] = [
    { id: 'loc-1', name: 'Armazém' },
    { id: 'loc-2', name: 'Estúdio A' },
  ];

  const initialMaterials: InventoryMaterial[] = [
    { id: 'MAT001', name: 'Câmera Sony A7S III', status: 'Disponível', category: 'Câmeras', description: 'Câmera mirrorless full-frame com alta sensibilidade.', locations: { 'loc-1': 5 } },
    { id: 'MAT002', name: 'Lente Canon 24-70mm', status: 'Em uso', category: 'Lentes', description: 'Lente zoom padrão versátil com abertura f/2.8.', locations: { 'loc-1': 8 } },
    { id: 'MAT003', name: 'Kit de Luz Aputure 300D', status: 'Disponível', category: 'Iluminação', description: 'Kit de iluminação LED potente com 3 pontos de luz.', locations: { 'loc-1': 3 } },
    { id: 'MAT004', name: 'Microfone Rode NTG5', status: 'Manutenção', category: 'Áudio', description: 'Microfone shotgun profissional para gravação de áudio direcional.', locations: { 'loc-1': 10 } },
    { id: 'MAT005', name: 'Tripé Manfrotto', status: 'Disponível', category: 'Acessórios', description: 'Tripé de vídeo robusto com cabeça fluida.', locations: { 'loc-1': 12 } },
    { id: 'MAT006', name: 'Cabo HDMI 10m', status: 'Disponível', category: 'Cabos', description: 'Cabo HDMI 2.0 de alta velocidade com 10 metros.', locations: { 'loc-1': 30 } },
    { id: 'MAT007', name: 'Gravador Zoom H6', status: 'Em uso', category: 'Áudio', description: 'Gravador de áudio portátil com 6 canais.', locations: { 'loc-1': 4 } },
    { id: 'MAT008', name: 'Monitor de Referência', status: 'Disponível', category: 'Acessórios', description: 'Monitor de 7 polegadas para referência de vídeo em campo.', locations: { 'loc-1': 2 } },
  ];

  const [events, setEvents] = useState<Event[]>(() => {
    try {
      const storedEvents = localStorage.getItem('events');
      return storedEvents ? JSON.parse(storedEvents) : initialEvents;
    } catch (error) {
      console.error("Failed to parse events from localStorage", error);
      return initialEvents;
    }
  });

  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [roles, setRoles] = useState<Role[]>([
    { id: 'role-1', name: 'Admin' },
    { id: 'role-2', name: 'Técnico' },
    { id: 'role-3', name: 'Coordenador' },
    { id: 'role-4', name: 'Gestor de Material' },
    { id: 'role-5', name: 'Financeiro' },
  ]);

  const [locations, setLocations] = useState<Location[]>(initialLocations);
  const [materials, setMaterials] = useState<InventoryMaterial[]>(initialMaterials);
  const [allocationHistory, setAllocationHistory] = useState<AllocationHistoryEntry[]>([]);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  
  useEffect(() => {
    try {
      localStorage.setItem('events', JSON.stringify(events));
    } catch (error) {
      console.error("Failed to save events to localStorage", error);
    }
  }, [events]);

  // Carregar requisições do Supabase
  useEffect(() => {
    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from('material_requests')
        .select(`
          id, 
          event_id, 
          requested_by_id,
          requested_by_details, 
          status, 
          reason, 
          created_at, 
          decided_at,
          material_request_items(material_id, quantity)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Erro ao buscar requisições:", error);
        return;
      }

      const formattedRequests: MaterialRequest[] = (data || []).map((req: any) => ({
        id: req.id,
        eventId: req.event_id,
        requestedBy: req.requested_by_details || { name: 'Desconhecido', email: '', role: '' },
        status: req.status as MaterialRequestStatus,
        reason: req.reason,
        createdAt: req.created_at,
        decidedAt: req.decided_at,
        items: (req.material_request_items || []).map((item: any) => ({
          materialId: item.material_id,
          quantity: item.quantity
        }))
      }));

      setMaterialRequests(formattedRequests);
    };

    fetchRequests();
  }, []);

  // Eventos
  const addEvent = (newEventData: Omit<Event, 'id' | 'roster' | 'expenses' | 'status'>) => {
    setEvents(prevEvents => [
      ...prevEvents,
      { ...newEventData, id: prevEvents.length > 0 ? Math.max(...prevEvents.map(e => e.id)) + 1 : 1, status: 'Planejado' }
    ]);
  };

  const updateEvent = (updatedEvent: Event) => {
    setEvents(prevEvents => {
      const prev = prevEvents.find(e => e.id === updatedEvent.id);
      const becameConcluded = prev && prev.status !== 'Concluído' && updatedEvent.status === 'Concluído';
      if (becameConcluded && updatedEvent.roster?.materials) {
        const historyEntry: AllocationHistoryEntry = {
          id: `hist-${Date.now()}`,
          date: new Date().toLocaleString('pt-AO'),
          eventId: updatedEvent.id,
          eventName: updatedEvent.name,
          materials: { ...updatedEvent.roster.materials },
        };
        setAllocationHistory(h => [historyEntry, ...h]);
      }
      return prevEvents.map(event =>
        event.id === updatedEvent.id ? updatedEvent : event
      );
    });
  };

  const updateEventDetails = (eventId: number, details: { roster: Roster; expenses: Expense[] }) => {
    setEvents(prevEvents =>
      prevEvents.map(event =>
        event.id === eventId ? { ...event, roster: details.roster, expenses: details.expenses } : event
      )
    );
  };

  // Funcionários
  const saveEmployee = (employeeData: Omit<Employee, 'id' | 'avatar'> & { id?: string }) => {
    if (employeeData.id) {
      setEmployees(prev => 
        prev.map(emp => 
          emp.id === employeeData.id ? { ...emp, ...employeeData } as Employee : emp
        )
      );
    } else {
      const newEmployee: Employee = {
        ...employeeData,
        id: `EMP${String(employees.length + 1).padStart(3, '0')}`,
        avatar: `/avatars/0${Math.floor(Math.random() * 4) + 1}.png`,
      };
      setEmployees(prev => [...prev, newEmployee]);
    }
  };

  // Funções
  const addRole = (roleName: ConfigRole) => { // Usar o tipo de função do config
    const newRole: Role = {
      id: `role-${Date.now()}`,
      name: roleName,
    };
    setRoles(prev => [...prev, newRole]);
  };

  const updateRole = (roleId: string, newName: ConfigRole) => { // Usar o tipo de função do config
    setRoles(prev => prev.map(r => r.id === roleId ? { ...r, name: newName } : r));
  };

  const deleteRole = (roleId: string) => {
    setRoles(prev => prev.filter(r => r.id !== roleId));
  };

  // Convidar membro via Edge Function
  const inviteMember = async (email: string, roleId: string) => {
    const roleName = roles.find(r => r.id === roleId)?.name || "Técnico";
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const { data, error } = await supabase.functions.invoke(
      "https://lqateupwzmedotgvcacp.supabase.co/functions/v1/invite-member",
      {
        body: { email, roleId, roleName },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );

    if (error) {
      return { ok: false as const, error: error.message || "Falha ao enviar convite" };
    }

    return { ok: true as const };
  };

  // Localizações
  const addLocation = (name: string) => {
    const id = `loc-${Date.now()}`;
    setLocations(prev => [...prev, { id, name }]);
  };

  const updateLocation = (id: string, name: string) => {
    setLocations(prev => prev.map(l => l.id === id ? { ...l, name } : l));
  };

  const deleteLocation = (id: string) => {
    setLocations(prev => {
      if (prev.length <= 1) {
        console.warn("Não é possível remover a única localização existente.");
        return prev;
      }
      const remaining = prev.filter(l => l.id !== id);
      const fallback = remaining[0];
      setMaterials(mats => mats.map(m => {
        const qty = m.locations[id] || 0;
        if (!qty) return m;
        const newLocs = { ...m.locations };
        delete newLocs[id];
        newLocs[fallback.id] = (newLocs[fallback.id] || 0) + qty;
        return { ...m, locations: newLocs };
      }));
      return remaining;
    });
  };

  // Materiais
  const saveMaterial = (materialData: Omit<PageMaterial, 'id' | 'locations'> & { id?: string }) => {
    if (materialData.id) {
      setMaterials(prev =>
        prev.map(m => m.id === materialData.id ? {
          ...m,
          name: materialData.name,
          category: materialData.category,
          status: materialData.status as MaterialStatus,
          description: materialData.description,
        } : m)
      );
    } else {
      const firstLoc = locations[0];
      const newMat: InventoryMaterial = {
        id: `MAT${Math.floor(Math.random() * 900) + 100}`,
        name: materialData.name,
        category: materialData.category,
        status: materialData.status as MaterialStatus,
        description: materialData.description,
        locations: firstLoc ? { [firstLoc.id]: materialData.quantity } : {},
      };
      setMaterials(prev => [...prev, newMat]);
    }
  };

  const transferMaterial = (materialId: string, fromLocationId: string, toLocationId: string, quantity: number) => {
    setMaterials(prev => prev.map(m => {
      if (m.id !== materialId) return m;
      const available = m.locations[fromLocationId] || 0;
      if (quantity <= 0 || quantity > available) return m;
      const newLocs = { ...m.locations };
      newLocs[fromLocationId] = available - quantity;
      newLocs[toLocationId] = (newLocs[toLocationId] || 0) + quantity;
      return { ...m, locations: newLocs };
    }));
  };

  // Requisições de materiais
  const createMaterialRequest = async (eventId: number, items: Record<string, number>, requestedBy: { name: string; email: string; role: string }) => {
    const normalizedItems = Object.entries(items)
      .filter(([_, qty]) => qty > 0)
      .map(([materialId, quantity]) => ({ materialId, quantity }));

    if (normalizedItems.length === 0) {
      return;
    }

    const { data: requestHeader, error: headerError } = await supabase
      .from('material_requests')
      .insert({
        event_id: eventId,
        requested_by_details: requestedBy,
        status: 'Pendente',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (headerError) {
      console.error("Erro ao criar cabeçalho da requisição:", headerError);
      showError("Falha ao enviar requisição. Tente novamente.");
      return;
    }

    const requestId = requestHeader.id;

    const itemsToInsert = normalizedItems.map(item => ({
      request_id: requestId,
      material_id: item.materialId,
      quantity: item.quantity
    }));

    if (itemsToInsert.length > 0) {
      const { error: itemsError } = await supabase
        .from('material_request_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error("Erro ao inserir itens da requisição:", itemsError);
        showError("Falha ao enviar itens da requisição.");
        return;
      }
    }

    const newRequest: MaterialRequest = {
      id: requestId,
      eventId: eventId,
      items: normalizedItems,
      requestedBy: requestedBy,
      status: 'Pendente',
      createdAt: requestHeader.created_at,
    };
    setMaterialRequests(prev => [newRequest, ...prev]);
    showSuccess("Requisição de materiais enviada com sucesso!");
  };

  const approveMaterialRequest = async (requestId: string) => {
    const req = materialRequests.find((r) => r.id === requestId);
    if (!req || req.status !== "Pendente") return { ok: false, shortages: [] as any[] } as const;

    const shortages: { materialId: string; needed: number; available: number }[] = [];
    req.items.forEach((it) => {
      const mat = materials.find((m) => m.id === it.materialId);
      const available = mat ? Object.values(mat.locations).reduce((a, b) => a + b, 0) : 0;
      if (available < it.quantity) {
        shortages.push({ materialId: it.materialId, needed: it.quantity, available });
      }
    });
    if (shortages.length > 0) {
      return { ok: false, shortages } as const;
    }

    setMaterials((prev) =>
      prev.map((m) => {
        const item = req.items.find((it) => it.materialId === m.id);
        if (!item) return m;
        let remaining = item.quantity;
        const newLocs = { ...m.locations };
        for (const locId of Object.keys(newLocs)) {
          if (remaining <= 0) break;
          const have = newLocs[locId] || 0;
          const take = Math.min(have, remaining);
          newLocs[locId] = have - take;
          remaining -= take;
        }
        return { ...m, locations: newLocs };
      })
    );

    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== req.eventId) return ev;
        const currentMaterials = ev.roster?.materials || {};
        const merged: Record<string, number> = { ...currentMaterials };
        req.items.forEach((it) => {
          merged[it.materialId] = (merged[it.materialId] || 0) + it.quantity;
        });
        const newRoster: Roster = {
          teamLead: ev.roster?.teamLead || "",
          teamMembers: ev.roster?.teamMembers || [],
          materials: merged,
        };
        return { ...ev, roster: newRoster };
      })
    );

    const { error } = await supabase
      .from('material_requests')
      .update({ 
        status: 'Aprovada', 
        decided_at: new Date().toISOString() 
      })
      .eq('id', requestId);

    if (error) {
      console.error("Erro ao aprovar requisição:", error);
      showError("Falha ao aprovar requisição.");
      return { ok: false, shortages: [] } as const;
    }

    setMaterialRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: "Aprovada", decidedAt: new Date().toISOString() } : r))
    );

    showSuccess("Requisição aprovada e estoque atualizado.");
    return { ok: true } as const;
  };

  const rejectMaterialRequest = async (requestId: string, reason: string) => {
    const { error } = await supabase
      .from('material_requests')
      .update({ 
        status: 'Rejeitada', 
        reason: reason, 
        decided_at: new Date().toISOString() 
      })
      .eq('id', requestId);

    if (error) {
      console.error("Erro ao rejeitar requisição:", error);
      showError("Falha ao rejeitar requisição.");
      return;
    }

    setMaterialRequests((prev) =>
      prev.map((r) =>
        r.id === requestId ? { ...r, status: "Rejeitada", reason, decidedAt: new Date().toISOString() } : r
      )
    );
    showSuccess("Requisição rejeitada.");
  };

  const pageMaterials: PageMaterial[] = materials.map(m => ({
    id: m.id,
    name: m.name,
    category: m.category,
    status: m.status,
    description: m.description,
    locations: m.locations,
    quantity: Object.values(m.locations).reduce((a, b) => a + b, 0),
  }));

  const materialNameMap: Record<string, string> = materials.reduce((acc, m) => {
    acc[m.id] = m.name;
    return acc;
  }, {} as Record<string, string>);

  const historyForPage = allocationHistory;
  const pendingRequests = materialRequests.filter((r) => r.status === "Pendente");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Index />} />
                <Route path="/calendar" element={<CalendarPage events={events} />} />
                <Route path="/create-event" element={<CreateEventPage onAddEvent={addEvent} />} />
                <Route path="/roster-management" element={<RosterManagement events={events} employees={employees} onUpdateEventDetails={updateEventDetails} onUpdateEvent={updateEvent} onCreateMaterialRequest={createMaterialRequest} pendingRequests={pendingRequests} materials={materials} />} />
                <Route path="/employees" element={<EmployeesPage roles={roles} employees={employees} onSaveEmployee={saveEmployee} />} />
                <Route path="/roles" element={<RolesPage roles={roles} employees={employees} events={events} />} />
                <Route path="/roles/:roleId" element={<RoleDetailPage roles={roles} employees={employees} events={events} />} />
                <Route path="/materials" element={<MaterialsPage materials={pageMaterials} locations={locations} onSaveMaterial={saveMaterial} onTransferMaterial={transferMaterial} history={historyForPage} pendingRequests={pendingRequests} />} />
                <Route path="/material-requests" element={<MaterialRequestsPage requests={materialRequests} events={events} materialNameMap={materialNameMap} onApproveRequest={approveMaterialRequest} onRejectRequest={rejectMaterialRequest} />} />
                <Route path="/finance-dashboard" element={<FinanceDashboard />} />
                <Route path="/admin-settings" element={<AdminSettings roles={roles} onAddRole={addRole} onUpdateRole={updateRole} onDeleteRole={deleteRole} locations={locations} onAddLocation={addLocation} onUpdateLocation={updateLocation} onDeleteLocation={deleteLocation} />} />
                <Route path="/invite-member" element={<InviteMember roles={roles} onInviteMember={inviteMember} />} />
                <Route path="/debug" element={<DebugPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;