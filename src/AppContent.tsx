import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/contexts/AuthContext";

// Pages
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import ResetPasswordPage from "@/pages/ResetPassword";
import Calendar from "@/pages/Calendar";
// import CreateEventPage from "@/pages/CreateEvent"; // page expects onAddEvent prop
import RosterManagement from "@/pages/RosterManagement";
import Employees from "@/pages/Employees";
import Roles from "@/pages/Roles";
import RoleDetail from "@/pages/RoleDetail";
import Materials from "@/pages/Materials";
import MaterialRequests from "@/pages/MaterialRequests";
import AdminSettings from "@/pages/AdminSettings";
import InviteMember from "@/pages/InviteMember";
import HealthCheck from "@/pages/HealthCheck";
import Debug from "@/pages/Debug";
import AdminProfile from "@/pages/AdminProfile";
import TechnicianDashboard from "@/pages/technician/Dashboard";
import TechnicianCalendar from "@/pages/technician/Calendar";
import TechnicianEvents from "@/pages/technician/Events";
import TechnicianEventDetail from "@/pages/technician/EventDetail";
import TechnicianTasks from "@/pages/technician/Tasks";
import TechnicianProfile from "@/pages/technician/Profile";
import TechnicianNotifications from "@/pages/technician/Notifications";
import TechnicianTasksKanban from "@/pages/technician/TasksKanban";
import FinanceDashboard from "@/pages/finance/Dashboard";
import FinanceProfile from "@/pages/finance/Profile";
import Profitability from "@/pages/finance/Profitability";
import FinanceCalendar from "@/pages/finance/Calendar";
import CostManagement from "@/pages/finance/CostManagement";
import Reports from "@/pages/finance/Reports";
import Notifications from "@/pages/Notifications";
import MaterialManagerProfile from "@/pages/material-manager/Profile";
import AdminTasks from "@/pages/admin/Tasks";
import CreateTask from "@/pages/admin/CreateTask";

// CRM Pages
import CRMDashboard from "@/pages/crm/Dashboard";
import ClientsPage from "@/pages/crm/Clients";
import PipelinePage from "@/pages/crm/Pipeline";
import CRMReports from "@/pages/crm/Reports";
import AdminServicesPage from "@/pages/admin/Services";
import CommercialServicesPage from "@/pages/commercial/Services";

// Components
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Hooks for wrappers
import { useEvents } from "@/hooks/useEvents";
import { useEmployees } from "@/hooks/useEmployees";
import { useLocations } from "@/hooks/useLocations";
import { useMaterials } from "@/hooks/useMaterials";
import { useMaterialRequests } from "@/hooks/useMaterialRequests";
import { useRoles } from "@/hooks/useRoles";
import { useTechnicianCategories } from "@/hooks/useTechnicianCategories";

// Wrappers to provide required props
const CalendarWrapper = () => {
  const { events } = useEvents();
  return <Calendar events={events || []} />;
};

// const CreateEventWrapper = () => {
//   const { updateEvent } = useEvents();
//   // Pass updateEvent as onAddEvent; CreateEventPage expects onAddEvent(payload)
//   return <CreateEventPage onAddEvent={updateEvent} />;
// };

const RosterManagementWrapper = () => {
  const { events, updateEventDetails, updateEvent } = useEvents();
  const { employees } = useEmployees();
  const { materials: invMaterials } = useMaterials();
  const { pendingRequests } = useMaterialRequests();
  return (
    <RosterManagement
      events={events || []}
      employees={employees}
      onUpdateEventDetails={updateEventDetails}
      onUpdateEvent={updateEvent}
      pendingRequests={pendingRequests}
      materials={invMaterials}
    />
  );
};

const EmployeesWrapper = () => {
  const { roles } = useRoles();
  const { employees, saveEmployee } = useEmployees();
  return <Employees roles={roles || []} employees={employees} onSaveEmployee={saveEmployee} />;
};

const RolesWrapper = () => {
  const { roles } = useRoles();
  const { employees } = useEmployees();
  const { events } = useEvents();
  return <Roles roles={roles || []} employees={employees} events={events || []} />;
};

const RoleDetailWrapper = () => {
  const { roles } = useRoles();
  const { employees } = useEmployees();
  const { events } = useEvents();
  return <RoleDetail roles={roles || []} employees={employees} events={events || []} />;
};

