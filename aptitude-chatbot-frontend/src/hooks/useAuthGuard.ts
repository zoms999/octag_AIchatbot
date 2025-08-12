import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../lib/stores/auth';
import { AuthUtils } from '../lib/auth/authUtils';
import { TokenManager } from '../lib/stores/auth';

export interface AuthGuardOptions {
  requireAuth?: boolean;
  requiredRoles?: string[];
  redirectTo?: string;
  onUnauthorized?: (reason: 'unauthenticated' | 'insufficient_role') => void;
  enableAutoRefresh?: boolean;
  checkInterval?: number; // in minutes
}

export interface AuthGuardState {
  isLoading: boolean;
  isAuthenticated: boolean;
  isAuthorized: boolean;
  user: any;
  hasValidToken: boolean;
  timeUntilExpiration: number | null;
  needsRefresh: boolean;
}

/**
 * Comprehensive auth guard hook with role-based access control
 */
export function useAuthGuard(options: AuthGuardOptions = {}): AuthGuardState {
  const {
    requireAuth = true,
    requiredRoles = [],
    redirectTo = '/login',
    onUnauthorized,
    enableAutoRefresh = true,
    checkInterval = 1, // Check every minute
  } = options;

  const router = useRouter();
  const pathname = usePathname();

  const {
    user,
    isAuthenticated,
    isLoading,
    isRefreshing,
    checkAuth,
    refreshToken,
    logout,
  } = useAuthStore();

  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [timeUntilExpiration, setTimeUntilExpiration] = useState<number | null>(
    null
  );
  const [needsRefresh, setNeedsRefresh] = useState(false);

  // Initialize auth check
  useEffect(() => {
    const initializeAuth = async () => {
      if (!isInitialized) {
        await checkAuth();
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [checkAuth, isInitialized]);

  // Check authorization based on roles
  const checkAuthorization = useCallback(() => {
    if (!requireAuth) {
      setIsAuthorized(true);
      return true;
    }

    if (!isAuthenticated) {
      setIsAuthorized(false);
      return false;
    }

    // Check role-based authorization
    if (requiredRoles.length > 0 && user) {
      const userRole = user.type;
      const hasRequiredRole = requiredRoles.includes(userRole);
      setIsAuthorized(hasRequiredRole);
      return hasRequiredRole;
    }

    setIsAuthorized(true);
    return true;
  }, [requireAuth, isAuthenticated, user, requiredRoles]);

  // Update authorization when dependencies change
  useEffect(() => {
    if (isInitialized && !isLoading && !isRefreshing) {
      const authorized = checkAuthorization();

      if (!authorized) {
        const reason = !isAuthenticated
          ? 'unauthenticated'
          : 'insufficient_role';

        if (onUnauthorized) {
          onUnauthorized(reason);
        } else if (reason === 'unauthenticated') {
          // Store current path for redirect after login
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('redirectAfterLogin', pathname);
          }
          router.push(redirectTo);
        } else {
          router.push('/unauthorized');
        }
      }
    }
  }, [
    isInitialized,
    isLoading,
    isRefreshing,
    checkAuthorization,
    onUnauthorized,
    pathname,
    router,
    redirectTo,
  ]);

  // Update token expiration info
  useEffect(() => {
    const updateTokenInfo = () => {
      const timeUntilExp = AuthUtils.getTimeUntilExpiration();
      const needsRefreshNow = AuthUtils.needsImmediateRefresh();

      setTimeUntilExpiration(timeUntilExp);
      setNeedsRefresh(needsRefreshNow);
    };

    if (isAuthenticated) {
      updateTokenInfo();

      // Update every minute
      const interval = setInterval(updateTokenInfo, 60000);
      return () => clearInterval(interval);
    } else {
      setTimeUntilExpiration(null);
      setNeedsRefresh(false);
    }
  }, [isAuthenticated]);

  // Auto refresh token when needed
  useEffect(() => {
    if (enableAutoRefresh && needsRefresh && isAuthenticated && !isRefreshing) {
      refreshToken().catch((error) => {
        console.error('Auto token refresh failed:', error);
        logout();
      });
    }
  }, [
    enableAutoRefresh,
    needsRefresh,
    isAuthenticated,
    isRefreshing,
    refreshToken,
    logout,
  ]);

  // Periodic auth check
  useEffect(() => {
    if (!isAuthenticated || checkInterval <= 0) return;

    const interval = setInterval(
      () => {
        if (AuthUtils.shouldCheckAuth(checkInterval)) {
          checkAuth();
          AuthUtils.setLastAuthCheck();
        }
      },
      checkInterval * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [isAuthenticated, checkInterval, checkAuth]);

  return {
    isLoading: !isInitialized || isLoading || isRefreshing,
    isAuthenticated,
    isAuthorized,
    user,
    hasValidToken: TokenManager.isTokenValid(),
    timeUntilExpiration,
    needsRefresh,
  };
}

/**
 * Hook for protecting routes that require authentication
 */
export function useRequireAuth(
  options?: Omit<AuthGuardOptions, 'requireAuth'>
) {
  return useAuthGuard({
    ...options,
    requireAuth: true,
  });
}

/**
 * Hook for role-based route protection
 */
export function useRequireRole(
  requiredRoles: string[],
  options?: Omit<AuthGuardOptions, 'requiredRoles' | 'requireAuth'>
) {
  return useAuthGuard({
    ...options,
    requireAuth: true,
    requiredRoles,
  });
}

/**
 * Hook for admin-only routes
 */
export function useRequireAdmin(
  options?: Omit<AuthGuardOptions, 'requiredRoles' | 'requireAuth'>
) {
  return useAuthGuard({
    ...options,
    requireAuth: true,
    requiredRoles: ['organization_admin'],
  });
}

/**
 * Hook for organization routes (admin or member)
 */
export function useRequireOrganization(
  options?: Omit<AuthGuardOptions, 'requiredRoles' | 'requireAuth'>
) {
  return useAuthGuard({
    ...options,
    requireAuth: true,
    requiredRoles: ['organization_admin', 'organization_member'],
  });
}
