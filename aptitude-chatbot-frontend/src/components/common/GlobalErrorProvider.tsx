'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { GlobalErrorHandler, UserFriendlyError } from '@/lib/errors/globalErrorHandler';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Wifi, RefreshCw } from 'lucide-react';

interface GlobalErrorContextType {
  handleError: (error: unknown, options?: {
    showToast?: boolean;
    retryable?: boolean;
    onRetry?: () => void;
  }) => UserFriendlyError;
}

const GlobalErrorContext = createContext<GlobalErrorContextType | null>(null);

export function GlobalErrorProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();

  useEffect(() => {
    // Set up the toast function in the global error handler
    GlobalErrorHandler.setToastFunction((error: UserFriendlyError) => {
      const getIcon = () => {
        switch (error.severity) {
          case 'critical':
            return <AlertTriangle className="h-4 w-4" />;
          case 'error':
            return <AlertTriangle className="h-4 w-4" />;
          case 'warning':
            return <Wifi className="h-4 w-4" />;
          default:
            return null;
        }
      };

      const getVariant = (): 'default' | 'destructive' => {
        return error.severity === 'critical' || error.severity === 'error' 
          ? 'destructive' 
          : 'default';
      };

      toast({
        variant: getVariant(),
        title: (
          <div className="flex items-center gap-2">
            {getIcon()}
            {error.title}
          </div>
        ),
        description: error.message,
        action: error.action ? (
          <Button
            variant="outline"
            size="sm"
            onClick={error.action.handler}
            className="ml-auto"
          >
            {error.action.label === 'Retry' && <RefreshCw className="h-3 w-3 mr-1" />}
            {error.action.label}
          </Button>
        ) : undefined,
        duration: error.severity === 'critical' ? 0 : 5000, // Critical errors don't auto-dismiss
      });
    });
  }, [toast]);

  const handleError = (
    error: unknown, 
    options?: {
      showToast?: boolean;
      retryable?: boolean;
      onRetry?: () => void;
    }
  ) => {
    return GlobalErrorHandler.handleError(error, options);
  };

  return (
    <GlobalErrorContext.Provider value={{ handleError }}>
      {children}
    </GlobalErrorContext.Provider>
  );
}

export function useGlobalError() {
  const context = useContext(GlobalErrorContext);
  if (!context) {
    throw new Error('useGlobalError must be used within a GlobalErrorProvider');
  }
  return context;
}

// Convenience hooks for common error scenarios
export function useErrorHandler() {
  const { handleError } = useGlobalError();

  return {
    handleError,
    handleAuthError: () => GlobalErrorHandler.handleAuthenticationError(),
    handleNetworkError: (retryFn?: () => void) => GlobalErrorHandler.handleNetworkError(retryFn),
    handleValidationError: (field?: string) => GlobalErrorHandler.handleValidationError(field),
  };
}