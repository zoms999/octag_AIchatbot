import { ApiError, NetworkError, AuthError, ValidationError } from '@/types/api';
import { ErrorLogger } from './errorLogger';
import { NetworkMonitor } from './networkMonitor';

export interface ErrorDisplayOptions {
  showToast?: boolean;
  toastDuration?: number;
  logError?: boolean;
  retryable?: boolean;
  onRetry?: () => void;
}

export interface UserFriendlyError {
  title: string;
  message: string;
  action?: {
    label: string;
    handler: () => void;
  };
  severity: 'info' | 'warning' | 'error' | 'critical';
}

class GlobalErrorHandlerService {
  private toastFunction: ((error: UserFriendlyError) => void) | null = null;

  // Set the toast function (will be called from a component with access to toast)
  setToastFunction(toastFn: (error: UserFriendlyError) => void) {
    this.toastFunction = toastFn;
  }

  handleError(
    error: unknown, 
    options: ErrorDisplayOptions = {}
  ): UserFriendlyError {
    const {
      showToast = true,
      logError = true,
      retryable = false,
      onRetry,
    } = options;

    // Convert error to standardized format
    const userFriendlyError = this.convertToUserFriendlyError(error, retryable, onRetry);

    // Log error if requested
    if (logError) {
      const originalError = error instanceof Error ? error : new Error(String(error));
      ErrorLogger.logError(originalError, {
        userFriendlyMessage: userFriendlyError.message,
        severity: userFriendlyError.severity,
      });
    }

    // Show toast if requested and toast function is available
    if (showToast && this.toastFunction) {
      this.toastFunction(userFriendlyError);
    }

    return userFriendlyError;
  }

  private convertToUserFriendlyError(
    error: unknown,
    retryable: boolean = false,
    onRetry?: () => void
  ): UserFriendlyError {
    // Network errors
    if (this.isNetworkError(error)) {
      const networkStatus = NetworkMonitor.getStatus();
      
      if (!networkStatus.isOnline) {
        return {
          title: 'No Internet Connection',
          message: 'Please check your internet connection and try again.',
          severity: 'error',
          action: retryable && onRetry ? {
            label: 'Retry',
            handler: onRetry,
          } : undefined,
        };
      }

      if (networkStatus.isSlowConnection) {
        return {
          title: 'Slow Connection',
          message: 'Your connection seems slow. The request may take longer than usual.',
          severity: 'warning',
          action: retryable && onRetry ? {
            label: 'Retry',
            handler: onRetry,
          } : undefined,
        };
      }

      return {
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please try again.',
        severity: 'error',
        action: retryable && onRetry ? {
          label: 'Retry',
          handler: onRetry,
        } : undefined,
      };
    }

    // Authentication errors
    if (this.isAuthError(error)) {
      if (error.requiresLogin) {
        return {
          title: 'Authentication Required',
          message: 'Please log in to continue.',
          severity: 'critical',
          action: {
            label: 'Go to Login',
            handler: () => {
              window.location.href = '/login';
            },
          },
        };
      }

      return {
        title: 'Access Denied',
        message: 'You don\'t have permission to perform this action.',
        severity: 'error',
      };
    }

    // Validation errors
    if (this.isValidationError(error)) {
      return {
        title: 'Invalid Input',
        message: error.field 
          ? `Please check the ${error.field} field and try again.`
          : 'Please check your input and try again.',
        severity: 'warning',
      };
    }

    // API errors
    if (this.isApiError(error)) {
      return this.handleApiError(error, retryable, onRetry);
    }

    // Generic errors
    if (error instanceof Error) {
      return {
        title: 'Something went wrong',
        message: this.getSafeErrorMessage(error.message),
        severity: 'error',
        action: retryable && onRetry ? {
          label: 'Try Again',
          handler: onRetry,
        } : undefined,
      };
    }

    // Unknown errors
    return {
      title: 'Unexpected Error',
      message: 'An unexpected error occurred. Please try again.',
      severity: 'error',
      action: retryable && onRetry ? {
        label: 'Try Again',
        handler: onRetry,
      } : undefined,
    };
  }

  private handleApiError(
    error: ApiError,
    retryable: boolean,
    onRetry?: () => void
  ): UserFriendlyError {
    // Map common API error codes to user-friendly messages
    const errorMessages: Record<string, { title: string; message: string; severity: UserFriendlyError['severity'] }> = {
      'RATE_LIMITED': {
        title: 'Too Many Requests',
        message: 'You\'re making requests too quickly. Please wait a moment and try again.',
        severity: 'warning',
      },
      'SERVER_ERROR': {
        title: 'Server Error',
        message: 'Our servers are experiencing issues. Please try again in a few minutes.',
        severity: 'error',
      },
      'SERVICE_UNAVAILABLE': {
        title: 'Service Unavailable',
        message: 'The service is temporarily unavailable. Please try again later.',
        severity: 'error',
      },
      'TIMEOUT': {
        title: 'Request Timeout',
        message: 'The request took too long to complete. Please try again.',
        severity: 'warning',
      },
      'NOT_FOUND': {
        title: 'Not Found',
        message: 'The requested resource could not be found.',
        severity: 'error',
      },
    };

    const mappedError = errorMessages[error.code];
    if (mappedError) {
      return {
        ...mappedError,
        action: retryable && onRetry ? {
          label: 'Retry',
          handler: onRetry,
        } : undefined,
      };
    }

    // Fallback for unmapped API errors
    return {
      title: 'Request Failed',
      message: this.getSafeErrorMessage(error.message),
      severity: 'error',
      action: retryable && onRetry ? {
        label: 'Retry',
        handler: onRetry,
      } : undefined,
    };
  }

  private getSafeErrorMessage(message: string): string {
    // Filter out technical details that users don't need to see
    const technicalPatterns = [
      /axios/i,
      /fetch/i,
      /network/i,
      /cors/i,
      /json/i,
      /parse/i,
      /undefined/i,
      /null/i,
    ];

    const isTechnical = technicalPatterns.some(pattern => pattern.test(message));
    
    if (isTechnical || message.length > 100) {
      return 'Please try again or contact support if the problem persists.';
    }

    return message;
  }

  // Type guards
  private isNetworkError(error: unknown): error is NetworkError {
    return typeof error === 'object' && error !== null && 'isNetworkError' in error;
  }

  private isAuthError(error: unknown): error is AuthError {
    return typeof error === 'object' && error !== null && 'isAuthError' in error;
  }

  private isValidationError(error: unknown): error is ValidationError {
    return typeof error === 'object' && error !== null && 'isValidationError' in error;
  }

  private isApiError(error: unknown): error is ApiError {
    return (
      typeof error === 'object' && 
      error !== null && 
      'code' in error && 
      'message' in error
    );
  }

  // Utility methods for common error scenarios
  handleAuthenticationError() {
    return this.handleError(
      { isAuthError: true, requiresLogin: true } as AuthError,
      { showToast: true, logError: true }
    );
  }

  handleNetworkError(retryFn?: () => void) {
    return this.handleError(
      { isNetworkError: true, retryable: true } as NetworkError,
      { 
        showToast: true, 
        logError: true, 
        retryable: !!retryFn,
        onRetry: retryFn,
      }
    );
  }

  handleValidationError(field?: string) {
    return this.handleError(
      { isValidationError: true, field } as ValidationError,
      { showToast: true, logError: false }
    );
  }
}

export const GlobalErrorHandler = new GlobalErrorHandlerService();