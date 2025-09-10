import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { hasPermission, PERMISSIONS } from "@/config/roles";

const ProtectedRoute = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const canAccess = hasPermission(user.role, location.pathname);

  if (!canAccess) {
    // Redireciona para a primeira página permitida se o acesso for negado
    const fallbackRoute = PERMISSIONS[user.role][0] || '/';
    return <Navigate to={fallbackRoute} replace />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};

export default ProtectedRoute;