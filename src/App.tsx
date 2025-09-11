import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import NotFound from "@/pages/NotFound";
import LoginPage from "@/pages/Login";
import IndexPage from "@/pages/Index";
import CalendarPage from "@/pages/Calendar";
import CreateEventPage from "@/pages/CreateEvent";
import RosterManagement from "@/pages/RosterManagement";
import EmployeesPage from "@/pages/Employees";
import RolesPage from "@/pages/Roles";
import RoleDetail from "@/pages/RoleDetail";
import MaterialsPage from "@/pages/Materials";
import MaterialRequestsPage from "@/pages/MaterialRequests";
import AdminSettings from "@/pages/AdminSettings";
import InviteMember from "@/pages/InviteMember";
import GerenciarMembros from "@/pages/admin/GerenciarMembros";
import Profitability from "@/pages/finance/Profitability";
import FinanceCalendar from "@/pages/finance/Calendar";
import CostManagement from "@/pages/finance/CostManagement";
import FinanceProfile from "@/pages/finance/Profile";
import TechnicianDashboard from "@/pages/technician/Dashboard";
import TechnicianCalendar from "@/pages/technician/Calendar";
import TechnicianEvents from "@/pages/technician/Events";
import TechnicianEventDetail from "@/pages/technician/EventDetail";
import TechnicianTasks from "@/pages/technician/Tasks";
import TechnicianProfile from "@/pages/technician/Profile";
import TechnicianNotifications from "@/pages/technician/Notifications";

import { useEvents } from "@/hooks/useEvents";
import { useEmployees } from "@/hooks/useEmployees";
import { useTechnicianCategories } from "@/hooks/useTechnicianCategories";
import { useRoles } from "@/hooks/useRoles";
import { useLocations } from "@/hooks/useLocations";
import { useMaterials } from "@/hooks/useMaterials";
import { useMaterialRequests } from "@/hooks/useMaterialRequests";
import ErrorBoundary from "@/components/common/ErrorBoundary";

function App() {
  const { events, addEvent, updateEvent, updateEventDetails } = useEvents();
  const { employees, saveEmployee } = useEmployees();
  const { categories } = useTechnicianCategories();
  const { roles, addRole, updateRole, deleteRole } = useRoles();
  const { locations, addLocation, updateLocation, deleteLocation } = useLocations();
  const { materials: pageMaterials, rawMaterials, saveMaterial, transferMaterial } = useMaterials();
  const { materialRequests, pendingRequests, createMaterialRequest, approveMaterialRequest, rejectMaterialRequest } = useMaterialRequests();

  const materialNameMap = React.useMemo(() =>
    Object.fromEntries(pageMaterials.map(m => [m.id, m.name])),
    [pageMaterials]
  );

  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<IndexPage events={events} materials={pageMaterials} />} />
              <Route path="/calendar" element={<CalendarPage events={events} />} />
              <Route path="/create-event" element={<CreateEventPage onAddEvent={addEvent} />} />
              <Route path="/roster-management" element={<RosterManagement events={events} employees={employees} onUpdateEventDetails={updateEventDetails} onUpdateEvent={updateEvent} onCreateMaterialRequest={createMaterialRequest} pendingRequests={pendingRequests} materials={rawMaterials} />} />
              <Route path="/employees" element={<EmployeesPage roles={roles} employees={employees} onSaveEmployee={saveEmployee} />} />
              <Route path="/roles" element={<RolesPage roles={roles} employees={employees} events={events} />} />
              <Route path="/roles/:roleId" element={<RoleDetail roles={roles} employees={employees} events={events} />} />
              <Route path="/materials" element={<MaterialsPage materials={pageMaterials} locations={locations} onSaveMaterial={saveMaterial} onTransferMaterial={transferMaterial} history={[]} pendingRequests={pendingRequests} />} />
              <Route path="/material-requests" element={<MaterialRequestsPage requests={materialRequests} events={events} materialNameMap={materialNameMap} onApproveRequest={approveMaterialRequest} onRejectRequest={rejectMaterialRequest} />} />
              <Route path="/admin-settings" element={<AdminSettings roles={roles} onAddRole={addRole} onUpdateRole={updateRole} onDeleteRole={deleteRole} locations={locations} onAddLocation={addLocation} onUpdateLocation={updateLocation} onDeleteLocation={deleteLocation} />} />
              <Route path="/invite-member" element={<InviteMember />} />
              <Route path="/admin/members" element={<GerenciarMembros />} />
              <Route path="/finance-profitability" element={<Profitability events={events} employees={employees} categories={categories} />} />
              <Route path="/finance-calendar" element={<FinanceCalendar events={events} />} />
              <Route path="/finance-costs" element={<CostManagement />} />
              <Route path="/finance/profile" element={<FinanceProfile />} />
              <Route path="/technician/dashboard" element={<TechnicianDashboard />} />
              <Route path="/technician/calendar" element={<TechnicianCalendar />} />
              <Route path="/technician/events" element={<TechnicianEvents />} />
              <Route path="/technician/events/:eventId" element={<TechnicianEventDetail />} />
              <Route path="/technician/tasks" element={<TechnicianTasks />} />
              <Route path="/technician/profile" element={<TechnicianProfile />} />
              <Route path="/technician/notifications" element={<TechnicianNotifications />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;