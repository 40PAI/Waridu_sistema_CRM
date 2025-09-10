import { NavLink } from "react-router-dom";
import { Bell, Home, LineChart, Package2, Settings, Users, CalendarDays, Archive, Users2, CalendarPlus, Briefcase, ClipboardList, CheckCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { PAGE_PERMISSIONS } from "@/config/roles";

const Sidebar = () => {
  const { user } = useAuth();
  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${isActive ? "bg-muted text-primary" : ""}`;

  const navItems = [
    { to: "/", icon: Home, label: "Dashboard" },
    { to: "/calendar", icon: CalendarDays, label: "Calendário" },
    { to: "/create-event", icon: CalendarPlus, label: "Criar Evento" },
    { to: "/roster-management", icon: Users, label: "Gestão de Escalações" },
    { to: "/employees", icon: Users2, label: "Funcionários" },
    { to: "/roles", icon: Briefcase, label: "Funções" },
    { to: "/materials", icon: Archive, label: "Materiais" },
    { to: "/material-requests", icon: ClipboardList, label: "Requisições" },
    { to: "/finance-dashboard", icon: LineChart, label: "Finance Dashboard" },
    { to: "/admin-settings", icon: Settings, label: "Configurações do Admin" },
  ];

  const technicianNavItems = [
    { to: "/technician/dashboard", icon: Home, label: "Dashboard" },
    { to: "/technician/calendar", icon: CalendarDays, label: "Meu Calendário" },
    { to: "/technician/events", icon: Users, label: "Meus Eventos" },
    { to: "/technician/tasks", icon: CheckCircle, label: "Minhas Tarefas" },
    { to: "/technician/profile", icon: User, label: "Meu Perfil" },
  ];

  const userRole = user?.profile?.role;
  const allowedRoutes = userRole ? PAGE_PERMISSIONS[userRole] : [];
  
  let visibleNavItems = [];
  if (userRole === 'Técnico') {
    visibleNavItems = technicianNavItems.filter(item => allowedRoutes.includes(item.to));
  } else {
    visibleNavItems = navItems.filter(item => allowedRoutes.includes(item.to));
  }

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <NavLink to={userRole === 'Técnico' ? "/technician/dashboard" : "/"} className="flex items-center gap-2 font-semibold">
            <Package2 className="h-6 w-6" />
            <span className="">Sua Empresa</span>
          </NavLink>
          <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Toggle notifications</span>
          </Button>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {visibleNavItems.map(item => (
              <NavLink 
                to={item.to} 
                className={navLinkClasses} 
                key={item.to} 
                end={item.to === "/" || item.to === "/technician/dashboard"}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;