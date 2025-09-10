import { Link, NavLink, useNavigate } from "react-router-dom";
import { CircleUser, Home, LineChart, Menu, Package2, Settings, Users, CalendarDays, Archive, Users2, CalendarPlus, Briefcase, ClipboardList, CheckCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { PAGE_PERMISSIONS, hasActionPermission } from "@/config/roles";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

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

  const materialManagerNavItems = [
    { to: "/material-manager/dashboard", icon: Home, label: "Dashboard" },
    { to: "/material-manager/calendar", icon: CalendarDays, label: "Calendário Geral" },
    { to: "/material-manager/requests", icon: ClipboardList, label: "Requisições" },
    { to: "/material-manager/inventory", icon: Archive, label: "Inventário" },
    { to: "/material-manager/tasks", icon: CheckCircle, label: "Minhas Tarefas" },
    { to: "/material-manager/profile", icon: User, label: "Meu Perfil" },
  ];

  const userRole = user?.profile?.role;
  const allowedRoutes = userRole ? PAGE_PERMISSIONS[userRole] : [];

  let visibleNavItems: { to: string; icon: any; label: string }[] = [];
  if (userRole === "Técnico") {
    visibleNavItems = technicianNavItems.filter((item) => allowedRoutes.includes(item.to));
  } else if (userRole === "Gestor de Material") {
    visibleNavItems = materialManagerNavItems.filter((item) => allowedRoutes.includes(item.to));
  } else {
    visibleNavItems = navItems.filter((item) => allowedRoutes.includes(item.to));
  }

  const homeLink =
    userRole === "Técnico"
      ? "/technician/dashboard"
      : userRole === "Gestor de Material"
      ? "/material-manager/dashboard"
      : "/";

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <nav className="grid gap-2 text-lg font-medium">
            <Link to={homeLink} className="flex items-center gap-2 text-lg font-semibold mb-4">
              <Package2 className="h-6 w-6" />
              <span className="sr-only">Sua Empresa</span>
            </Link>
            {visibleNavItems.map((item) => (
              <NavLink
                to={item.to}
                className={navLinkClasses}
                key={item.to}
                end={item.to === "/" || item.to === "/technician/dashboard" || item.to === "/material-manager/dashboard"}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="w-full flex-1"></div>
      {userRole && hasActionPermission(userRole, "members:invite") && (
        <Link to="/invite-member">
          <Button>Convidar Novo Membro</Button>
        </Link>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <CircleUser className="h-5 w-5" />
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            <p>{user?.profile?.first_name || user?.email}</p>
            <p className="text-xs font-normal text-muted-foreground">{user?.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to={userRole === "Técnico" ? "/technician/profile" : userRole === "Gestor de Material" ? "/material-manager/profile" : "/"}>Perfil</Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>Sair</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};

export default Header;