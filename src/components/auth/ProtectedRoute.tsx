import * as React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/config/roles";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, user } = useAuth();
  const location = useLocation();

  // Se não tem sessão ou usuário, redireciona para login
  if (!session || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se tem sessão mas não tem role definido, redireciona para welcome
  if (!user.profile?.role) {
    return <Navigate to="/welcome" replace />;
  }

  // Verifica se o usuário tem permissão para acessar a rota atual
  const hasAccess = hasPermission(user.profile.role, location.pathname);
  
  if (!hasAccess) {
    // Redireciona para o dashboard principal do role
    const rolePaths: Record<string, string> = {
      "Técnico": "/technician/dashboard",
      "Financeiro": "/finance/dashboard",
      "Gestor de Material": "/",
      "Admin": "/",
      "Coordenador": "/"
    };
    
    const fallbackPath = rolePaths[user.profile.role] || "/";
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;