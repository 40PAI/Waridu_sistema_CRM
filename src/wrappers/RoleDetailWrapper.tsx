import RoleDetail from "@/pages/RoleDetail";
import { useRoles } from "@/hooks/useRoles";
import { useEmployees } from "@/hooks/useEmployees";
import { useEvents } from "@/hooks/useEvents";

export default function RoleDetailWrapper() {
  const { roles } = useRoles();
  const { employees } = useEmployees();
  const { events } = useEvents();
  return <RoleDetail roles={roles || []} employees={employees} events={events || []} />;
}
