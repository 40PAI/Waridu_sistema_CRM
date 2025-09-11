import type { Role as ConfigRole } from "@/config/roles";

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
    '/finance-profitability',
    '/finance-calendar',
    '/finance-costs',
    '/admin-settings',
    '/invite-member',
    '/roles/:roleId',
    '/debug'
  ],
  Coordenador: [
    '/', '/calendar', '/create-event', '/roster-management',
    '/employees', '/roles', '/materials', '/finance-dashboard'
  ],
  'Gestor de Material': [
    '/', '/calendar', '/roster-management', '/materials', '/material-requests'
  ],
  Financeiro: [
    '/finance-dashboard',
    '/finance-profitability',
    '/finance-calendar',
    '/finance-costs'
  ],
  Técnico: [
    '/technician/dashboard',
    '/technician/calendar',
    '/technician/events',
    '/technician/events/:eventId',
    '/technician/tasks',
    '/technician/profile',
    '/technician/notifications'
  ],
};

// rest unchanged...