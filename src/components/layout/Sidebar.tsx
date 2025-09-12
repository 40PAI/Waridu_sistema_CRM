import { NavLink } from "react-router-dom";
import { Bell, Home, LineChart, Package2, Settings, Users, CalendarDays, Archive, Users2, CalendarPlus, Briefcase, ClipboardList, CheckCircle, User, TrendingUp, Wallet, UserPlus, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { PAGE_PERMISSIONS } from "@/config/roles";

const Sidebar = () => {
  const { user } = useAuth();
  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${isActive ? "bg-muted text-primary" : ""}`;

  const userRole = user?.profile?.role;
  const allowed = userRole ? PAGE_PERMISSIONS[userRole] : [];

  const common = [
    { to: "/", icon: Home, label: "Dashboard" },
    { to: "/calendar", icon: CalendarDays, label: "Calendário" },
    { to: "/create-event", icon: CalendarPlus, label: "Criar Evento" },
    { to: "/roster-management", icon: Users, label: "Gestão de Escalações" },
    { to: "/employees", icon: Users2, label: "Funcionários" },
    { to: "/roles", icon: Briefcase, label: "Funções" },
    { to: "/materials", icon: Archive, label: "Materiais" },
    { to: "/material-requests", icon: ClipboardList, label: "Requisições" },
  ];

  const admin = [
    { to: "/admin-settings", icon: Settings, label: "Configurações" },
    { to: "/invite-member", icon: UserPlus, label: "Convidar" },
  ];

  const finance = [
    { to: "/finance/dashboard", icon: BarChart3, label: "Dashboard Financeiro" },
    { to: "/finance-profitability", icon: TrendingUp, label: "Rentabilidade" },
    { to: "/finance-calendar", icon: CalendarDays, label: "Calendário Financeiro" },
    { to: "/finance-costs", icon: Wallet, label: "Gestão de Custos" },
    { to: "/finance/profile", icon: User, label: "Meu Perfil" },
  ];

  const technician = [
    { to: "/technician/dashboard", icon: Home, label: "Meu Dashboard" },
    { to: "/technician/calendar", icon: CalendarDays, label: "Meu Calendário" },
    { to: "/technician/events", icon: Briefcase, label: "Meus Eventos" },
    { to: "/technician/tasks", icon: CheckCircle, label: "Minhas Tarefas" },
    { to: "/technician/notifications", icon: Bell, label: "Notificações" },
    { to: "/technician/profile", icon: User, label: "Meu Perfil" },
  ];

  const allNavItems = [...common, ...finance, ...admin, ...technician];
  const navItems = allNavItems.filter(i => allowed.includes(i.to));

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center border-b px-4">
          <NavLink to="/" className="flex items-center gap-2 text-lg font-semibold" aria-label="Ir para Dashboard">
            <Package2 className="h-6 w-6" aria-hidden="true" />
            Sua Empresa
          </NavLink>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1 text-sm font-medium" aria-label="Navegação principal">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} className={navLinkClasses} end={item.to === "/" || item.to.endsWith("dashboard")} aria-label={`Ir para ${item.label}`}>
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;