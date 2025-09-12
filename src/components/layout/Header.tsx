import * as React from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Users, FileText, Settings, Home, Users2, Package, CalendarDays, Bell, KanbanSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/config/roles";
import NotificationsBell from "@/components/notifications/NotificationsBell";

const Header = () => {
  const location = useLocation();
  const { user } = useAuth();
  const role = user?.profile?.role;

  const getNavItems = () => {
    const items: { to: string; icon: React.ReactNode; label: string }[] = [];

    if (role === 'Admin' || role === 'Coordenador') {
      items.push(
        { to: "/", icon: <Home className="h-4 w-4 mr-2" />, label: "Dashboard" },
        { to: "/calendar", icon: <CalendarDays className="h-4 w-4 mr-2" />, label: "Calendário" },
        { to: "/create-event", icon: <CalendarDays className="h-4 w-4 mr-2" />, label: "Criar Evento" },
        { to: "/roster-management", icon: <Users className="h-4 w-4 mr-2" />, label: "Escalações" },
        { to: "/employees", icon: <Users2 className="h-4 w-4 mr-2" />, label: "Funcionários" },
        { to: "/roles", icon: <Package className="h-4 w-4 mr-2" />, label: "Funções" },
        { to: "/materials", icon: <Package className="h-4 w-4 mr-2" />, label: "Materiais" },
        { to: "/material-requests", icon: <Package className="h-4 w-4 mr-2" />, label: "Requisições" },
        { to: "/invite-member", icon: <Users2 className="h-4 w-4 mr-2" />, label: "Convidar Membros" },
        { to: "/admin-settings", icon: <Settings className="h-4 w-4 mr-2" />, label: "Configurações" },
        { to: "/notifications", icon: <Bell className="h-4 w-4 mr-2" />, label: "Notificações" }
      );
    } else if (role === 'Gestor de Material') {
      items.push(
        { to: "/", icon: <Home className="h-4 w-4 mr-2" />, label: "Dashboard" },
        { to: "/calendar", icon: <CalendarDays className="h-4 w-4 mr-2" />, label: "Calendário" },
        { to: "/roster-management", icon: <Users className="h-4 w-4 mr-2" />, label: "Escalações" },
        { to: "/materials", icon: <Package className="h-4 w-4 mr-2" />, label: "Materiais" },
        { to: "/material-requests", icon: <Package className="h-4 w-4 mr-2" />, label: "Requisições" },
        { to: "/notifications", icon: <Bell className="h-4 w-4 mr-2" />, label: "Notificações" }
      );
    } else if (role === 'Financeiro') {
      items.push(
        { to: "/finance/dashboard", icon: <Home className="h-4 w-4 mr-2" />, label: "Dashboard" },
        { to: "/finance-profitability", icon: <FileText className="h-4 w-4 mr-2" />, label: "Rentabilidade" },
        { to: "/finance-calendar", icon: <CalendarDays className="h-4 w-4 mr-2" />, label: "Calendário Financeiro" },
        { to: "/finance-costs", icon: <Settings className="h-4 w-4 mr-2" />, label: "Gestão de Custos" },
        { to: "/finance/reports", icon: <FileText className="h-4 w-4 mr-2" />, label: "Relatórios Detalhados" },
        { to: "/finance/profile", icon: <Users className="h-4 w-4 mr-2" />, label: "Meu Perfil" },
        { to: "/notifications", icon: <Bell className="h-4 w-4 mr-2" />, label: "Notificações" }
      );
    } else if (role === 'Técnico') {
      items.push(
        { to: "/technician/dashboard", icon: <Home className="h-4 w-4 mr-2" />, label: "Dashboard" },
        { to: "/technician/calendar", icon: <CalendarDays className="h-4 w-4 mr-2" />, label: "Meu Calendário" },
        { to: "/technician/events", icon: <CalendarDays className="h-4 w-4 mr-2" />, label: "Meus Eventos" },
        { to: "/technician/tasks", icon: <CheckCircle className="h-4 w-4 mr-2" />, label: "Minhas Tarefas" },
        { to: "/technician/tasks-kanban", icon: <KanbanSquare className="h-4 w-4 mr-2" />, label: "Tarefas Kanban" },
        { to: "/technician/profile", icon: <Users className="h-4 w-4 mr-2" />, label: "Meu Perfil" },
        { to: "/technician/notifications", icon: <Bell className="h-4 w-4 mr-2" />, label: "Notificações" }
      );
    }

    return items.filter(item => hasPermission(role, item.to));
  };

  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="p-0">
        <div className="flex flex-col">
          <div className="p-2 border-b">
            <Link to="/" className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
          </div>
          <div className="p-2">
            <div className="space-y-1">
              {getNavItems().map((item) => (
                <Link key={item.to} to={item.to} className="flex items-center gap-2 p-2 rounded hover:bg-accent">
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
        <SheetClose asChild>
          <Button variant="ghost" size="icon">
            <X className="h-5 w-5" />
          </Button>
        </SheetClose>
      </SheetContent>
    </Sheet>
  );
};

export default Header;