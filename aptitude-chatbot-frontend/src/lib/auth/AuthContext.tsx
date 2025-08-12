'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAuthStore } from '../stores/auth';
import { AuthContextType } from '../../types';

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthContextProviderProps {
  children: ReactNode;
}

/**
 * Auth context provider that wraps the Zustand store
 * Provides React Context API access to auth state and actions
 */
export function AuthContextProvider({ children }: AuthContextProviderProps) {
  const authStore = useAuthStore();

  const contextValue: AuthContextType = {
    user: authStore.user,
    tokens: authStore.tokens,
    isAuthenticated: authStore.isAuthenticated,
    isLoading: authStore.isLoading,
    error: authStore.error,
    isRefreshing: authStore.isRefreshing,
    login: authStore.login,
    logout: authStore.logout,
    refreshToken: authStore.refreshToken,
    checkAuth: authStore.checkAuth,
    clearError: authStore.clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

/**
 * Hook to use auth context
 * Provides access to auth state and actions via React Context
 */
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuthContext must be used within an AuthContextProvider'
    );
  }

  return context;
}

/**
 * Hook to get current user from context
 */
export function useCurrentUser() {
  const { user, isAuthenticated, isLoading } = useAuthContext();

  return {
    user,
    isAuthenticated,
    isLoading,
    isPersonalUser: user?.type === 'personal',
    isOrganizationUser:
      user?.type === 'organization_admin' ||
      user?.type === 'organization_member',
    isOrganizationAdmin: user?.type === 'organization_admin',
    isOrganizationMember: user?.type === 'organization_member',
  };
}

/**
 * Hook to get auth actions from context
 */
export function useAuthActions() {
  const { login, logout, refreshToken, checkAuth, clearError } =
    useAuthContext();

  return {
    login,
    logout,
    refreshToken,
    checkAuth,
    clearError,
  };
}
