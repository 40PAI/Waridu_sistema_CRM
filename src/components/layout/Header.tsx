import * as React from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Users, FileText, Settings, Home, Users2, Package, CalendarDays, Bell, KanbanSquare, CheckCircle, X, LogOut, Calendar, LayoutGrid } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/config/roles";
import NotificationsBell from "@/components/notifications/NotificationsBell";
import { useEffect } from "react";

const Header = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.profile?.role;

  // Ensure redirect to login if user is null (handles logout properly)
  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  const getNavItems = () => {
    const items: { to: string; icon: React.ReactNode; label: string }[] = [];

    if (role === 'Admin' || role === 'Coordenador') {
      items.push(
        { to: "/", icon: <Home className="h-4 w-4 mr-2" />, label: "Dashboard" },
        { to: "/calendar", icon: <Calendar className="h-4 w-4 mr-2" />, label: "Calendário" },
        { to: "/create-event", icon: <CalendarDays className="h-4 w-4 mr-2" />, label: "Criar Evento" },
        { to: "/roster-management", icon: <Users className="h-4 w-4 mr-2" />, label: "Escalações" },
        { to: "/employees", icon: <Users2 className="h-4 w-4 mr-2" />, label: "Funcionários" },
        { to: "/roles", icon: <Package className="h-4 w-4 mr-2" />, label: "Funções" },
        { to: "/materials", icon: <Package className="h-4 w-4 mr-2" />, label: "Materiais" },
        { to: "/material-requests", icon: <Package className="h-4 w-4 mr-2" />, label: "Requisições" }
      );
    }

    if (role === 'Admin' || role === 'Comercial') {
      items.push(
        { to: "/crm/dashboard", icon: <LayoutGrid className="h-4 w-4 mr-2" />, label: "Dashboard CRM" },
        { to: "/crm/pipeline", icon: <KanbanSquare className="h-4 w-4 mr-2" />, label: "Pipeline" },
        { to: "/crm/clients", icon: <Users className="h-4 w-4 mr-2" />, label: "Clientes" }
      );
    }

    if (role === 'Admin' || role === 'Financeiro') {
      items.push(
        { to: "/finance/dashboard", icon: <Home className="h-4 w-4 mr-2" />, label: "Dashboard Fin." },
        { to: "/finance-profitability", icon: <FileText className="h-4 w-4 mr-2" />, label: "Rentabilidade" },
        { to: "/finance-calendar", icon: <CalendarDays className="h-4 w-4 mr-2" />, label: "Calendário Fin." },
        { to: "/finance-costs", icon: <Settings className="h-4 w-4 mr-2" />, label: "Gestão de Custos" },
        { to: "/finance/reports", icon: <FileText className="h-4 w-4 mr-2" />, label: "Relatórios" }
      );
    }

    if (role === 'Técnico') {
      items.push(
        { to: "/technician/dashboard", icon: <Home className="h-4 w-4 mr-2" />, label: "Dashboard" },
        { to: "/technician/calendar", icon: <Calendar className="h-4 w-4 mr-2" />, label: "Meu Calendário" },
        { to: "/technician/events", icon: <CalendarDays className="h-4 w-4 mr-2" />, label: "Meus Eventos" },
        { to: "/technician/tasks", icon: <CheckCircle className="h-4 w-4 mr-2" />, label: "Minhas Tarefas" },
        { to: "/technician/tasks-kanban", icon: <KanbanSquare className="h-4 w-4 mr-2" />, label: "Tarefas Kanban" }
      );
    }

    if (role === 'Admin') {
      items.push(
        { to: "/invite-member", icon: <Users2 className="h-4 w-4 mr-2" />, label: "Convidar Membros" },
        { to: "/admin-settings", icon: <Settings className="h-4 w-4 mr-2" />, label: "Configurações" },
        { to: "/admin/tasks", icon: <CheckCircle className="h-4 w-4 mr-2" />, label: "Gerenciar Tarefas" }
      );
    }

    const profileLink = role === 'Admin' ? '/admin/profile' :
                      role === 'Financeiro' ? '/finance/profile' :
                      role === 'Gestor de Material' ? '/material-manager/profile' :
                      role === 'Técnico' ? '/technician/profile' :
                      '/';
    
    items.push(
      { to: "/notifications", icon: <Bell className="h-4 w-4 mr-2" />, label: "Notificações" },
      { to: profileLink, icon: <Users className="h-4 w-4 mr-2" />, label: "Meu Perfil" }
    );

    return items.filter(item => hasPermission(role, item.to));
  };

  const [open, setOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b">
                <Link to="/" className="flex items-center gap-2 font-semibold" onClick={() => setOpen(false)}>
                  <Home className="h-5 w-5" />
                  <span>Dashboard</span>
                </Link>
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-1">
                  {getNavItems().map((item) => (
                    <Button
                      key={item.to}
                      variant={location.pathname === item.to ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      asChild
                    >
                      <Link to={item.to} onClick={() => setOpen(false)}>
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
              <div className="p-4 border-t">
                <Button variant="outline" size="sm" onClick={handleLogout} className="w-full flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.profile?.avatar_url || undefined} />
            <AvatarFallback>{user?.profile?.first_name?.[0] || user?.email?.[0]}</AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-medium leading-none">
              {user?.profile?.first_name} {user?.profile?.last_name}
            </p>
            <p className="text-xs text-muted-foreground">{user?.profile?.role}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <NotificationsBell />
        <Button variant="outline" size="sm" onClick={handleLogout} className="hidden md:flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          <span className="hidden md:inline">Sair</span>
        </Button>
      </div>
    </div>
  );
};

export default Header;