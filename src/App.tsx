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
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DebugPage from "@/pages/Debug";
import HealthCheck from "@/pages/HealthCheck";
import TechnicianDashboard from "@/pages/technician/Dashboard";
import TechnicianEvents from "@/pages/technician/Events";
import TechnicianEventDetail from "@/pages/technician/EventDetail";
import TechnicianTasks from "@/pages/technician/Tasks";
import TechnicianProfile from "@/pages/technician/Profile";
import TechnicianCalendar from "@/pages/technician/Calendar";
import TechnicianNotifications from "@/pages/technician/Notifications";
import { useEvents } from "@/hooks/useEvents";
import { useEmployees } from "@/hooks/useEmployees";
import { useRoles } from "@/hooks/useRoles";
import { useLocations } from "@/hooks/useLocations";
import { useMaterials } from "@/hooks/useMaterials";
import { useMaterialRequests } from "@/hooks/useMaterialRequests";
import { supabase } from "@/integrations/supabase/client";
import { useTechnicianCategories } from "@/hooks/useTechnicianCategories";

const queryClient = new QueryClient();

const AppContent = () => {
  const { events, addEvent, updateEvent, updateEventDetails, loading: eventsLoading } = useEvents();
  const { employees, saveEmployee, loading: employeesLoading } = useEmployees();
  const { roles, addRole, updateRole, deleteRole, loading: rolesLoading } = useRoles();
  const { locations, addLocation, updateLocation, deleteLocation, loading: locationsLoading } = useLocations();
  const { materials, rawMaterials, saveMaterial, transferMaterial, loading: materialsLoading } = useMaterials();
  const { 
    materialRequests, 
    pendingRequests, 
    createMaterialRequest, 
    approveMaterialRequest, 
    rejectMaterialRequest,
    loading: requestsLoading
  } = useMaterialRequests();
  const { categories, loading: categoriesLoading } = useTechnicianCategories();

  const materialNameMap: Record<string, string> = rawMaterials.reduce((acc, m) => {
    acc[m.id] = m.name;
    return acc;
  }, {} as Record<string, string>);

  // Show loading state while fetching initial data
  if (eventsLoading || employeesLoading || rolesLoading || locationsLoading || materialsLoading || requestsLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Carregando dados...</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {/* Rota pública para health check */}
        <Routes>
          <Route path="/health" element={<HealthCheck />} />
        </Routes>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              {/* Admin/Coordinator/Gestor routes */}
              <Route path="/" element={<Index events={events} materials={materials} />} />
              <Route path="/calendar" element={<CalendarPage events={events} />} />
              <Route path="/create-event" element={<CreateEventPage onAddEvent={addEvent} />} />
              <Route path="/roster-management" element={
                <RosterManagement 
                  events={events} 
                  employees={employees} 
                  onUpdateEventDetails={updateEventDetails} 
                  onUpdateEvent={updateEvent} 
                  onCreateMaterialRequest={createMaterialRequest} 
                  pendingRequests={pendingRequests} 
                  materials={rawMaterials} 
                />
              } />
              <Route path="/employees" element={
                <EmployeesPage 
                  roles={roles} 
                  employees={employees} 
                  onSaveEmployee={saveEmployee} 
                />
              } />
              <Route path="/roles" element={
                <RolesPage 
                  roles={roles} 
                  employees={employees} 
                  events={events} 
                />
              } />
              <Route path="/roles/:roleId" element={
                <RoleDetailPage 
                  roles={roles} 
                  employees={employees} 
                  events={events} 
                />
              } />
              <Route path="/materials" element={
                <MaterialsPage 
                  materials={materials} 
                  locations={locations} 
                  onSaveMaterial={saveMaterial} 
                  onTransferMaterial={transferMaterial} 
                  history={[]} 
                  pendingRequests={pendingRequests} 
                />
              } />
              <Route path="/material-requests" element={
                <MaterialRequestsPage 
                  requests={materialRequests} 
                  events={events} 
                  materialNameMap={materialNameMap} 
                  onApproveRequest={(requestId: string) => approveMaterialRequest(requestId) as Promise<{ ok: true } | { ok: false; shortages: { materialId: string; needed: number; available: number }[] }>} 
                  onRejectRequest={rejectMaterialRequest} 
                />
              } />
              <Route path="/finance-dashboard" element={
                <FinanceDashboard 
                  events={events} 
                  employees={employees} 
                  categories={categories} 
                />
              } />
              <Route path="/admin-settings" element={
                <AdminSettings 
                  roles={roles} 
                  onAddRole={addRole} 
                  onUpdateRole={updateRole} 
                  onDeleteRole={deleteRole} 
                  locations={locations} 
                  onAddLocation={addLocation} 
                  onUpdateLocation={updateLocation} 
                  onDeleteLocation={deleteLocation} 
                />
              } />
              <Route path="/invite-member" element={<InviteMember />} />
              <Route path="/debug" element={<DebugPage />} />
              
              {/* Technician routes */}
              <Route path="/technician/dashboard" element={<TechnicianDashboard />} />
              <Route path="/technician/calendar" element={<TechnicianCalendar />} />
              <Route path="/technician/events" element={<TechnicianEvents />} />
              <Route path="/technician/events/:eventId" element={<TechnicianEventDetail />} />
              <Route path="/technician/tasks" element={<TechnicianTasks />} />
              <Route path="/technician/profile" element={<TechnicianProfile />} />
              <Route path="/technician/notifications" element={<TechnicianNotifications />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
};

export default App;