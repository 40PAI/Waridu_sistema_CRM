import { useState } from "react";
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

const queryClient = new QueryClient();

// Definindo as interfaces
export interface Roster {
  teamLead: string;
  teamMembers: { id: string; name: string; role: string }[];
  materials: Record<string, number>;
}

export interface Event {
  id: number;
  name: string;
  date: string;
  endDate?: string;
  location: string;
  startTime?: string;
  endTime?: string;
  roster?: Roster;
}

export interface Role {
  id: string;
  name: string;
}

const App = () => {
  const initialEvents: Event[] = [
    { id: 1, name: "Conferência Anual de Tecnologia", date: "2024-08-15", location: "Centro de Convenções", startTime: "09:00", endTime: "18:00" },
    { id: 2, name: "Lançamento do Produto X", date: "2024-09-01", location: "Sede da Empresa", startTime: "19:00", endTime: "22:00" },
    { id: 3, name: "Workshop de Marketing Digital", date: "2024-09-10", location: "Online", startTime: "14:00", endTime: "17:00" },
    { id: 4, name: "Festa de Fim de Ano", date: "2024-12-20", location: "Salão de Festas", startTime: "20:00" },
  ];

  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [roles, setRoles] = useState<Role[]>([
    { id: 'role-1', name: 'Gerente de Eventos' },
    { id: 'role-2', name: 'Técnico de Som' },
    { id: 'role-3', name: 'Coordenadora' },
    { id: 'role-4', name: 'Assistente' },
    { id: 'role-5', name: 'Técnico de Luz' },
    { id: 'role-6', name: 'VJ' },
  ]);

  const addEvent = (newEventData: Omit<Event, 'id'>) => {
    setEvents(prevEvents => [
      ...prevEvents,
      { ...newEventData, id: prevEvents.length + 1 }
    ]);
  };

  const updateEventRoster = (eventId: number, rosterData: Roster) => {
    setEvents(prevEvents =>
      prevEvents.map(event =>
        event.id === eventId ? { ...event, roster: rosterData } : event
      )
    );
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
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/create-event" element={<CreateEventPage onAddEvent={addEvent} />} />
              <Route path="/roster-management" element={<RosterManagement events={events} onUpdateRoster={updateEventRoster} />} />
              <Route path="/employees" element={<EmployeesPage roles={roles} />} />
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