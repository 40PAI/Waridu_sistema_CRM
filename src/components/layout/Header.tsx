import { Link, NavLink } from "react-router-dom";
import { CircleUser, Home, LineChart, Menu, Package, Package2, Search, Settings, ShoppingCart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Header = () => {
  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${isActive ? "bg-muted text-primary" : ""}`;

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
            <NavLink to="/" className={navLinkClasses} end>
              <Home className="h-5 w-5" />
              Dashboard
            </NavLink>
            <NavLink to="/roster-management" className={navLinkClasses}>
              <Users className="h-5 w-5" />
              Gestão de Escalações
            </NavLink>
            <NavLink to="/finance-dashboard" className={navLinkClasses}>
              <LineChart className="h-5 w-5" />
              Finance Dashboard
            </NavLink>
            <NavLink to="/admin-settings" className={navLinkClasses}>
              <Settings className="h-5 w-5" />
              Configurações do Admin
            </NavLink>
          </nav>
        </SheetContent>
      </Sheet>
      <div className="w-full flex-1">
        {/* Pode adicionar breadcrumbs ou título da página aqui */}
      </div>
      <Link to="/invite-member">
        <Button>Convidar Novo Membro</Button>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <CircleUser className="h-5 w-5" />
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};

export default Header;