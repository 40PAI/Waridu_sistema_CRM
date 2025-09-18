import * as React from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Users, FileText, Settings, Home, Users2, Package, CalendarDays, Bell, KanbanSquare, CheckCircle, LayoutGrid } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/config/roles";
import { Calendar } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";

const SidebarNav = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const role = user?.profile?.role;

  const getNavItems = () => {
    const items: { to: string; icon: React.ReactNode; label: string }[] = [];

    if (role === 'Admin' || role === 'Coordenador') {
      items.push(
        { to: "/", icon: <Home className="h-4 w-4 mr-2" />, label: "Dashboard" },
        { to: "/calendar", icon: <Calendar className="h-4 w-4 mr-2" />, label: "Calendário" },
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

  const navItems = getNavItems();

  // Group items for display
  const mainGroup = navItems.filter(item => ['/', '/calendar', '/roster-management', '/employees', '/roles', '/materials', '/material-requests'].includes(item.to));
  const crmGroup = navItems.filter(item => item.to.startsWith('/crm/'));
  const financeGroup = navItems.filter(item => item.to.startsWith('/finance'));
  const technicianGroup = navItems.filter(item => item.to.startsWith('/technician'));
  const adminGroup = navItems.filter(item => ['/invite-member', '/admin-settings', '/admin/tasks'].includes(item.to));
  const generalGroup = navItems.filter(item => !mainGroup.includes(item) && !crmGroup.includes(item) && !financeGroup.includes(item) && !technicianGroup.includes(item) && !adminGroup.includes(item));

  return (
    <Sidebar>
      <SidebarContent className="flex flex-col">
        <div className="p-2">
          <Button variant="ghost" size="icon" className="w-full justify-start" asChild>
            <Link to="/">
              <Home className="h-5 w-5 mr-2" />
              <span className="hidden md:inline">Dashboard</span>
            </Link>
          </Button>
        </div>

        <Accordion type="multiple" defaultValue={["main", "crm", "finance", "technician", "admin"]} className="w-full">
          {mainGroup.length > 0 && (
            <AccordionItem value="main">
              <AccordionTrigger className="px-4 py-2 text-left">Operacional</AccordionTrigger>
              <AccordionContent className="px-2">
                <SidebarMenu>
                  {mainGroup.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild>
                        <Link to={item.to} className={location.pathname === item.to ? "bg-accent text-accent-foreground" : ""}>
                          {item.icon}
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </AccordionContent>
            </AccordionItem>
          )}

          {crmGroup.length > 0 && (
            <AccordionItem value="crm">
              <AccordionTrigger className="px-4 py-2 text-left">CRM</AccordionTrigger>
              <AccordionContent className="px-2">
                <SidebarMenu>
                  {crmGroup.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild>
                        <Link to={item.to} className={location.pathname === item.to ? "bg-accent text-accent-foreground" : ""}>
                          {item.icon}
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </AccordionContent>
            </AccordionItem>
          )}

          {financeGroup.length > 0 && (
            <AccordionItem value="finance">
              <AccordionTrigger className="px-4 py-2 text-left">Financeiro</AccordionTrigger>
              <AccordionContent className="px-2">
                <SidebarMenu>
                  {financeGroup.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild>
                        <Link to={item.to} className={location.pathname === item.to ? "bg-accent text-accent-foreground" : ""}>
                          {item.icon}
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </AccordionContent>
            </AccordionItem>
          )}

          {technicianGroup.length > 0 && (
            <AccordionItem value="technician">
              <AccordionTrigger className="px-4 py-2 text-left">Técnico</AccordionTrigger>
              <AccordionContent className="px-2">
                <SidebarMenu>
                  {technicianGroup.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild>
                        <Link to={item.to} className={location.pathname === item.to ? "bg-accent text-accent-foreground" : ""}>
                          {item.icon}
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </AccordionContent>
            </AccordionItem>
          )}

          {adminGroup.length > 0 && (
            <AccordionItem value="admin">
              <AccordionTrigger className="px-4 py-2 text-left">Admin</AccordionTrigger>
              <AccordionContent className="px-2">
                <SidebarMenu>
                  {adminGroup.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild>
                        <Link to={item.to} className={location.pathname === item.to ? "bg-accent text-accent-foreground" : ""}>
                          {item.icon}
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        {generalGroup.length > 0 && (
          <SidebarGroup className="mt-auto">
            <SidebarGroupLabel>Geral</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {generalGroup.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild>
                      <Link to={item.to} className={location.pathname === item.to ? "bg-accent text-accent-foreground" : ""}>
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
};

export default SidebarNav;