interface ErrorContext {
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  timestamp?: string;
  componentStack?: string;
  errorBoundary?: boolean;
  [key: string]: any;
}

interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  name: string;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  fingerprint: string;
}

class ErrorLoggerService {
  private errorQueue: ErrorReport[] = [];
  private isOnline = true;
  private maxQueueSize = 100;

  constructor() {
    this.setupOnlineListener();
    this.setupUnhandledErrorListeners();
  }

  private setupOnlineListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.flushErrorQueue();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
      });

      this.isOnline = navigator.onLine;
    }
  }

  private setupUnhandledErrorListeners() {
    if (typeof window !== 'undefined') {
      // Catch unhandled JavaScript errors
      window.addEventListener('error', (event) => {
        this.logError(event.error || new Error(event.message), {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          unhandled: true,
        });
      });

      // Catch unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.logError(
          event.reason instanceof Error 
            ? event.reason 
            : new Error(String(event.reason)),
          {
            unhandledPromise: true,
          }
        );
      });
    }
  }

  logError(error: Error, context: ErrorContext = {}): string {
    const errorId = this.generateErrorId();
    
    const errorReport: ErrorReport = {
      id: errorId,
      message: error.message,
      stack: error.stack,
      name: error.name,
      context: {
        ...context,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        timestamp: new Date().toISOString(),
      },
      severity: this.determineSeverity(error, context),
      fingerprint: this.generateFingerprint(error),
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Logged: ${errorId}`);
      console.error('Error:', error);
      console.log('Context:', context);
      console.log('Report:', errorReport);
      console.groupEnd();
    }

    // Store locally
    this.storeErrorLocally(errorReport);

    // Send to server if online
    if (this.isOnline) {
      this.sendErrorToServer(errorReport);
    } else {
      this.queueError(errorReport);
    }

    return errorId;
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFingerprint(error: Error): string {
    // Create a fingerprint to group similar errors
    const key = `${error.name}:${error.message}:${error.stack?.split('\n')[1] || ''}`;
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '').substr(0, 16);
  }

  private determineSeverity(error: Error, context: ErrorContext): ErrorReport['severity'] {
    // Critical: Authentication errors, payment errors
    if (error.name === 'AuthError' || context.errorBoundary) {
      return 'critical';
    }

    // High: Network errors, API errors
    if (error.name === 'NetworkError' || error.name === 'ApiError') {
      return 'high';
    }

    // Medium: Validation errors, user input errors
    if (error.name === 'ValidationError') {
      return 'medium';
    }

    // Low: Everything else
    return 'low';
  }

  private storeErrorLocally(errorReport: ErrorReport) {
    try {
      const stored = localStorage.getItem('error_reports') || '[]';
      const reports: ErrorReport[] = JSON.parse(stored);
      
      reports.push(errorReport);
      
      // Keep only last 50 errors
      if (reports.length > 50) {
        reports.splice(0, reports.length - 50);
      }
      
      localStorage.setItem('error_reports', JSON.stringify(reports));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  private async sendErrorToServer(errorReport: ErrorReport) {
    try {
      // In a real app, you'd send this to your error reporting service
      // For now, we'll just log it
      if (process.env.NODE_ENV === 'development') {
        console.log('Would send error to server:', errorReport);
      }

      // Example implementation:
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport),
      // });
    } catch (e) {
      // If sending fails, queue it for later
      this.queueError(errorReport);
    }
  }

  private queueError(errorReport: ErrorReport) {
    if (this.errorQueue.length >= this.maxQueueSize) {
      this.errorQueue.shift(); // Remove oldest error
    }
    this.errorQueue.push(errorReport);
  }

  private async flushErrorQueue() {
    const errors = [...this.errorQueue];
    this.errorQueue = [];

    for (const error of errors) {
      await this.sendErrorToServer(error);
    }
  }

  // Get stored errors for debugging
  getStoredErrors(): ErrorReport[] {
    try {
      const stored = localStorage.getItem('error_reports') || '[]';
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  // Clear stored errors
  clearStoredErrors() {
    try {
      localStorage.removeItem('error_reports');
    } catch {
      // Ignore
    }
  }
}

export const ErrorLogger = new ErrorLoggerService();