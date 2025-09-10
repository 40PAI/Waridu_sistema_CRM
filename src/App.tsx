import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import RosterManagement from "@/pages/RosterManagement";
import FinanceDashboard from "@/pages/FinanceDashboard";
import AdminSettings from "@/pages/AdminSettings";
import InviteMember from "@/pages/InviteMember";
import CalendarPage from "@/pages/Calendar";
import CreateEventPage from "@/pages/CreateEvent";
import MaterialsPage from "@/pages/Materials";
import EmployeesPage from "@/pages/Employees";
import RolesPage from "@/pages/Roles";
import RoleDetailPage from "@/pages/RoleDetail";
import LoginPage from "@/pages/Login";
import MaterialRequestsPage from "@/pages/MaterialRequests";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DebugPage from "@/pages/Debug";
import HealthCheck from "@/pages/HealthCheck";
import TechnicianDashboard from "@/pages/technician/Dashboard";
import TechnicianEvents from "@/pages/technician/Events";
import TechnicianTasks from "@/pages/technician/Tasks";
import TechnicianProfile from "@/pages/technician/Profile";
import TechnicianCalendar from "@/pages/technician/Calendar";
import TechnicianNotifications from "@/pages/technician/Notifications";
import MaterialManagerDashboard from "@/pages/material-manager/Dashboard";
import MaterialManagerProfile from "@/pages/material-manager/Profile";
import MaterialManagerCalendar from "@/pages/material-manager/Calendar";
import MaterialManagerTasks from "@/pages/material-manager/Tasks";
import MaterialManagerNotifications from "@/pages/material-manager/Notifications";
import { useEvents } from "@/hooks/useEvents";
import { useEmployees } from "@/hooks/useEmployees";
import { useRoles } from "@/hooks/useRoles";
import { useLocations } from "@/hooks/useLocations";
import { useMaterials } from "@/hooks/useMaterials";
import { useMaterialRequests } from "@/hooks/useMaterialRequests";
import { showError } from "@/utils/toast";
import { useEffect } from "react";

// Dados mockados para fallback
const mockEvents = [
  { id: 1, name: "Evento de Teste", startDate: "2023-06-15", endDate: "2023-06-15", location: "Sala de Conferências", status: "Planejado" },
];

const mockEmployees = [
  { id: "1", name: "João Silva", role: "Técnico", email: "joao@empresa.com", avatar: "/avatars/01.png", status: "Ativo" },
];

const mockRoles = [
  { id: "1", name: "Técnico" },
  { id: "2", name: "Coordenador" },
];

const mockLocations = [
  { id: "1", name: "Armazém Central" },
  { id: "2", name: "Estúdio A" },
];

const mockMaterials = [
  { id: "MAT001", name: "Câmera Sony A7S III", quantity: 5, status: "Disponível", category: "Câmeras", description: "Câmera profissional", locations: { "1": 3, "2": 2 } },
];

const queryClient = new QueryClient();

