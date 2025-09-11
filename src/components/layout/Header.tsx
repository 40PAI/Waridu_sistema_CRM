import { Link, NavLink, useNavigate } from "react-router-dom";
import { Bell, CircleUser, Home, LineChart, Package2, Settings, Users, CalendarDays, Archive, Users2, CalendarPlus, Briefcase, ClipboardList, CheckCircle, User, TrendingUp, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { PAGE_PERMISSIONS, hasActionPermission } from "@/config/roles";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

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
    { to: "/finance-profitability", icon: TrendingUp, label: "Rentabilidade" },
    { to: "/finance-calendar", icon: CalendarDays, label: "Calendário Financeiro" },
    { to: "/finance-costs", icon: Wallet, label: "Gestão de Custos" },
    { to: "/finance/profile", icon: User, label: "Meu Perfil" },
  ];

  const admin = [
    { to: "/admin-settings", icon: Settings, label: "Configurações" },
    { to: "/invite-member", icon: Package2, label: "Convidar" },
    { to: "/debug", icon: Bell, label: "Debug" },
  ];

  const navItems = [...common, ...finance, ...admin];
  const userRole = user?.profile?.role;
  const allowed = userRole ? PAGE_PERMISSIONS[userRole] : [];

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 transition hover:text-primary ${isActive ? "text-primary" : "text-muted-foreground"}`;

  return (
    <header className="flex h-14 items-center border-b bg-muted/40 px-4">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Abrir menu de navegação">
            <span className="sr-only">Abrir menu</span>
            {/* Add hamburger icon here if needed */}
          </Button>
        </SheetTrigger>
        <SheetContent>
          <nav className="flex flex-col" aria-label="Navegação principal">
            {navItems.filter(i => allowed.includes(i.to)).map(item => (
              <NavLink key={item.to} to={item.to} className={navLinkClasses} end={item.to === "/"}>
                <item.icon className="h-5 w-5" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="flex-1" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" aria-label="Menu do usuário">
            <CircleUser aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            <p>{user?.profile?.first_name || user?.email}</p>
            <p className="text-xs">{user?.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to={userRole === 'Financeiro' ? "/finance/profile" : "/technician/profile"}>
              Perfil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};

export default Header;