import { Menu, LogOut } from "lucide-react";
import NotificationsBell from "@/components/notifications/NotificationsBell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      navigate("/login");
    }
  };

  return (
    <header className="flex h-14 items-center gap-2 border-b bg-muted/40 px-3 sm:gap-3 sm:px-4 md:h-[60px] md:gap-4 lg:px-6">
      {/* Mobile Menu Button */}
      <Button 
        variant="outline" 
        size="icon" 
        className="md:hidden"
        onClick={onMenuClick}
        title="Menu"
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Abrir menu</span>
      </Button>

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
        <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
        <span className="sr-only">Sair</span>
      </Button>
    </header>
  );
};

export default Header;