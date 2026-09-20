import React, { useMemo } from 'react';
import { UserProfile, UserRole } from '../types';
import { StorageService } from '../services/storage';

export type PermissionModule = 'clients' | 'invoices' | 'expenses' | 'spendings' | 'reports' | 'events' | 'drive' | string;
export type PermissionAction = 'view' | 'edit' | 'create' | 'delete' | 'export' | string;

export interface UsePermissionReturn {
  hasPermission: boolean;
  role: UserRole | string;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  user: UserProfile | null;
  checkPermission: (module: PermissionModule, action: PermissionAction) => boolean;
  canView: (module: PermissionModule) => boolean;
  canEdit: (module: PermissionModule) => boolean;
  canCreate: (module: PermissionModule) => boolean;
  canDelete: (module: PermissionModule) => boolean;
  canExport: (module: PermissionModule) => boolean;
}

/**
 * Global Permission Hook:
 * Inspects current user profile role & JSON permissions matrix.
 * Super Admins automatically bypass all restrictions.
 */
export function usePermission(
  module?: PermissionModule,
  action?: PermissionAction,
  userOverride?: UserProfile | null
): UsePermissionReturn {
  // Read current active user
  const user = userOverride !== undefined ? userOverride : StorageService.getUser();
  const rawRole = (user?.role as string) || 'super_admin';
  const role: UserRole | string = rawRole.toLowerCase();

  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'admin' || isSuperAdmin;
  const isStaff = role === 'staff';

  const permissions = user?.permissions;

  const checkPermission = (mod: PermissionModule, act: PermissionAction): boolean => {
    // Super Admin has unrestricted access to all modules and actions
    if (isSuperAdmin) {
      return true;
    }

    // Default when no granular permissions JSON exists:
    if (!permissions) {
      if (role === 'admin') return true;
      // Staff default: read-only access
      return act === 'view';
    }

    // Module normalization (e.g. 'spendings' aligns with 'expenses')
    const normalizedMod = mod === 'spendings' ? 'expenses' : mod;
    const modConfig = permissions[normalizedMod] || permissions[mod];

    if (!modConfig) {
      // If module isn't explicitly defined in matrix:
      if (role === 'admin') return true;
      return false;
    }

    // Direct key match
    if (typeof modConfig[act] === 'boolean') {
      return modConfig[act];
    }

    // Semantic action fallbacks
    if (act === 'create' || act === 'delete') {
      return Boolean(modConfig.edit);
    }

    if (act === 'export') {
      return Boolean(modConfig.export ?? modConfig.view);
    }

    return false;
  };

  const hasPermission = useMemo(() => {
    if (!module || !action) return true;
    return checkPermission(module, action);
  }, [module, action, role, permissions]);

  return {
    hasPermission,
    role,
    isSuperAdmin,
    isAdmin,
    isStaff,
    user,
    checkPermission,
    canView: (mod: PermissionModule) => checkPermission(mod, 'view'),
    canEdit: (mod: PermissionModule) => checkPermission(mod, 'edit'),
    canCreate: (mod: PermissionModule) => checkPermission(mod, 'create'),
    canDelete: (mod: PermissionModule) => checkPermission(mod, 'delete'),
    canExport: (mod: PermissionModule) => checkPermission(mod, 'export'),
  };
}

/**
 * Component wrapper helper for conditional rendering based on permissions
 */
export function RequirePermission({
  module,
  action,
  children,
  fallback = null,
  userOverride
}: {
  module: PermissionModule;
  action: PermissionAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  userOverride?: UserProfile | null;
}) {
  const { hasPermission } = usePermission(module, action, userOverride);
  if (!hasPermission) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
