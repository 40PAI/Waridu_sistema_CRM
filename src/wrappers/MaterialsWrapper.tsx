import React from 'react';
import Materials from "@/pages/Materials";
import { useMaterials } from "@/hooks/useMaterials";
import { useLocations } from "@/hooks/useLocations";
import { useMaterialRequests } from "@/hooks/useMaterialRequests";

export default function MaterialsWrapper() {
  const { materials, addInitialStock, saveMaterial, transferMaterial, deleteMaterial } = useMaterials();
  const { locations } = useLocations();
  const { pendingRequests } = useMaterialRequests();
  
  return (
    <Materials
      materials={materials}
      locations={locations}
      onSaveMaterial={saveMaterial}
      onAddInitialStock={addInitialStock}
      onTransferMaterial={transferMaterial}
      onDeleteMaterial={deleteMaterial}
      history={[]}
      pendingRequests={pendingRequests}
    />
  );
}
