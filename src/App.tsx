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
import MaterialsPage from "@/pages/Materials";
import MaterialRequestsPage from "@/pages/MaterialRequests";
import AdminSettings from "@/pages/AdminSettings";
import InviteMember from "@/pages/InviteMember";
import DebugPage from "@/pages/Debug";
import FinanceDashboard from "@/pages/finance/Dashboard";
import Profitability from "@/pages/finance/Profitability";
import FinanceCalendar from "@/pages/finance/Calendar";
import CostManagement from "@/pages/finance/CostManagement";

import { useEvents } from "@/hooks/useEvents";
import { useEmployees } from "@/hooks/useEmployees";
import { useTechnicianCategories } from "@/hooks/useTechnicianCategories";

function App() {
  const { events } = useEvents();
  const { employees } = useEmployees();
  const { categories } = useTechnicianCategories();

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<IndexPage events={events} materials={[]} />} />
            <Route path="/calendar" element={<CalendarPage events={events} />} />
            <Route path="/create-event" element={<CreateEventPage onAddEvent={() => {}} />} />
            <Route path="/roster-management" element={<RosterManagement events={events} employees={employees} onUpdateEventDetails={() => {}} onUpdateEvent={() => {}} onCreateMaterialRequest={() => {}} pendingRequests={[]} materials={[]} />} />
            <Route path="/employees" element={<EmployeesPage roles={[]} employees={employees} onSaveEmployee={() => {}} />} />
            <Route path="/roles" element={<RolesPage roles={[]} employees={employees} events={events} />} />
            <Route path="/materials" element={<MaterialsPage materials={[]} locations={[]} onSaveMaterial={() => {}} onTransferMaterial={() => {}} history={[]} pendingRequests={[]} />} />
            <Route path="/material-requests" element={<MaterialRequestsPage requests={[]} events={events} materialNameMap={{}} onApproveRequest={() => ({ ok: true })} onRejectRequest={() => {}} />} />
            <Route path="/admin-settings" element={<AdminSettings roles={[]} onAddRole={() => {}} onUpdateRole={() => {}} onDeleteRole={() => {}} locations={[]} onAddLocation={() => {}} onUpdateLocation={() => {}} onDeleteLocation={() => {}} />} />
            <Route path="/invite-member" element={<InviteMember />} />
            <Route path="/debug" element={<DebugPage />} />

            <Route path="/finance-dashboard" element={<FinanceDashboard events={events} employees={employees} categories={categories} />} />
            <Route path="/finance-profitability" element={<Profitability events={events} employees={employees} categories={categories} />} />
            <Route path="/finance-calendar" element={<FinanceCalendar events={events} />} />
            <Route path="/finance-costs" element={<CostManagement />} />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;