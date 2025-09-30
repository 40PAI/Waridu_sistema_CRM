import { Menu, Users, FileText, Settings, Home, Users2, Package, CalendarDays, Bell, KanbanSquare, CheckCircle, LayoutGrid, Calendar, LogOut } from "lucide-react";
import NotificationsBell from "@/components/notifications/NotificationsBell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      <div className="w-full flex-1">
        {/* Header content can be added here */}
      </div>
      <NotificationsBell />
      <Button 
        variant="outline" 
        size="icon" 
        onClick={handleLogout}
        title="Sair"
      >
        <LogOut className="h-5 w-5" />
        <span className="sr-only">Sair</span>
      </Button>
    </header>
  );
};

export default Header;