const MaterialsWrapper = () => {
  const { materials, addInitialStock, saveMaterial, transferMaterial, deleteMaterial } = useMaterials();
  const { locations } = useLocations();
  const { pendingRequests } = useMaterialRequests();
  return (
    <Materials
      materials={materials}
      locations={locations}
      onSaveMaterial={saveMaterial}
      onAddInitialStock={addInitialStock}
      onTransferMaterial={transferMaterial}
      onDeleteMaterial={deleteMaterial}
      history={[]}
      pendingRequests={pendingRequests}
    />
  );
};

const MaterialRequestsWrapper = () => {
  const { materialRequests, approveMaterialRequest, rejectMaterialRequest, createMaterialRequest } = useMaterialRequests();
  const { events } = useEvents();
  const { materials } = useMaterials();
  const materialNameMap = React.useMemo(
    () => materials.reduce<Record<string, string>>((acc, m) => { acc[m.id] = m.name; return acc; }, {}),
    [materials]
  );
  return (
    <MaterialRequests
      requests={materialRequests}
      events={events || []}
      materialNameMap={materialNameMap}
      onApproveRequest={approveMaterialRequest}
      onRejectRequest={rejectMaterialRequest}
    />
  );
};

const AdminSettingsWrapper = () => {
  // AdminSettings now manages its own roles and locations internally
  return (
    <AdminSettings />
  );
};

const ProfitabilityWrapper = () => {
  return <Profitability />;
};

const FinanceCalendarWrapper = () => {
  const { events } = useEvents();
  return <FinanceCalendar events={events || []} />;
};

const CostManagementWrapper = () => {
  return <CostManagement />;
};

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-background">
        <Routes>
          {/* Rotas públicas - SEM autenticação */}
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/health-check" element={<HealthCheck />} />
          <Route path="/debug" element={<Debug />} />

          {/* Rotas protegidas - COM autenticação */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Index />} />
            <Route path="/calendar" element={<CalendarWrapper />} />
            {/* <Route path="/create-event" element={<CreateEventWrapper />} /> */}
            <Route path="/roster-management" element={<RosterManagementWrapper />} />
            <Route path="/employees" element={<EmployeesWrapper />} />
            <Route path="/roles" element={<RolesWrapper />} />
            <Route path="/roles/:roleId" element={<RoleDetailWrapper />} />
            <Route path="/materials" element={<MaterialsWrapper />} />
            <Route path="/material-requests" element={<MaterialRequestsWrapper />} />
            <Route path="/admin-settings" element={<AdminSettingsWrapper />} />
            <Route path="/invite-member" element={<InviteMember />} />

            {/* Técnico */}
            <Route path="/technician/dashboard" element={<TechnicianDashboard />} />
            <Route path="/technician/calendar" element={<TechnicianCalendar />} />
            <Route path="/technician/events" element={<TechnicianEvents />} />
            <Route path="/technician/events/:eventId" element={<TechnicianEventDetail />} />
            <Route path="/technician/tasks" element={<TechnicianTasks />} />
            <Route path="/technician/tasks-kanban" element={<TechnicianTasksKanban />} />
            <Route path="/technician/profile" element={<TechnicianProfile />} />
            <Route path="/technician/notifications" element={<TechnicianNotifications />} />

            {/* Financeiro */}
            <Route path="/finance/dashboard" element={<FinanceDashboard />} />
            <Route path="/finance/profile" element={<FinanceProfile />} />
            <Route path="/finance-profitability" element={<ProfitabilityWrapper />} />
            <Route path="/finance-calendar" element={<FinanceCalendarWrapper />} />
            <Route path="/finance-costs" element={<CostManagementWrapper />} />
            <Route path="/finance/reports" element={<Reports />} />

            {/* Gestor de Material */}
            <Route path="/material-manager/profile" element={<MaterialManagerProfile />} />

            {/* Admin */}
            <Route path="/admin/profile" element={<AdminProfile />} />
            <Route path="/admin/tasks" element={<AdminTasks />} />
            <Route path="/admin/create-task" element={<CreateTask />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/admin/services" element={<AdminServicesPage />} />

            {/* CRM */}
            <Route path="/crm/dashboard" element={<CRMDashboard />} />
            <Route path="/crm/clients" element={<ClientsPage />} />
            <Route path="/crm/pipeline" element={<PipelinePage />} />
            <Route path="/crm/reports" element={<CRMReports />} />

            {/* Commercial read-only services */}
            <Route path="/commercial/services" element={<CommercialServicesPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
};

export default AppContent;