import Roles from "@/pages/Roles";
import { useRoles } from "@/hooks/useRoles";
import { useEmployees } from "@/hooks/useEmployees";
import { useEvents } from "@/hooks/useEvents";

export default function RolesWrapper() {
  const { roles } = useRoles();
  const { employees } = useEmployees();
  const { events } = useEvents();
  return <Roles roles={roles || []} employees={employees} events={events || []} />;
}
