import * as React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Pages
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import HealthCheck from "@/pages/HealthCheck";
import Debug from "@/pages/Debug";

import CalendarPage from "@/pages/Calendar";
import CreateEventPage from "@/pages/CreateEvent";
import RosterManagement from "@/pages/RosterManagement";

import EmployeesPage from "@/pages/Employees";
import RolesPage from "@/pages/Roles";
import RoleDetailPage from "@/pages/RoleDetail";

import MaterialsPage from "@/pages/Materials";
import MaterialRequestsPage from "@/pages/MaterialRequests";

import FinanceDashboard from "@/pages/finance/Dashboard";
import Profitability from "@/pages/finance/Profitability";
import FinanceCalendar from "@/pages/finance/Calendar";
import CostManagement from "@/pages/finance/CostManagement";
import Reports from "@/pages/finance/Reports";

import TechnicianDashboard from "@/pages/technician/Dashboard";
import TechnicianCalendar from "@/pages/technician/Calendar";
import TechnicianEvents from "@/pages/technician/Events";
import TechnicianEventDetail from "@/pages/technician/EventDetail";
import TechnicianTasks from "@/pages/technician/Tasks";
import TechnicianProfile from "@/pages/technician/Profile";
import TechnicianNotifications from "@/pages/technician/Notifications";

import FinanceProfile from "@/pages/finance/Profile";
import AdminProfile from "@/pages/AdminProfile";
import AdminSettings from "@/pages/AdminSettings";
import InviteMember from "@/pages/InviteMember";
import NotificationsPage from "@/pages/Notifications";

// Hooks for data
import { useEvents } from "@/hooks/useEvents";
import { useEmployees } from "@/hooks/useEmployees";
import { useRoles } from "@/hooks/useRoles";
import { useMaterials } from "@/hooks/useMaterials";
import { useMaterialRequests } from "@/hooks/useMaterialRequests";
import { useLocations } from "@/hooks/useLocations";
import { useTechnicianCategories } from "@/hooks/useTechnicianCategories";
import type { Event } from "@/types";

function AppShell() {
  // Load core data via hooks
  const { events, addEvent, updateEvent, updateEventDetails } = useEvents();
  const { employees, saveEmployee } = useEmployees();
  const { roles, addRole, updateRole, deleteRole } = useRoles();
  const {
    materials: pageMaterials,
    rawMaterials: inventoryMaterials,
    saveMaterial,
    deleteMaterial,
    addInitialStock,
    transferMaterial,
  } = useMaterials();
  const {
    materialRequests,
    pendingRequests,
    approveMaterialRequest,
    rejectMaterialRequest,
    createMaterialRequest,
  } = useMaterialRequests();
  const { locations, addLocation, updateLocation, deleteLocation } = useLocations();
  const { categories } = useTechnicianCategories();

  // Helpers
  const eventsForCalendar: Event[] = events;
  const materialNameMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    pageMaterials.forEach((m) => (map[m.id] = m.name));
    return map;
  }, [pageMaterials]);

  const onUpdateEventDetails = (eventId: number, details: any) => updateEventDetails(eventId, details);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/health-check" element={<HealthCheck />} />

      {/* Protected app routes */}
      <Route element={<ProtectedRoute />}>
        {/* Home */}
        <Route path="/" element={<Index events={events} materials={pageMaterials} />} />

        {/* Events and scheduling */}
        <Route
          path="/calendar"
          element={<CalendarPage events={eventsForCalendar} />}
        />
        <Route
          path="/create-event"
          element={<CreateEventPage onAddEvent={addEvent} />}
        />
        <Route
          path="/roster-management"
          element={
            <RosterManagement
              events={events}
              employees={employees}
              onUpdateEventDetails={onUpdateEventDetails}
              onUpdateEvent={updateEvent}
              onCreateMaterialRequest={createMaterialRequest}
              pendingRequests={pendingRequests}
              materials={inventoryMaterials}
            />
          }
        />

        {/* Employees and roles */}
        <Route
          path="/employees"
          element={
            <EmployeesPage
              roles={roles}
              employees={employees}
              onSaveEmployee={saveEmployee}
            />
          }
        />
        <Route
          path="/roles"
          element={<RolesPage roles={roles} employees={employees} events={events} />}
        />
        <Route
          path="/roles/:roleId"
          element={<RoleDetailPage roles={roles} employees={employees} events={events} />}
        />

        {/* Inventory and materials */}
        <Route
          path="/materials"
          element={
            <MaterialsPage
              materials={pageMaterials}
              locations={locations}
              onSaveMaterial={saveMaterial}
              onAddInitialStock={addInitialStock}
              onTransferMaterial={transferMaterial}
              onDeleteMaterial={deleteMaterial}
              history={[]}
              pendingRequests={pendingRequests}
            />
          }
        />
        <Route
          path="/material-requests"
          element={
            <MaterialRequestsPage
              requests={materialRequests}
              events={events}
              materialNameMap={materialNameMap}
              onApproveRequest={approveMaterialRequest}
              onRejectRequest={rejectMaterialRequest}
            />
          }
        />

        {/* Finance */}
        <Route path="/finance/dashboard" element={<FinanceDashboard />} />
        <Route
          path="/finance-profitability"
          element={
            <Profitability
              events={events}
              employees={employees.map((e) => ({ id: e.id, technicianCategoryId: e.technicianCategoryId || undefined }))}
              categories={categories}
            />
          }
        />
        <Route path="/finance-calendar" element={<FinanceCalendar events={events} />} />
        <Route path="/finance-costs" element={<CostManagement />} />
        <Route path="/finance/reports" element={<Reports />} />

        {/* Profiles */}
        <Route path="/finance/profile" element={<FinanceProfile />} />
        <Route path="/admin/profile" element={<AdminProfile />} />

        {/* Admin settings */}
        <Route
          path="/admin-settings"
          element={
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
          }
        />

        {/* User management */}
        <Route path="/invite-member" element={<InviteMember />} />
        <Route path="/admin/users" element={<InviteMember />} />

        {/* Notifications */}
        <Route path="/notifications" element={<NotificationsPage />} />

        {/* Technician area */}
        <Route path="/technician/dashboard" element={<TechnicianDashboard />} />
        <Route path="/technician/calendar" element={<TechnicianCalendar />} />
        <Route path="/technician/events" element={<TechnicianEvents />} />
        <Route path="/technician/events/:eventId" element={<TechnicianEventDetail />} />
        <Route path="/technician/tasks" element={<TechnicianTasks />} />
        <Route path="/technician/profile" element={<TechnicianProfile />} />
        <Route path="/technician/notifications" element={<TechnicianNotifications />} />

        {/* Debug (protected) */}
        <Route path="/debug" element={<Debug />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}