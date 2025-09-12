"use client";

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { hasPermission } from "@/config/roles";

// Pages
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import CreateEvent from "@/pages/CreateEvent";
import Calendar from "@/pages/Calendar";
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
import TechnicianTasksKanban from "@/pages/technician/TasksKanban"; // New import for Kanban page
import FinanceDashboard from "@/pages/finance/Dashboard";
import FinanceProfile from "@/pages/finance/Profile";
import Profitability from "@/pages/finance/Profitability";
import FinanceCalendar from "@/pages/finance/Calendar";
import CostManagement from "@/pages/finance/CostManagement";
import Reports from "@/pages/finance/Reports";
import Notifications from "@/pages/Notifications"; // Shared notifications page

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={
            user ? (
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
          <Route path="/create-event" element={
            <ProtectedRoute>
              <CreateEvent />
            </ProtectedRoute>
          } />
          <Route path="/calendar" element={
            <ProtectedRoute>
              <Calendar />
            </ProtectedRoute>
          } />
          <Route path="/roster-management" element={
            <ProtectedRoute>
              <RosterManagement />
            </ProtectedRoute>
          } />
          <Route path="/employees" element={
            <ProtectedRoute>
              <Employees />
            </ProtectedRoute>
          } />
          <Route path="/roles" element={
            <ProtectedRoute>
              <Roles />
            </ProtectedRoute>
          } />
          <Route path="/roles/:roleId" element={
            <ProtectedRoute>
              <RoleDetail />
            </ProtectedRoute>
          } />
          <Route path="/materials" element={
            <ProtectedRoute>
              <Materials />
            </ProtectedRoute>
          } />
          <Route path="/material-requests" element={
            <ProtectedRoute>
              <MaterialRequests />
            </ProtectedRoute>
          } />
          <Route path="/admin-settings" element={
            <ProtectedRoute>
              <AdminSettings />
            </ProtectedRoute>
          } />
          <Route path="/invite-member" element={
            <ProtectedRoute>
              <InviteMember />
            </ProtectedRoute>
          } />
          <Route path="/health-check" element={<HealthCheck />} />
          <Route path="/debug" element={<Debug />} />

          {/* Technician Routes */}
          <Route path="/technician/dashboard" element={
            <ProtectedRoute>
              <TechnicianDashboard />
            </ProtectedRoute>
          } />
          <Route path="/technician/calendar" element={
            <ProtectedRoute>
              <TechnicianCalendar />
            </ProtectedRoute>
          } />
          <Route path="/technician/events" element={
            <ProtectedRoute>
              <TechnicianEvents />
            </ProtectedRoute>
          } />
          <Route path="/technician/events/:eventId" element={
            <ProtectedRoute>
              <TechnicianEventDetail />
            </ProtectedRoute>
          } />
          <Route path="/technician/tasks" element={
            <ProtectedRoute>
              <TechnicianTasks />
            </ProtectedRoute>
          } />
          <Route path="/technician/tasks-kanban" element={
            <ProtectedRoute>
              <TechnicianTasksKanban />
            </ProtectedRoute>
          } />
          <Route path="/technician/profile" element={
            <ProtectedRoute>
              <TechnicianProfile />
            </ProtectedRoute>
          } />
          <Route path="/technician/notifications" element={
            <ProtectedRoute>
              <TechnicianNotifications />
            </ProtectedRoute>
          } />

          {/* Finance Routes */}
          <Route path="/finance/dashboard" element={
            <ProtectedRoute>
              <FinanceDashboard />
            </ProtectedRoute>
          } />
          <Route path="/finance/profile" element={
            <ProtectedRoute>
              <FinanceProfile />
            </ProtectedRoute>
          } />
          <Route path="/finance-profitability" element={
            <ProtectedRoute>
              <Profitability />
            </ProtectedRoute>
          } />
          <Route path="/finance-calendar" element={
            <ProtectedRoute>
              <FinanceCalendar />
            </ProtectedRoute>
          } />
          <Route path="/finance-costs" element={
            <ProtectedRoute>
              <CostManagement />
            </ProtectedRoute>
          } />
          <Route path="/finance/reports" element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } />

          {/* Admin Profile */}
          <Route path="/admin/profile" element={
            <ProtectedRoute>
              <AdminProfile />
            </ProtectedRoute>
          } />

          {/* Shared Notifications */}
          <Route path="/notifications" element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;