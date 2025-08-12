/**
 * Authentication configuration
 */
export const AUTH_CONFIG = {
  // Token settings
  TOKEN: {
    ACCESS_TOKEN_KEY: 'access_token',
    REFRESH_TOKEN_KEY: 'refresh_token',
    TOKEN_TIMESTAMP_KEY: 'token_timestamp',
    REFRESH_THRESHOLD_MINUTES: 5, // Refresh token 5 minutes before expiration
    MAX_RETRY_ATTEMPTS: 3,
    RETRY_DELAY_MS: 1000,
  },

  // Storage settings
  STORAGE: {
    USE_SESSION_STORAGE_FOR_ACCESS_TOKEN: true, // More secure
    USE_LOCAL_STORAGE_FOR_REFRESH_TOKEN: true, // Persistent across sessions
    CLEAR_ON_BROWSER_CLOSE: true,
  },

  // Route settings
  ROUTES: {
    LOGIN: '/login',
    DASHBOARD: '/dashboard',
    UNAUTHORIZED: '/unauthorized',
    PROTECTED_ROUTES: ['/dashboard', '/chat', '/tests', '/profile'],
    PUBLIC_ROUTES: ['/login', '/register', '/forgot-password', '/'],
    AUTH_ROUTES: ['/login', '/register', '/forgot-password'],
  },

  // Auto-refresh settings
  AUTO_REFRESH: {
    ENABLED: true,
    CHECK_INTERVAL_MINUTES: 1, // Check token status every minute
    BACKGROUND_REFRESH: true, // Refresh in background when needed
    REFRESH_ON_FOCUS: true, // Refresh when window gains focus
    REFRESH_ON_VISIBILITY_CHANGE: true,
  },

  // Session management
  SESSION: {
    REDIRECT_AFTER_LOGIN_KEY: 'redirectAfterLogin',
    LAST_AUTH_CHECK_KEY: 'lastAuthCheck',
    AUTH_CHECK_INTERVAL_MINUTES: 5, // Check auth status every 5 minutes
    CROSS_TAB_SYNC: true, // Sync auth state across tabs
  },

  // Security settings
  SECURITY: {
    CLEAR_TOKENS_ON_UNLOAD: true, // Clear access token on page unload
    VALIDATE_TOKEN_ON_FOCUS: true, // Validate token when window gains focus
    LOGOUT_ON_TOKEN_EXPIRED: true,
    LOGOUT_ON_REFRESH_FAILED: true,
  },

  // API settings
  API: {
    BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
    ENDPOINTS: {
      LOGIN: '/auth/login',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh',
      ME: '/auth/me',
      VALIDATE: '/auth/validate',
    },
    TIMEOUT_MS: 10000,
    RETRY_ATTEMPTS: 3,
  },

  // User roles
  ROLES: {
    PERSONAL: 'personal',
    ORGANIZATION_ADMIN: 'organization_admin',
    ORGANIZATION_MEMBER: 'organization_member',
  },

  // Role permissions
  PERMISSIONS: {
    ADMIN_ROLES: ['organization_admin'],
    ORGANIZATION_ROLES: ['organization_admin', 'organization_member'],
    ALL_ROLES: ['personal', 'organization_admin', 'organization_member'],
  },

  // Error messages
  ERRORS: {
    LOGIN_FAILED: 'Login failed. Please check your credentials.',
    TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
    REFRESH_FAILED: 'Unable to refresh your session. Please log in again.',
    UNAUTHORIZED: 'You are not authorized to access this resource.',
    NETWORK_ERROR: 'Network error. Please check your connection.',
    INVALID_CREDENTIALS: 'Invalid username or password.',
    ACCOUNT_LOCKED: 'Your account has been locked. Please contact support.',
    INSUFFICIENT_PERMISSIONS:
      'You do not have permission to perform this action.',
  },

  // Success messages
  SUCCESS: {
    LOGIN_SUCCESS: 'Successfully logged in.',
    LOGOUT_SUCCESS: 'Successfully logged out.',
    TOKEN_REFRESHED: 'Session refreshed successfully.',
  },
} as const;

/**
 * Get auth configuration value by path
 */
export function getAuthConfig<T>(path: string): T {
  const keys = path.split('.');
  let value: any = AUTH_CONFIG;

  for (const key of keys) {
    value = value?.[key];
  }

  return value as T;
}

/**
 * Check if route is protected
 */
export function isProtectedRoute(pathname: string): boolean {
  return AUTH_CONFIG.ROUTES.PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
}

/**
 * Check if route is public
 */
export function isPublicRoute(pathname: string): boolean {
  return AUTH_CONFIG.ROUTES.PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );
}

/**
 * Check if route is auth-related
 */
export function isAuthRoute(pathname: string): boolean {
  return AUTH_CONFIG.ROUTES.AUTH_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
}

/**
 * Get role-based permissions
 */
export function getRolePermissions(role: string): string[] {
  const { PERMISSIONS } = AUTH_CONFIG;

  if (PERMISSIONS.ADMIN_ROLES.includes(role as any)) {
    return ['admin', 'organization', 'user'];
  }

  if (PERMISSIONS.ORGANIZATION_ROLES.includes(role as any)) {
    return ['organization', 'user'];
  }

  return ['user'];
}

/**
 * Check if user has required role
 */
export function hasRequiredRole(
  userRole: string,
  requiredRoles: string[]
): boolean {
  if (requiredRoles.length === 0) return true;
  return requiredRoles.includes(userRole);
}

/**
 * Check if user has permission
 */
export function hasPermission(userRole: string, permission: string): boolean {
  const permissions = getRolePermissions(userRole);
  return permissions.includes(permission);
}
