import * as React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LoginPage from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import Index from "@/pages/Index";
import Calendar from "@/pages/Calendar";
import CreateEvent from "@/pages/CreateEvent";
import RosterManagement from "@/pages/RosterManagement";
import Employees from "@/pages/Employees";
import Roles from "@/pages/Roles";
import RoleDetail from "@/pages/RoleDetail";
import Materials from "@/pages/Materials";
import MaterialRequests from "@/pages/MaterialRequests";
import AdminSettings from "@/pages/AdminSettings";
import InviteMember from "@/pages/InviteMember";
import Notifications from "@/pages/Notifications";
import FinanceDashboard from "@/pages/finance/Dashboard";
import FinanceProfitability from "@/pages/finance/Profitability";
import FinanceCalendar from "@/pages/finance/Calendar";
import FinanceCosts from "@/pages/finance/CostManagement";
import FinanceReports from "@/pages/finance/Reports";
import FinanceProfile from "@/pages/finance/Profile";
import TechnicianDashboard from "@/pages/technician/Dashboard";
import TechnicianCalendar from "@/pages/technician/Calendar";
import TechnicianEvents from "@/pages/technician/Events";
import TechnicianEventDetail from "@/pages/technician/EventDetail";
import TechnicianTasks from "@/pages/technician/Tasks";
import TechnicianTasksKanban from "@/pages/technician/TasksKanban";
import TechnicianProfile from "@/pages/technician/Profile";
import TechnicianNotifications from "@/pages/technician/Notifications";
import AdminProfile from "@/pages/AdminProfile";
import HealthCheck from "@/pages/HealthCheck";
import Debug from "@/pages/Debug";
import Welcome from "@/pages/Welcome";
import AuthCallback from "@/pages/AuthCallback";

// Hooks
import { useEvents } from "@/hooks/useEvents";
import { useRoles } from "@/hooks/useRoles";
import { useLocations } from "@/hooks/useLocations";
import { useEmployees } from "@/hooks/useEmployees";
import { useMaterials } from "@/hooks/useMaterials";
import { useMaterialRequests } from "@/hooks/useMaterialRequests";
import { useAllocationHistory } from "@/hooks/useAllocationHistory";

// Toaster for notifications
import { Toaster } from "sonner";

const AppContent = () => {
  const { user } = useAuth();
  const { events, addEvent, updateEvent, updateEventDetails } = useEvents();
  const { roles, addRole, updateRole, deleteRole } = useRoles();
  const { locations, addLocation, updateLocation, deleteLocation } = useLocations();
  const { employees, saveEmployee } = useEmployees();
  const { materials, saveMaterial, deleteMaterial, addInitialStock, transferMaterial } = useMaterials();
  const { materialRequests, createMaterialRequest, approveMaterialRequest, rejectMaterialRequest } = useMaterialRequests();
  const { history } = useAllocationHistory(events);

  const materialNameMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    materials.forEach((m) => (map[m.id] = m.name));
    return map;
  }, [materials]);

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/health" element={<HealthCheck />} />
          <Route path="/debug" element={<Debug />} />

          {/* Rotas protegidas */}
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            {/* Rotas comuns (Admin/Coordenador/Gestor) */}
            <Route path="/" element={<Index />} />
            <Route path="/calendar" element={<Calendar events={events} />} />
            <Route path="/create-event" element={<CreateEvent onAddEvent={addEvent} />} />
            <Route
              path="/roster-management"
              element={
                <RosterManagement
                  events={events}
                  employees={employees}
                  onUpdateEventDetails={updateEventDetails}
                  onUpdateEvent={updateEvent}
                  onCreateMaterialRequest={createMaterialRequest}
                  pendingRequests={materialRequests.filter((r) => r.status === "Pendente")}
                  materials={materials}
                />
              }
            />
            <Route path="/employees" element={<Employees roles={roles} employees={employees} onSaveEmployee={saveEmployee} />} />
            <Route path="/roles" element={<Roles roles={roles} employees={employees} events={events} />} />
            <Route path="/roles/:roleId" element={<RoleDetail roles={roles} employees={employees} events={events} />} />
            <Route
              path="/materials"
              element={
                <Materials
                  materials={materials}
                  locations={locations}
                  onSaveMaterial={saveMaterial}
                  onAddInitialStock={addInitialStock}
                  onTransferMaterial={transferMaterial}
                  onDeleteMaterial={deleteMaterial}
                  history={history}
                  pendingRequests={materialRequests.filter((r) => r.status === "Pendente")}
                />
              }
            />
            <Route
              path="/material-requests"
              element={
                <MaterialRequests
                  requests={materialRequests}
                  events={events}
                  materialNameMap={materialNameMap}
                  onApproveRequest={approveMaterialRequest}
                  onRejectRequest={rejectMaterialRequest}
                />
              }
            />
            <Route path="/notifications" element={<Notifications />} />

            {/* Admin/Coordenador */}
            <Route path="/admin-settings" element={<AdminSettings
              roles={roles}
              onAddRole={addRole}
              onUpdateRole={updateRole}
              onDeleteRole={deleteRole}
              locations={locations}
              onAddLocation={addLocation}
              onUpdateLocation={updateLocation}
              onDeleteLocation={deleteLocation}
            />} />
            <Route path="/invite-member" element={<InviteMember />} />
            <Route path="/admin/profile" element={<AdminProfile />} />

            {/* Financeiro */}
            <Route path="/finance/dashboard" element={<FinanceDashboard />} />
            <Route path="/finance-profitability" element={<FinanceProfitability />} />
            <Route path="/finance-calendar" element={<FinanceCalendar events={events} />} />
            <Route path="/finance-costs" element={<FinanceCosts />} />
            <Route path="/finance/reports" element={<FinanceReports />} />
            <Route path="/finance/profile" element={<FinanceProfile />} />

            {/* Técnico */}
            <Route path="/technician/dashboard" element={<TechnicianDashboard />} />
            <Route path="/technician/calendar" element={<TechnicianCalendar />} />
            <Route path="/technician/events" element={<TechnicianEvents />} />
            <Route path="/technician/events/:eventId" element={<TechnicianEventDetail />} />
            <Route path="/technician/tasks" element={<TechnicianTasks />} />
            <Route path="/technician/tasks-kanban" element={<TechnicianTasksKanban />} />
            <Route path="/technician/profile" element={<TechnicianProfile />} />
            <Route path="/technician/notifications" element={<TechnicianNotifications />} />

            {/* Nova rota de boas-vindas */}
            <Route path="/welcome" element={<Welcome />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </>
  );
};

export default AppContent;