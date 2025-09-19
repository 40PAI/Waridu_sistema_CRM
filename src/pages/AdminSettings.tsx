import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleManager } from "@/components/settings/RoleManager";
import CategoryManager from "@/components/settings/CategoryManager";
import ServicesManager from "@/components/settings/ServicesManager";
import LocationsManager from "@/components/settings/LocationsManager";
import GeneralSettings from "@/components/settings/GeneralSettings";
import { useRoles } from "@/hooks/useRoles";
import { useLocations } from "@/hooks/useLocations";
import type { Role, Location } from "@/types";

interface AdminSettingsProps {
  roles?: Role[];
  onAddRole?: (name: Role | string) => Promise<void> | void;
  onUpdateRole?: (roleId: string, newName: Role | string) => Promise<void> | void;
  onDeleteRole?: (roleId: string) => Promise<void> | void;
  locations?: Location[];
  onAddLocation?: (name: string) => Promise<void> | void;
  onUpdateLocation?: (id: string, name: string) => Promise<void> | void;
  onDeleteLocation?: (id: string) => Promise<void> | void;
}

/**
 * AdminSettings component now accepts optional props so it can be used both:
 *  - directly (no props) where it uses the internal hooks, or
 *  - by a parent (AppContent) that passes the data/handlers (fixes TS2322).
 *
 * The component will prefer props when provided, otherwise fall back to the hooks.
 */
const AdminSettings = (props: AdminSettingsProps) => {
  // fallback hooks
  const rolesHook = useRoles();
  const locationsHook = useLocations();

  const roles = props.roles ?? rolesHook.roles;
  const addRole = props.onAddRole ?? rolesHook.addRole;
  const updateRole = props.onUpdateRole ?? rolesHook.updateRole;
  const deleteRole = props.onDeleteRole ?? rolesHook.deleteRole;

  const locations = props.locations ?? locationsHook.locations;
  const addLocation = props.onAddLocation ?? locationsHook.addLocation;
  const updateLocation = props.onUpdateLocation ?? locationsHook.updateLocation;
  const deleteLocation = props.onDeleteLocation ?? locationsHook.deleteLocation;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações Administrativas</h1>
        <p className="text-sm text-muted-foreground">Gerencie roles, categorias, serviços, localizações e configurações gerais do sistema.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <RoleManager roles={roles} onAddRole={addRole} onUpdateRole={updateRole} onDeleteRole={deleteRole} />
          <CategoryManager />
          <ServicesManager />
        </div>

        <div className="space-y-6">
          <LocationsManager />
          <GeneralSettings />
          <Card>
            <CardHeader>
              <CardTitle>Informações Avançadas</CardTitle>
              <CardDescription>Recursos adicionais e logs administrativos podem aparecer aqui.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Use os módulos ao lado para gerenciar itens do sistema. Para alterações que envolvam banco de dados ou políticas de RLS, utilize o console do Supabase.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;