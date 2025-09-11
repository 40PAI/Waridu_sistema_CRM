export type Role = 'Admin' | 'Coordenador' | 'Gestor de Material' | 'Financeiro' | 'Técnico';

export const PAGE_PERMISSIONS: Record<Role, string[]> = {
  Admin: [
    '/', '/calendar', '/create-event', '/roster-management',
    '/employees', '/roles', '/materials', '/material-requests',
    '/finance-dashboard', '/finance-profitability', '/finance-calendar', '/finance-costs',
    '/admin-settings', '/invite-member', '/debug', '/roles/:roleId'
  ],
  Coordenador: [
    '/', '/calendar', '/create-event', '/roster-management',
    '/employees', '/roles', '/materials', '/finance-dashboard'
  ],
  'Gestor de Material': [
    '/', '/calendar', '/roster-management', '/materials', '/material-requests'
  ],
  Financeiro: [
    '/finance-dashboard', '/finance-profitability', '/finance-calendar', '/finance-costs',
    '/finance/profile' // Adiciona a nova página de perfil
  ],
  Técnico: [
    '/technician/dashboard', '/technician/calendar', '/technician/events',
    '/technician/events/:eventId', '/technician/tasks',
    '/technician/profile', '/technician/notifications'
  ],
};

export const ACTION_PERMISSIONS: Record<Role, string[]> = {
  Admin: ['categories:manage','materials:write','employees:write','employees:assign_category','members:invite'],
  Coordenador: ['members:invite','employees:write'],
  'Gestor de Material': ['materials:write'],
  Financeiro: ['categories:manage'],
  Técnico: [],
};

export function hasPermission(role: Role, path: string): boolean {
  const allowed = PAGE_PERMISSIONS[role] || [];
  return allowed.some(pattern => {
    const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '[^/]+') + '$');
    return regex.test(path);
  });
}

export function hasActionPermission(role: Role, action: string): boolean {
  return (ACTION_PERMISSIONS[role] || []).includes(action);
}