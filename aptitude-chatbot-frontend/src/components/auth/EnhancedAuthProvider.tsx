'use client';

import { useEffect, ReactNode, useState } from 'react';
import { useAuthStore } from '../../lib/stores/auth';
import { useTokenRefresh } from '../../hooks/useTokenRefresh';
import { AuthUtils } from '../../lib/auth/authUtils';

interface EnhancedAuthProviderProps {
  children: ReactNode;
  fallback?: ReactNode;
  enableAutoRefresh?: boolean;
  enableVisibilityRefresh?: boolean;
  enableStorageSync?: boolean;
}

/**
 * Enhanced auth provider with comprehensive token management and sync
 */
export function EnhancedAuthProvider({
  children,
  fallback = (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
  enableAutoRefresh = true,
  enableVisibilityRefresh = true,
  enableStorageSync = true,
}: EnhancedAuthProviderProps) {
  const {
    isAuthenticated,
    isLoading,
    checkAuth,
    logout,
    startTokenRefreshTimer,
    stopTokenRefreshTimer,
  } = useAuthStore();

  const [isInitialized, setIsInitialized] = useState(false);
  const { isRefreshing } = useTokenRefresh();

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [checkAuth]);

  // Handle token refresh timer
  useEffect(() => {
    if (enableAutoRefresh && isAuthenticated && isInitialized) {
      startTokenRefreshTimer();
    } else {
      stopTokenRefreshTimer();
    }

    return () => {
      stopTokenRefreshTimer();
    };
  }, [
    enableAutoRefresh,
    isAuthenticated,
    isInitialized,
    startTokenRefreshTimer,
    stopTokenRefreshTimer,
  ]);

  // Handle page visibility changes
  useEffect(() => {
    if (!enableVisibilityRefresh) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        // Check if we need to refresh auth state when page becomes visible
        if (AuthUtils.shouldCheckAuth(5)) {
          // Check every 5 minutes
          checkAuth();
          AuthUtils.setLastAuthCheck();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enableVisibilityRefresh, isAuthenticated, checkAuth]);

  // Handle storage events for cross-tab synchronization
  useEffect(() => {
    if (!enableStorageSync) return;

    const handleStorageChange = (event: StorageEvent) => {
      // Handle logout in other tabs
      if (event.key === 'refresh_token' && event.newValue === null) {
        if (isAuthenticated) {
          logout();
        }
      }

      // Handle login in other tabs
      if (event.key === 'refresh_token' && event.newValue && !isAuthenticated) {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [enableStorageSync, isAuthenticated, logout, checkAuth]);

  // Handle beforeunload to clear sensitive data
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clear access token from session storage on page unload for security
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('access_token');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Show loading state while initializing or refreshing
  if (!isInitialized || (isLoading && !isAuthenticated) || isRefreshing) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
