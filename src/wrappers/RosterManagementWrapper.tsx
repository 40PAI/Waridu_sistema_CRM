import RosterManagement from "@/pages/RosterManagement";
import { useEvents } from "@/hooks/useEvents";
import { useEmployees } from "@/hooks/useEmployees";
import { useMaterials } from "@/hooks/useMaterials";
import { useMaterialRequests } from "@/hooks/useMaterialRequests";

export default function RosterManagementWrapper() {
  const { events, updateEventDetails, updateEvent } = useEvents();
  const { employees } = useEmployees();
  const { materials: invMaterials } = useMaterials();
  const { pendingRequests } = useMaterialRequests();
  
  return (
    <RosterManagement
      events={events || []}
      employees={employees}
      onUpdateEventDetails={updateEventDetails}
      onUpdateEvent={updateEvent}
      pendingRequests={pendingRequests}
      materials={invMaterials}
    />
  );
}
