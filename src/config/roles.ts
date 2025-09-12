export type Role = 'Admin' | 'Coordenador' | 'Gestor de Material' | 'Financeiro' | 'Técnico';

const ALL_ROLES: Role[] = ['Admin', 'Coordenador', 'Gestor de Material', 'Financeiro', 'Técnico'];

function isRole(value: any): value is Role {
  return ALL_ROLES.includes(value as Role);
}

function normalizeRole(role: string | Role | undefined): Role | undefined {
  if (!role) return undefined;
  return isRole(role) ? role : undefined;
}

export const PAGE_PERMISSIONS: Record<Role, string[]> = {
  Admin: [
    '/', '/calendar', '/create-event', '/roster-management',
    '/employees', '/roles', '/materials', '/material-requests',
    '/finance/dashboard', '/finance-profitability', '/finance-calendar', '/finance-costs', '/finance/reports',
    '/admin-settings', '/invite-member', '/admin/members', '/admin/users', '/debug', '/roles/:roleId',
    '/notifications'
  ],
  Coordenador: [
    '/', '/calendar', '/create-event', '/roster-management',
    '/employees', '/roles', '/materials', '/invite-member', '/admin/members', '/admin/users',
    '/notifications'
  ],
  'Gestor de Material': [
    '/', '/calendar', '/roster-management', '/materials', '/material-requests',
    '/notifications'
  ],
  Financeiro: [
    '/finance/dashboard', '/finance-profitability', '/finance-calendar', '/finance-costs', '/finance/reports',
    '/finance/profile', '/notifications'
  ],
  Técnico: [
    '/technician/dashboard', '/technician/calendar', '/technician/events',
    '/technician/events/:eventId', '/technician/tasks',
    '/technician/tasks-kanban', '/technician/profile', '/technician/notifications', '/notifications'
  ],
};

export const ACTION_PERMISSIONS: Record<Role, string[]> = {
  Admin: [
    'members:invite', 'members:promote', 'members:ban', 'members:delete',
    'materials:write', 'employees:write', 'employees:assign_category', 'categories:manage',
    'tasks:create'
  ],
  Coordenador: [
    'members:invite', 'members:promote', 'employees:write',
    'tasks:create'
  ],
  'Gestor de Material': [
    'materials:write'
  ],
  Financeiro: [
    'categories:manage'
  ],
  Técnico: []
};

export function hasPermission(roleInput: string | Role | undefined, path: string): boolean {
  const role = normalizeRole(roleInput);
  if (!role) return false;
  const permissions = PAGE_PERMISSIONS[role] || [];
  return permissions.some(p => {
    if (p.endsWith('/:roleId')) return path === '/roles' || path.startsWith('/roles/');
    return path === p || (p.endsWith('*') && path.startsWith(p.slice(0, -1)));
  });
}

export function hasActionPermission(roleInput: string | Role | undefined, action: string): boolean {
  const role = normalizeRole(roleInput);
  if (!role) return false;
  const permissions = ACTION_PERMISSIONS[role] || [];
  return permissions.includes(action);
}