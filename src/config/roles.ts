export type Role = 'Admin' | 'Coordenador' | 'Gestor de Material' | 'Financeiro' | 'Técnico';

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
    '/technician/profile', '/technician/notifications', '/notifications'
  ],
};