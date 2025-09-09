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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/roster-management" element={<RosterManagement />} />
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

export default App;