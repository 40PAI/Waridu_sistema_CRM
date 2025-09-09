import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./components/layout/DashboardLayout";
import RosterManagement from "./pages/RosterManagement";
import FinanceDashboard from "./pages/FinanceDashboard";
import AdminSettings from "./pages/AdminSettings";
import InviteMember from "./pages/InviteMember";
import CalendarPage from "./pages/Calendar";
import CreateEventPage from "./pages/CreateEvent";
import MaterialsPage from "./pages/Materials";
import EmployeesPage from "./pages/Employees";
import { Employee } from "./components/employees/EmployeeDialog";

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
  name: string;
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
    { id: 'EMP001', name: 'Ana Silva', role: 'Gerente de Eventos', email: 'ana.silva@email.com', avatar: '/avatars/01.png', status: 'Ativo', costPerDay: 500 },
    { id: 'EMP002', name: 'Carlos Souza', role: 'Técnico de Som', email: 'carlos.souza@email.com', avatar: '/avatars/02.png', status: 'Ativo', costPerDay: 350 },
    { id: 'EMP003', name: 'Beatriz Costa', role: 'Coordenadora', email: 'beatriz.costa@email.com', avatar: '/avatars/03.png', status: 'Inativo', costPerDay: 400 },
    { id: 'EMP004', name: 'Daniel Martins', role: 'Assistente', email: 'daniel.martins@email.com', avatar: '/avatars/04.png', status: 'Ativo', costPerDay: 200 },
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
    { id: 'role-1', name: 'Gerente de Eventos' },
    { id: 'role-2', name: 'Técnico de Som' },
    { id: 'role-3', name: 'Coordenadora' },
    { id: 'role-4', name: 'Assistente' },
    { id: 'role-5', name: 'Técnico de Luz' },
    { id: 'role-6', name: 'VJ' },
  ]);

  useEffect(() => {
    try {
      localStorage.setItem('events', JSON.stringify(events));
    } catch (error) {
      console.error("Failed to save events to localStorage", error);
    }
  }, [events]);

  const addEvent = (newEventData: Omit<Event, 'id' | 'roster' | 'expenses' | 'status'>) => {
    setEvents(prevEvents => [
      ...prevEvents,
      { ...newEventData, id: prevEvents.length > 0 ? Math.max(...prevEvents.map(e => e.id)) + 1 : 1, status: 'Planejado' }
    ]);
  };

  const updateEvent = (updatedEvent: Event) => {
    setEvents(prevEvents =>
      prevEvents.map(event =>
        event.id === updatedEvent.id ? updatedEvent : event
      )
    );
  };

  const updateEventDetails = (eventId: number, details: { roster: Roster; expenses: Expense[] }) => {
    setEvents(prevEvents =>
      prevEvents.map(event =>
        event.id === eventId ? { ...event, roster: details.roster, expenses: details.expenses } : event
      )
    );
  };

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

  const addRole = (roleName: string) => {
    const newRole: Role = {
      id: `role-${Date.now()}`,
      name: roleName,
    };
    setRoles(prev => [...prev, newRole]);
  };

  const updateRole = (roleId: string, newName: string) => {
    setRoles(prev => prev.map(r => r.id === roleId ? { ...r, name: newName } : r));
  };

  const deleteRole = (roleId: string) => {
    setRoles(prev => prev.filter(r => r.id !== roleId));
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/calendar" element={<CalendarPage events={events} />} />
              <Route path="/create-event" element={<CreateEventPage onAddEvent={addEvent} />} />
              <Route path="/roster-management" element={<RosterManagement events={events} employees={employees} onUpdateEventDetails={updateEventDetails} onUpdateEvent={updateEvent} />} />
              <Route path="/employees" element={<EmployeesPage roles={roles} employees={employees} onSaveEmployee={saveEmployee} />} />
              <Route path="/materials" element={<MaterialsPage />} />
              <Route path="/finance-dashboard" element={<FinanceDashboard />} />
              <Route path="/admin-settings" element={<AdminSettings roles={roles} onAddRole={addRole} onUpdateRole={updateRole} onDeleteRole={deleteRole} />} />
              <Route path="/invite-member" element={<InviteMember />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;