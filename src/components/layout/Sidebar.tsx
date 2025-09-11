import { NavLink } from "react-router-dom";
import { Bell, Home, LineChart, Package2, Settings, Users, CalendarDays, Archive, Users2, CalendarPlus, Briefcase, ClipboardList, CheckCircle, User, TrendingUp, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { PAGE_PERMISSIONS } from "@/config/roles";

const Sidebar = () => {
  const { user } = useAuth();
  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${isActive ? "bg-muted text-primary" : ""}`;

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

  const finance = [
    { to: "/finance-dashboard", icon: LineChart, label: "Finance Dashboard" },
    { to: "/finance-profitability", icon: TrendingUp, label: "Rentabilidade" },
    { to: "/finance-calendar", icon: CalendarDays, label: "Calendário Financeiro" },
    { to: "/finance-costs", icon: Wallet, label: "Gestão de Custos" },
  ];

  const admin = [
    { to: "/admin-settings", icon: Settings, label: "Configurações do Admin" },
    { to: "/invite-member", icon: Package2, label: "Convidar Membro" },
    { to: "/debug", icon: Bell, label: "Debug" },
  ];

  const userRole = user?.profile?.role;
  const allowed = userRole ? PAGE_PERMISSIONS[userRole] : [];

  const items = [...common, ...finance, ...admin].filter(i => allowed.includes(i.to));

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center border-b px-4">
          <NavLink to="/" className="flex items-center gap-2 text-lg font-semibold">
            <Package2 className="h-6 w-6" /> Sua Empresa
          </NavLink>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1 text-sm font-medium">
          {items.map(item => (
            <NavLink key={item.to} to={item.to} className={navLinkClasses} end={item.to === "/"}>
              <item.icon className="h-4 w-4" /> {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;