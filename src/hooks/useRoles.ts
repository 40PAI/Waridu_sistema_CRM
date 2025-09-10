import { useState } from "react";
import { Role } from "@/types";
import { Role as ConfigRole } from "@/config/roles";

export const useRoles = () => {
  const [roles, setRoles] = useState<Role[]>([
    { id: 'role-1', name: 'Admin' },
    { id: 'role-2', name: 'Técnico' },
    { id: 'role-3', name: 'Coordenador' },
    { id: 'role-4', name: 'Gestor de Material' },
    { id: 'role-5', name: 'Financeiro' },
  ]);

  const addRole = (roleName: ConfigRole) => {
    const newRole: Role = {
      id: `role-${Date.now()}`,
      name: roleName,
    };
    setRoles(prev => [...prev, newRole]);
  };

  const updateRole = (roleId: string, newName: ConfigRole) => {
    setRoles(prev => prev.map(r => r.id === roleId ? { ...r, name: newName } : r));
  };

  const deleteRole = (roleId: string) => {
    setRoles(prev => prev.filter(r => r.id !== roleId));
  };

  return {
    roles,
    addRole,
    updateRole,
    deleteRole
  };
};