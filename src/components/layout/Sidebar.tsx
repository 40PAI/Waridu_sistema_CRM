import { NavLink } from "react-router-dom";
import { Bell, Home, LineChart, Package2, Settings, Users, CalendarDays, Archive, Users2, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

const Sidebar = () => {
  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${isActive ? "bg-muted text-primary" : ""}`;

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <NavLink to="/" className="flex items-center gap-2 font-semibold">
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
            <NavLink to="/" className={navLinkClasses} end>
              <Home className="h-4 w-4" />
              Dashboard
            </NavLink>
            <NavLink to="/calendar" className={navLinkClasses}>
              <CalendarDays className="h-4 w-4" />
              Calendário
            </NavLink>
            <NavLink to="/create-event" className={navLinkClasses}>
              <CalendarPlus className="h-4 w-4" />
              Criar Evento
            </NavLink>
            <NavLink to="/roster-management" className={navLinkClasses}>
              <Users className="h-4 w-4" />
              Gestão de Escalações
            </NavLink>
            <NavLink to="/employees" className={navLinkClasses}>
              <Users2 className="h-4 w-4" />
              Funcionários
            </NavLink>
            <NavLink to="/materials" className={navLinkClasses}>
              <Archive className="h-4 w-4" />
              Materiais
            </NavLink>
            <NavLink to="/finance-dashboard" className={navLinkClasses}>
              <LineChart className="h-4 w-4" />
              Finance Dashboard
            </NavLink>
            <NavLink to="/admin-settings" className={navLinkClasses}>
              <Settings className="h-4 w-4" />
              Configurações do Admin
            </NavLink>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;