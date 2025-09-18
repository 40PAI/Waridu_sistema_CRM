import { Menu, Users, FileText, Settings, Home, Users2, Package, CalendarDays, Bell, KanbanSquare, CheckCircle, LayoutGrid, Calendar } from "lucide-react";
import NotificationsBell from "@/components/notifications/NotificationsBell";

const Header = () => {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      <div className="w-full flex-1">
        {/* Header content can be added here */}
      </div>
      <NotificationsBell />
    </header>
  );
};

export default Header;