import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleManager } from "@/components/admin/RoleManager";
import { LocationManager } from "@/components/admin/LocationManager";
import { GeneralSettings, ApiSettings } from "@/components/admin/GeneralSettings";
import type { Role } from "@/types";
import * as React from "react";

interface Location {
  id: string;
  name: string;
}

interface AdminSettingsProps {
  roles: Role[];
  onAddRole: (name: string) => void;
  onUpdateRole: (id: string, name: string) => void;
  onDeleteRole: (id: string) => void;

  locations: Location[];
  onAddLocation: (name: string) => void;
  onUpdateLocation: (id: string, name: string) => void;
  onDeleteLocation: (id: string) => void;
}

const AdminSettings = ({ roles, onAddRole, onUpdateRole, onDeleteRole, locations, onAddLocation, onUpdateLocation, onDeleteLocation }: AdminSettingsProps) => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
      <RoleManager
        roles={roles}
        onAddRole={onAddRole}
        onUpdateRole={onUpdateRole}
        onDeleteRole={onDeleteRole}
      />

      <LocationManager
        locations={locations}
        onAddLocation={onAddLocation}
        onUpdateLocation={onUpdateLocation}
        onDeleteLocation={onDeleteLocation}
      />

      <GeneralSettings />

      <ApiSettings />
    </div>
  );
};

export default AdminSettings;