const AppContent = () => {
  const { error: authError } = useAuth();
  const { 
    events, 
    addEvent, 
    updateEvent, 
    updateEventDetails, 
    loading: eventsLoading,
    refreshEvents
  } = useEvents();
  
  const { 
    employees, 
    saveEmployee, 
    loading: employeesLoading,
    refreshEmployees
  } = useEmployees();
  
  const { 
    roles, 
    addRole, 
    updateRole, 
    deleteRole, 
    loading: rolesLoading,
    refreshRoles
  } = useRoles();
  
  const { 
    locations, 
    addLocation, 
    updateLocation, 
    deleteLocation, 
    loading: locationsLoading,
    refreshLocations
  } = useLocations();
  
  const { 
    materials, 
    rawMaterials, 
    saveMaterial, 
    transferMaterial, 
    loading: materialsLoading,
    refreshMaterials
  } = useMaterials();
  
  const {
    materialRequests,
    pendingRequests,
    createMaterialRequest,
    approveMaterialRequest,
    rejectMaterialRequest,
    loading: requestsLoading,
    refreshRequests
  } = useMaterialRequests();

  // Efeito para mostrar erros de autenticação
  useEffect(() => {
    if (authError) {
      showError(`Erro de autenticação: ${authError}`);
      console.error("Erro de autenticação detectado:", authError);
    }
  }, [authError]);

  const materialNameMap: Record<string, string> = rawMaterials.reduce((acc, m) => {
    acc[m.id] = m.name;
    return acc;
  }, {} as Record<string, string>);

  // Verifica se há erros críticos
  const hasCriticalError = !!authError;
  const isLoading = eventsLoading || employeesLoading || rolesLoading || locationsLoading || materialsLoading || requestsLoading;

  // Se houver erro crítico, mostra uma página de erro
  if (hasCriticalError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-red-600 mb-4">Erro Crítico</h2>
          <p className="text-gray-700 mb-4">Ocorreu um erro que impede o funcionamento da aplicação:</p>
          <pre className="p-4 bg-red-100 rounded text-sm text-red-800 overflow-auto max-h-40">
            {authError}
          </pre>
          <div className="mt-4 flex gap-2">
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Recarregar Página
            </button>
            <button 
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Limpar Cache e Recarregar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mostra tela de carregamento enquanto busca dados
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-lg">Carregando dados...</p>
          <p className="text-sm text-gray-500 mt-2">Isso pode levar alguns segundos</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/health" element={<HealthCheck />} />
        </Routes>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            {/* Rotas padrão (Admin/Coordenador/Financeiro etc.) */}
            <Route path="/" element={<Index />} />
            <Route path="/calendar" element={<CalendarPage events={events.length ? events : mockEvents} />} />
            <Route path="/create-event" element={<CreateEventPage onAddEvent={addEvent} />} />
            <Route path="/roster-management" element={
              <RosterManagement
                events={events.length ? events : mockEvents}
                employees={employees.length ? employees : mockEmployees}
                onUpdateEventDetails={updateEventDetails}
                onUpdateEvent={updateEvent}
                onCreateMaterialRequest={createMaterialRequest}
                pendingRequests={pendingRequests}
                materials={rawMaterials.length ? rawMaterials : mockMaterials}
              />
            } />
            <Route path="/employees" element={<EmployeesPage roles={roles.length ? roles : mockRoles} employees={employees.length ? employees : mockEmployees} onSaveEmployee={saveEmployee} />} />
            <Route path="/roles" element={<RolesPage roles={roles.length ? roles : mockRoles} employees={employees.length ? employees : mockEmployees} events={events.length ? events : mockEvents} />} />
            <Route path="/roles/:roleId" element={<RoleDetailPage roles={roles.length ? roles : mockRoles} employees={employees.length ? employees : mockEmployees} events={events.length ? events : mockEvents} />} />
            <Route path="/materials" element={
              <MaterialsPage
                materials={materials.length ? materials : mockMaterials}
                locations={locations.length ? locations : mockLocations}
                onSaveMaterial={saveMaterial}
                onTransferMaterial={transferMaterial}
                history={[]}
                pendingRequests={pendingRequests}
              />
            } />
            <Route path="/material-requests" element={
              <MaterialRequestsPage
                requests={materialRequests}
                events={events.length ? events : mockEvents}
                materialNameMap={materialNameMap}
                onApproveRequest={approveMaterialRequest}
                onRejectRequest={rejectMaterialRequest}
              />
            } />
            <Route path="/finance-dashboard" element={<FinanceDashboard />} />
            <Route path="/admin-settings" element={
              <AdminSettings
                roles={roles.length ? roles : mockRoles}
                onAddRole={addRole}
                onUpdateRole={updateRole}
                onDeleteRole={deleteRole}
                locations={locations.length ? locations : mockLocations}
                onAddLocation={addLocation}
                onUpdateLocation={updateLocation}
                onDeleteLocation={deleteLocation}
              />
            } />
            <Route path="/invite-member" element={<InviteMember />} />
            <Route path="/debug" element={<DebugPage />} />

            {/* Rotas do Técnico */}
            <Route path="/technician/dashboard" element={<TechnicianDashboard />} />
            <Route path="/technician/calendar" element={<TechnicianCalendar />} />
            <Route path="/technician/events" element={<TechnicianEvents />} />
            <Route path="/technician/tasks" element={<TechnicianTasks />} />
            <Route path="/technician/profile" element={<TechnicianProfile />} />
            <Route path="/technician/notifications" element={<TechnicianNotifications />} />

            {/* Rotas do Gestor de Material */}
            <Route path="/material-manager/dashboard" element={<MaterialManagerDashboard />} />
            <Route path="/material-manager/calendar" element={<MaterialManagerCalendar />} />
            <Route path="/material-manager/requests" element={
              <MaterialRequestsPage
                requests={materialRequests}
                events={events.length ? events : mockEvents}
                materialNameMap={materialNameMap}
                onApproveRequest={approveMaterialRequest}
                onRejectRequest={rejectMaterialRequest}
              />
            } />
            <Route path="/material-manager/inventory" element={
              <MaterialsPage
                materials={materials.length ? materials : mockMaterials}
                locations={locations.length ? locations : mockLocations}
                onSaveMaterial={saveMaterial}
                onTransferMaterial={transferMaterial}
                history={[]}
                pendingRequests={pendingRequests}
              />
            } />
            <Route path="/material-manager/tasks" element={<MaterialManagerTasks />} />
            <Route path="/material-manager/profile" element={<MaterialManagerProfile />} />
            <Route path="/material-manager/notifications" element={<MaterialManagerNotifications />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
};

const AppWrapper = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default AppWrapper;