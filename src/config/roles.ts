export type Role = 'Admin' | 'Coordenador' | 'Gestor de Material' | 'Financeiro' | 'Técnico';

export const PERMISSIONS: Record<Role, string[]> = {
  Admin: [
    '/',
    '/calendar',
    '/create-event',
    '/roster-management',
    '/employees',
    '/roles',
    '/materials',
    '/finance-dashboard',
    '/admin-settings',
    '/invite-member',
    '/roles/:roleId'
  ],
  Coordenador: [
    '/',
    '/calendar',
    '/create-event',
    '/roster-management',
    '/employees',
    '/roles',
    '/materials',
    '/finance-dashboard', // Adicionado conforme solicitado
    '/invite-member',
    '/roles/:roleId'
  ],
  'Gestor de Material': [
    '/',
    '/calendar',
    '/roster-management',
    '/materials',
  ],
  Financeiro: [
    '/',
    '/calendar',
    '/roster-management',
    '/employees',
    '/finance-dashboard',
  ],
  Técnico: [
    '/calendar',
    '/roster-management',
    '/materials',
  ],
};

export const hasPermission = (role: Role, path: string): boolean => {
  if (!role) return false;
  
  const allowedRoutes = PERMISSIONS[role];
  if (!allowedRoutes) return false;

  // Verifica por correspondência exata primeiro
  if (allowedRoutes.includes(path)) {
    return true;
  }

  // Verifica por rotas dinâmicas (ex: /roles/123 corresponde a /roles/:roleId)
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