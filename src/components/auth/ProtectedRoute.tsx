import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { hasPermission, PAGE_PERMISSIONS } from "@/config/roles";
import { Skeleton } from "@/components/ui/skeleton";

const ProtectedRoute = () => {
  const { session, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-4 w-[250px]" />
        </div>
      </div>
    );
  }

  if (!session || !user || !user.profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = user.profile.role;
  const canAccess = hasPermission(userRole, location.pathname);

  if (!canAccess) {
    // Redirect to the first page allowed for the user's role
    const fallbackRoute = PAGE_PERMISSIONS[userRole]?.[0] || '/';
    return <Navigate to={fallbackRoute} replace />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};

export default ProtectedRoute;