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

// Definindo a interface para um evento
interface Event {
  id: number;
  name: string;
  date: string;
  endDate?: string;
  location: string;
  startTime?: string;
  endTime?: string;
}

const App = () => {
  // Dados iniciais dos eventos
  const initialEvents: Event[] = [
    { id: 1, name: "Conferência Anual de Tecnologia", date: "2024-08-15", location: "Centro de Convenções", startTime: "09:00", endTime: "18:00" },
    { id: 2, name: "Lançamento do Produto X", date: "2024-09-01", location: "Sede da Empresa", startTime: "19:00", endTime: "22:00" },
    { id: 3, name: "Workshop de Marketing Digital", date: "2024-09-10", location: "Online", startTime: "14:00", endTime: "17:00" },
    { id: 4, name: "Festa de Fim de Ano", date: "2024-12-20", location: "Salão de Festas", startTime: "20:00" },
  ];

  const [events, setEvents] = useState<Event[]>(initialEvents);

  // Função para adicionar um novo evento à lista
  const addEvent = (newEventData: Omit<Event, 'id'>) => {
    setEvents(prevEvents => [
      ...prevEvents,
      { ...newEventData, id: prevEvents.length + 1 }
    ]);
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
              <Route path="/roster-management" element={<RosterManagement events={events} />} />
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/materials" element={<MaterialsPage />} />
              <Route path="/finance-dashboard" element={<FinanceDashboard />} />
              <Route path="/admin-settings" element={<AdminSettings />} />
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