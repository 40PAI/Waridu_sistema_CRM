import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/contexts/AuthContext";

// Critical pages - loaded immediately
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ResetPasswordPage from "@/pages/ResetPassword";

// Lazy-loaded pages
const Index = lazy(() => import("@/pages/Index"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Calendar = lazy(() => import("@/pages/Calendar"));
const RosterManagement = lazy(() => import("@/pages/RosterManagement"));
const Employees = lazy(() => import("@/pages/Employees"));
const Roles = lazy(() => import("@/pages/Roles"));
const RoleDetail = lazy(() => import("@/pages/RoleDetail"));
const Materials = lazy(() => import("@/pages/Materials"));
const MaterialRequests = lazy(() => import("@/pages/MaterialRequests"));
const AdminSettings = lazy(() => import("@/pages/AdminSettings"));
const InviteMember = lazy(() => import("@/pages/InviteMember"));
const HealthCheck = lazy(() => import("@/pages/HealthCheck"));
const Debug = lazy(() => import("@/pages/Debug"));
const AdminProfile = lazy(() => import("@/pages/AdminProfile"));
const TechnicianDashboard = lazy(() => import("@/pages/technician/Dashboard"));
const TechnicianCalendar = lazy(() => import("@/pages/technician/Calendar"));
const TechnicianEvents = lazy(() => import("@/pages/technician/Events"));
const TechnicianEventDetail = lazy(() => import("@/pages/technician/EventDetail"));
const TechnicianTasks = lazy(() => import("@/pages/technician/Tasks"));
const TechnicianProfile = lazy(() => import("@/pages/technician/Profile"));
const TechnicianNotifications = lazy(() => import("@/pages/technician/Notifications"));
const TechnicianTasksKanban = lazy(() => import("@/pages/technician/TasksKanban"));
const FinanceDashboard = lazy(() => import("@/pages/finance/Dashboard"));
const FinanceProfile = lazy(() => import("@/pages/finance/Profile"));
const Profitability = lazy(() => import("@/pages/finance/Profitability"));
const FinanceCalendar = lazy(() => import("@/pages/finance/Calendar"));
const CostManagement = lazy(() => import("@/pages/finance/CostManagement"));
const Reports = lazy(() => import("@/pages/finance/Reports"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const MaterialManagerProfile = lazy(() => import("@/pages/material-manager/Profile"));
const AdminTasks = lazy(() => import("@/pages/admin/Tasks"));
const CreateTask = lazy(() => import("@/pages/admin/CreateTask"));
const CoordinatorProfile = lazy(() => import("@/pages/coordinator/Profile"));

// CRM Pages
const CRMDashboard = lazy(() => import("@/pages/crm/Dashboard"));
const ClientsPage = lazy(() => import("@/pages/crm/Clients"));
const PipelinePage = lazy(() => import("@/pages/crm/Pipeline"));
const CRMReports = lazy(() => import("@/pages/crm/Reports"));
const AdminServicesPage = lazy(() => import("@/pages/admin/Services"));
const CommercialServicesPage = lazy(() => import("@/pages/commercial/Services"));

// Components
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Lazy-loaded wrappers
const CalendarWrapper = lazy(() => import("@/wrappers/CalendarWrapper"));
const RosterManagementWrapper = lazy(() => import("@/wrappers/RosterManagementWrapper"));
const EmployeesWrapper = lazy(() => import("@/wrappers/EmployeesWrapper"));
const RolesWrapper = lazy(() => import("@/wrappers/RolesWrapper"));
const RoleDetailWrapper = lazy(() => import("@/wrappers/RoleDetailWrapper"));
const MaterialsWrapper = lazy(() => import("@/wrappers/MaterialsWrapper"));
const MaterialRequestsWrapper = lazy(() => import("@/wrappers/MaterialRequestsWrapper"));
const FinanceCalendarWrapper = lazy(() => import("@/wrappers/FinanceCalendarWrapper"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center gap-2">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="text-sm text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-background">
        <Suspense fallback={<PageLoader />}>
          <Routes>
          {/* Rotas públicas - SEM autenticação */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
            <Route path="/admin-settings" element={<AdminSettings />} />
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
            <Route path="/finance-profitability" element={<Profitability />} />
            <Route path="/finance-calendar" element={<FinanceCalendarWrapper />} />
            <Route path="/finance-costs" element={<CostManagement />} />
            <Route path="/finance/reports" element={<Reports />} />

            {/* Gestor de Material */}
            <Route path="/material-manager/profile" element={<MaterialManagerProfile />} />

            {/* Coordenador */}
            <Route path="/coordinator/profile" element={<CoordinatorProfile />} />

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
        </Suspense>
      </div>
    </Router>
  );
};

export default AppContent;