import React from 'react';
import MaterialRequests from "@/pages/MaterialRequests";
import { useMaterialRequests } from "@/hooks/useMaterialRequests";
import { useEvents } from "@/hooks/useEvents";
import { useMaterials } from "@/hooks/useMaterials";

export default function MaterialRequestsWrapper() {
  const { materialRequests, approveMaterialRequest, rejectMaterialRequest, createMaterialRequest } = useMaterialRequests();
  const { events } = useEvents();
  const { materials } = useMaterials();
  
  const materialNameMap = React.useMemo(
    () => materials.reduce<Record<string, string>>((acc, m) => { acc[m.id] = m.name; return acc; }, {}),
    [materials]
  );
  
  return (
    <MaterialRequests
      requests={materialRequests}
      events={events || []}
      materialNameMap={materialNameMap}
      onApproveRequest={approveMaterialRequest}
      onRejectRequest={rejectMaterialRequest}
    />
  );
}
