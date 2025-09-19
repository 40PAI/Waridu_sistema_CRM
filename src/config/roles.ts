export type Role = 'Admin' | 'Coordenador' | 'Gestor de Material' | 'Financeiro' | 'Técnico' | 'Comercial';

export const PAGE_PERMISSIONS: Record<Role, string[]> = {
  Admin: [
    '/', '/calendar', '/create-event', '/roster-management',
    '/employees', '/roles', '/materials', '/material-requests',
    '/admin/tasks', '/admin/create-task',
    '/finance/dashboard', '/finance-profitability', '/finance-calendar', '/finance-costs', '/finance/reports',
    '/admin-settings', '/invite-member', '/admin/members', '/admin/users', '/debug', '/roles/:roleId',
    '/notifications', '/material-manager/profile', '/admin/profile',
    // CRM pages
    '/crm/dashboard', '/crm/pipeline', '/crm/clients', '/crm/reports',
    // Services management
    '/admin/services',
    // Novo: Configuração do Pipeline
    '/admin/pipeline-config'
  ],
  Coordenador: [
    '/', '/calendar', '/create-event', '/roster-management',
    '/employees', '/roles', '/materials', '/admin/tasks', '/admin/create-task',
    '/invite-member', '/admin/members', '/admin/users',
    '/notifications',
    '/admin/services'
  ],
  'Gestor de Material': [
    '/', '/calendar', '/roster-management', '/materials', '/material-requests',
    '/material-manager/profile', '/notifications'
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
  Comercial: [
    '/crm/dashboard', '/crm/pipeline', '/crm/clients', '/crm/reports', '/notifications',
    '/commercial/services'
  ],
};

export const ACTION_PERMISSIONS: Record<Role, string[]> = {
  Admin: [
    'members:invite', 'members:promote', 'members:ban', 'members:delete',
    'materials:write', 'employees:write', 'employees:assign_category', 'categories:manage',
    'tasks:create',
    'services:manage', 'services:create', 'services:delete'
  ],
  Coordenador: [
    'members:invite', 'members:promote', 'employees:write',
    'tasks:create',
    'services:manage'
  ],
  'Gestor de Material': [
    'materials:write'
  ],
  Financeiro: [
    'categories:manage'
  ],
  Técnico: [],
  Comercial: [
    'projects:write', 'clients:write'
  ],
};

export function hasPermission(role: Role | undefined, path: string): boolean {
  if (!role) return false;
  const permissions = PAGE_PERMISSIONS[role] || [];
  return permissions.some(p => {
    if (p.endsWith('/:roleId')) return path === '/roles' || path.startsWith('/roles/');
    if (p.endsWith('/:eventId')) return path.startsWith('/technician/events/');
    return path === p || (p.endsWith('*') && path.startsWith(p.slice(0, -1)));
  });
}

export function hasActionPermission(role: Role | undefined, action: string): boolean {
  if (!role) return false;
  const permissions = ACTION_PERMISSIONS[role] || [];
  return permissions.includes(action);
}