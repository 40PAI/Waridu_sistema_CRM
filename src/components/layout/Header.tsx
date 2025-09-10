import { Link, NavLink, useNavigate } from "react-router-dom";
import { CircleUser, Home, LineChart, Menu, Package2, Settings, Users, CalendarDays, Archive, Users2, CalendarPlus, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS } from "@/config/roles";

const Header = () => {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
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
    { to: "/finance-dashboard", icon: LineChart, label: "Finance Dashboard" },
    { to: "/admin-settings", icon: Settings, label: "Configurações do Admin" },
  ];

  const allowedRoutes = user ? PERMISSIONS[user.role] : [];
  const visibleNavItems = navItems.filter(item => allowedRoutes.includes(item.to));

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
            <Link to="/" className="flex items-center gap-2 text-lg font-semibold mb-4">
              <Package2 className="h-6 w-6" />
              <span className="sr-only">Sua Empresa</span>
            </Link>
            {visibleNavItems.map(item => (
              <NavLink to={item.to} className={navLinkClasses} key={item.to} end={item.to === "/"}>
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="w-full flex-1"></div>
      {user && PERMISSIONS[user.role].includes('/invite-member') && (
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
            <p>{user?.name}</p>
            <p className="text-xs font-normal text-muted-foreground">{user?.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Mudar Papel (Dev)</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => switchRole('Admin')}>Admin</DropdownMenuItem>
              <DropdownMenuItem onClick={() => switchRole('Coordenador')}>Coordenador</DropdownMenuItem>
              <DropdownMenuItem onClick={() => switchRole('Gestor de Material')}>Gestor de Material</DropdownMenuItem>
              <DropdownMenuItem onClick={() => switchRole('Financeiro')}>Financeiro</DropdownMenuItem>
              <DropdownMenuItem onClick={() => switchRole('Técnico')}>Técnico</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>Sair</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};

export default Header;