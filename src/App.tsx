import { BrowserRouter, Routes, Route } from "react-router-dom";
import FinanceDashboard from "@/pages/finance/Dashboard";
import Profitability from "@/pages/finance/Profitability";
import FinanceCalendar from "@/pages/finance/Calendar";
import CostManagement from "@/pages/finance/CostManagement";
// … keep existing imports

// inside <Routes> under <ProtectedRoute>:
<Route path="/finance-dashboard" element={<FinanceDashboard events={events} employees={employees} categories={categories} />} />
<Route path="/finance-profitability" element={<Profitability events={events} employees={employees} categories={categories} />} />
<Route path="/finance-calendar" element={<FinanceCalendar events={events} />} />
<Route path="/finance-costs" element={<CostManagement />} />
// … rest unchanged
export default App;