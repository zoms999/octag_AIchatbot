import { GlobalErrorHandler } from '../globalErrorHandler';
import { NetworkMonitor } from '../networkMonitor';
import { ApiError, NetworkError, AuthError, ValidationError } from '@/types/api';

// Mock NetworkMonitor
jest.mock('../networkMonitor', () => ({
  NetworkMonitor: {
    getStatus: jest.fn(),
  },
}));

const mockNetworkMonitor = NetworkMonitor as jest.Mocked<typeof NetworkMonitor>;

describe('GlobalErrorHandler', () => {
  let mockToastFunction: jest.Mock;

  beforeEach(() => {
    mockToastFunction = jest.fn();
    GlobalErrorHandler.setToastFunction(mockToastFunction);
    
    // Default network status
    mockNetworkMonitor.getStatus.mockReturnValue({
      isOnline: true,
      isSlowConnection: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleError', () => {
    it('should handle network errors when offline', () => {
      mockNetworkMonitor.getStatus.mockReturnValue({
        isOnline: false,
        isSlowConnection: false,
      });

      const networkError: NetworkError = {
        name: 'NetworkError',
        message: 'Network error',
        isNetworkError: true,
        retryable: true,
      };

      const result = GlobalErrorHandler.handleError(networkError);

      expect(result.title).toBe('No Internet Connection');
      expect(result.severity).toBe('error');
      expect(mockToastFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'No Internet Connection',
          severity: 'error',
        })
      );
    });

    it('should handle slow connection', () => {
      mockNetworkMonitor.getStatus.mockReturnValue({
        isOnline: true,
        isSlowConnection: true,
      });

      const networkError: NetworkError = {
        name: 'NetworkError',
        message: 'Network error',
        isNetworkError: true,
        retryable: true,
      };

      const result = GlobalErrorHandler.handleError(networkError);

      expect(result.title).toBe('Slow Connection');
      expect(result.severity).toBe('warning');
    });

    it('should handle authentication errors requiring login', () => {
      const authError: AuthError = {
        name: 'AuthError',
        message: 'Unauthorized',
        isAuthError: true,
        requiresLogin: true,
        statusCode: 401,
      };

      const result = GlobalErrorHandler.handleError(authError);

      expect(result.title).toBe('Authentication Required');
      expect(result.severity).toBe('critical');
      expect(result.action).toBeDefined();
      expect(result.action?.label).toBe('Go to Login');
    });

    it('should handle validation errors with field information', () => {
      const validationError: ValidationError = {
        name: 'ValidationError',
        message: 'Invalid email',
        isValidationError: true,
        field: 'email',
        statusCode: 400,
      };

      const result = GlobalErrorHandler.handleError(validationError);

      expect(result.title).toBe('Invalid Input');
      expect(result.message).toContain('email field');
      expect(result.severity).toBe('warning');
    });

    it('should handle API errors with known error codes', () => {
      const apiError: ApiError = {
        code: 'RATE_LIMITED',
        message: 'Too many requests',
      };

      const result = GlobalErrorHandler.handleError(apiError);

      expect(result.title).toBe('Too Many Requests');
      expect(result.severity).toBe('warning');
    });

    it('should handle generic errors', () => {
      const genericError = new Error('Something went wrong');

      const result = GlobalErrorHandler.handleError(genericError);

      expect(result.title).toBe('Something went wrong');
      expect(result.severity).toBe('error');
    });

    it('should include retry action when retryable is true', () => {
      const mockRetry = jest.fn();
      const error = new Error('Test error');

      const result = GlobalErrorHandler.handleError(error, {
        retryable: true,
        onRetry: mockRetry,
      });

      expect(result.action).toBeDefined();
      expect(result.action?.label).toBe('Try Again');
      
      // Test retry action
      result.action?.handler();
      expect(mockRetry).toHaveBeenCalled();
    });

    it('should not show toast when showToast is false', () => {
      const error = new Error('Test error');

      GlobalErrorHandler.handleError(error, { showToast: false });

      expect(mockToastFunction).not.toHaveBeenCalled();
    });

    it('should filter out technical error messages', () => {
      const technicalError = new Error('axios request failed with CORS error');

      const result = GlobalErrorHandler.handleError(technicalError);

      expect(result.message).toBe('Please try again or contact support if the problem persists.');
    });
  });

  describe('convenience methods', () => {
    it('should handle authentication errors', () => {
      const result = GlobalErrorHandler.handleAuthenticationError();

      expect(result.title).toBe('Authentication Required');
      expect(result.severity).toBe('critical');
      expect(mockToastFunction).toHaveBeenCalled();
    });

    it('should handle network errors with retry', () => {
      const mockRetry = jest.fn();
      
      const result = GlobalErrorHandler.handleNetworkError(mockRetry);

      expect(result.action).toBeDefined();
      expect(result.action?.label).toBe('Retry');
    });

    it('should handle validation errors', () => {
      const result = GlobalErrorHandler.handleValidationError('username');

      expect(result.title).toBe('Invalid Input');
      expect(result.message).toContain('username field');
      expect(result.severity).toBe('warning');
    });
  });
});