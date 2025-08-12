import { ErrorLogger } from '../errorLogger';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    onLine: true,
    userAgent: 'test-agent',
  },
});

describe('ErrorLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('[]');
  });

  afterEach(() => {
    ErrorLogger.clearStoredErrors();
  });

  describe('logError', () => {
    it('should generate unique error IDs', () => {
      const error1 = new Error('Test error 1');
      const error2 = new Error('Test error 2');

      const id1 = ErrorLogger.logError(error1);
      const id2 = ErrorLogger.logError(error2);

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^err_\d+_[a-z0-9]+$/);
    });

    it('should include context information', () => {
      const error = new Error('Test error');
      const context = {
        userId: 'user123',
        componentStack: 'TestComponent',
      };

      const consoleSpy = jest.spyOn(console, 'group').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleGroupEndSpy = jest.spyOn(console, 'groupEnd').mockImplementation();

      ErrorLogger.logError(error, context);

      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', error);
      expect(consoleLogSpy).toHaveBeenCalledWith('Context:', context);

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
      consoleGroupEndSpy.mockRestore();
    });

    it('should store errors locally', () => {
      const error = new Error('Test error');
      
      ErrorLogger.logError(error);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'error_reports',
        expect.stringContaining('"message":"Test error"')
      );
    });

    it('should determine correct severity levels', () => {
      const consoleSpy = jest.spyOn(console, 'group').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleGroupEndSpy = jest.spyOn(console, 'groupEnd').mockImplementation();

      // Critical error
      const authError = new Error('Auth failed');
      authError.name = 'AuthError';
      ErrorLogger.logError(authError);

      // High severity error
      const networkError = new Error('Network failed');
      networkError.name = 'NetworkError';
      ErrorLogger.logError(networkError);

      // Medium severity error
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      ErrorLogger.logError(validationError);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Report:',
        expect.objectContaining({ severity: 'critical' })
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Report:',
        expect.objectContaining({ severity: 'high' })
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Report:',
        expect.objectContaining({ severity: 'medium' })
      );

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
      consoleGroupEndSpy.mockRestore();
    });
  });

  describe('getStoredErrors', () => {
    it('should return stored errors', () => {
      const mockErrors = [
        {
          id: 'err_123',
          message: 'Test error',
          name: 'Error',
          context: {},
          severity: 'low',
          fingerprint: 'abc123',
        },
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockErrors));

      const errors = ErrorLogger.getStoredErrors();
      expect(errors).toEqual(mockErrors);
    });

    it('should return empty array if no errors stored', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const errors = ErrorLogger.getStoredErrors();
      expect(errors).toEqual([]);
    });

    it('should handle corrupted localStorage data', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const errors = ErrorLogger.getStoredErrors();
      expect(errors).toEqual([]);
    });
  });

  describe('clearStoredErrors', () => {
    it('should clear stored errors', () => {
      ErrorLogger.clearStoredErrors();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('error_reports');
    });
  });
});