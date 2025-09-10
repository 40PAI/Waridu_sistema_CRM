export type Role = 'Admin' | 'Coordenador' | 'Gestor de Material' | 'Financeiro' | 'Técnico';

export const PAGE_PERMISSIONS: Record<Role, string[]> = {
  Admin: [
    '/',
    '/calendar',
    '/create-event',
    '/roster-management',
    '/employees',
    '/roles',
    '/materials',
    '/material-requests',
    '/finance-dashboard',
    '/admin-settings',
    '/invite-member',
    '/roles/:roleId',
    '/debug'
  ],
  Coordenador: [
    '/',
    '/calendar',
    '/create-event',
    '/roster-management',
    '/employees',
    '/roles',
    '/materials',
    '/finance-dashboard',
    '/invite-member',
    '/roles/:roleId'
  ],
  'Gestor de Material': [
    '/',
    '/calendar',
    '/roster-management',
    '/materials',
    '/material-requests',
  ],
  Financeiro: [
    '/',
    '/calendar',
    '/roster-management',
    '/employees',
    '/finance-dashboard',
  ],
  Técnico: [
    '/technician/dashboard',
    '/technician/calendar',
    '/technician/events',
    '/technician/tasks',
    '/technician/profile',
    '/technician/notifications'
  ],
};

export const ACTION_PERMISSIONS: Record<string, Role[]> = {
  'materials:write': ['Admin', 'Gestor de Material'],
  'members:invite': ['Admin', 'Coordenador'],
  'employees:write': ['Admin', 'Coordenador'],
  'roster:manage': ['Admin', 'Coordenador'],
};

export const hasPermission = (role: Role, path: string): boolean => {
  if (!role) return false;
  
  const allowedRoutes = PAGE_PERMISSIONS[role];
  if (!allowedRoutes) return false;

  if (allowedRoutes.includes(path)) {
    return true;
  }

  const pathParts = path.split('/').filter(p => p);
  
  for (const allowedRoute of allowedRoutes) {
    if (allowedRoute.includes(':')) {
      const allowedParts = allowedRoute.split('/').filter(p => p);
      if (pathParts.length === allowedParts.length) {
        const match = allowedParts.every((part, index) => {
          return part.startsWith(':') || part === pathParts[index];
        });
        if (match) return true;
      }
    }
  }

  return false;
};

export const hasActionPermission = (role: Role, action: string): boolean => {
  if (!role) return false;
  const allowedRoles = ACTION_PERMISSIONS[action];
  return !!allowedRoles?.includes(role);
};