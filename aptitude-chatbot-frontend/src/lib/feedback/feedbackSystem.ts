import { toast } from '@/components/ui/use-toast';
import { CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';

export interface FeedbackOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ProgressFeedbackOptions extends FeedbackOptions {
  progress?: number;
  onCancel?: () => void;
}

class FeedbackSystemService {
  // Success feedback
  success(message: string, options: FeedbackOptions = {}) {
    const { title = 'Success', description, duration = 5000, action } = options;

    toast({
      title: (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          {title}
        </div>
      ),
      description: description || message,
      duration,
      action: action ? (
        <button
          onClick={action.onClick}
          className="text-sm underline hover:no-underline"
        >
          {action.label}
        </button>
      ) : undefined,
    });
  }

  // Error feedback
  error(message: string, options: FeedbackOptions = {}) {
    const { title = 'Error', description, duration = 0, action } = options; // 0 = no auto-dismiss

    toast({
      variant: 'destructive',
      title: (
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4" />
          {title}
        </div>
      ),
      description: description || message,
      duration,
      action: action ? (
        <button
          onClick={action.onClick}
          className="text-sm underline hover:no-underline"
        >
          {action.label}
        </button>
      ) : undefined,
    });
  }

  // Warning feedback
  warning(message: string, options: FeedbackOptions = {}) {
    const { title = 'Warning', description, duration = 7000, action } = options;

    toast({
      title: (
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          {title}
        </div>
      ),
      description: description || message,
      duration,
      action: action ? (
        <button
          onClick={action.onClick}
          className="text-sm underline hover:no-underline"
        >
          {action.label}
        </button>
      ) : undefined,
    });
  }

  // Info feedback
  info(message: string, options: FeedbackOptions = {}) {
    const { title = 'Information', description, duration = 5000, action } = options;

    toast({
      title: (
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-500" />
          {title}
        </div>
      ),
      description: description || message,
      duration,
      action: action ? (
        <button
          onClick={action.onClick}
          className="text-sm underline hover:no-underline"
        >
          {action.label}
        </button>
      ) : undefined,
    });
  }

  // Loading feedback with progress
  loading(message: string, options: ProgressFeedbackOptions = {}) {
    const { 
      title = 'Loading', 
      description, 
      duration = 0, 
      progress, 
      onCancel,
      action 
    } = options;

    const progressText = typeof progress === 'number' 
      ? ` (${Math.round(progress)}%)`
      : '';

    toast({
      title: (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          {title}{progressText}
        </div>
      ),
      description: description || message,
      duration,
      action: onCancel ? (
        <button
          onClick={onCancel}
          className="text-sm underline hover:no-underline text-destructive"
        >
          Cancel
        </button>
      ) : action ? (
        <button
          onClick={action.onClick}
          className="text-sm underline hover:no-underline"
        >
          {action.label}
        </button>
      ) : undefined,
    });
  }

  // Predefined feedback messages
  predefined = {
    // Authentication
    loginSuccess: () => this.success('Successfully logged in', {
      title: 'Welcome back!',
      description: 'You have been successfully authenticated.',
    }),

    loginError: (retryFn?: () => void) => this.error('Login failed', {
      title: 'Authentication Failed',
      description: 'Please check your credentials and try again.',
      action: retryFn ? { label: 'Retry', onClick: retryFn } : undefined,
    }),

    logoutSuccess: () => this.success('Successfully logged out', {
      title: 'Goodbye!',
      description: 'You have been safely logged out.',
    }),

    sessionExpired: () => this.warning('Your session has expired', {
      title: 'Session Expired',
      description: 'Please log in again to continue.',
      action: {
        label: 'Login',
        onClick: () => window.location.href = '/login',
      },
    }),

    // Data operations
    saveSuccess: (itemName?: string) => this.success(
      `${itemName || 'Item'} saved successfully`,
      { title: 'Saved' }
    ),

    saveError: (itemName?: string, retryFn?: () => void) => this.error(
      `Failed to save ${itemName || 'item'}`,
      {
        title: 'Save Failed',
        action: retryFn ? { label: 'Retry', onClick: retryFn } : undefined,
      }
    ),

    deleteSuccess: (itemName?: string) => this.success(
      `${itemName || 'Item'} deleted successfully`,
      { title: 'Deleted' }
    ),

    deleteError: (itemName?: string, retryFn?: () => void) => this.error(
      `Failed to delete ${itemName || 'item'}`,
      {
        title: 'Delete Failed',
        action: retryFn ? { label: 'Retry', onClick: retryFn } : undefined,
      }
    ),

    // Network
    networkError: (retryFn?: () => void) => this.error('Network connection failed', {
      title: 'Connection Error',
      description: 'Please check your internet connection and try again.',
      action: retryFn ? { label: 'Retry', onClick: retryFn } : undefined,
    }),

    slowConnection: () => this.warning('Slow network detected', {
      title: 'Slow Connection',
      description: 'Some features may take longer to load.',
    }),

    backOnline: () => this.success('Connection restored', {
      title: 'Back Online',
      description: 'Your internet connection has been restored.',
    }),

    // Chat
    messageSent: () => this.success('Message sent', { duration: 2000 }),

    messageError: (retryFn?: () => void) => this.error('Failed to send message', {
      title: 'Message Failed',
      action: retryFn ? { label: 'Retry', onClick: retryFn } : undefined,
    }),

    // ETL/Processing
    processingStarted: (itemName?: string) => this.info(
      `Processing ${itemName || 'item'} started`,
      { title: 'Processing Started' }
    ),

    processingComplete: (itemName?: string) => this.success(
      `${itemName || 'Item'} processed successfully`,
      { title: 'Processing Complete' }
    ),

    processingError: (itemName?: string, retryFn?: () => void) => this.error(
      `Failed to process ${itemName || 'item'}`,
      {
        title: 'Processing Failed',
        action: retryFn ? { label: 'Retry', onClick: retryFn } : undefined,
      }
    ),

    // File operations
    fileUploadSuccess: (fileName?: string) => this.success(
      `${fileName || 'File'} uploaded successfully`,
      { title: 'Upload Complete' }
    ),

    fileUploadError: (fileName?: string, retryFn?: () => void) => this.error(
      `Failed to upload ${fileName || 'file'}`,
      {
        title: 'Upload Failed',
        action: retryFn ? { label: 'Retry', onClick: retryFn } : undefined,
      }
    ),

    // Validation
    validationError: (field?: string) => this.warning(
      field ? `Please check the ${field} field` : 'Please check your input',
      { title: 'Invalid Input' }
    ),

    // Generic
    operationSuccess: (operation?: string) => this.success(
      `${operation || 'Operation'} completed successfully`
    ),

    operationError: (operation?: string, retryFn?: () => void) => this.error(
      `${operation || 'Operation'} failed`,
      {
        action: retryFn ? { label: 'Retry', onClick: retryFn } : undefined,
      }
    ),
  };
}

export const FeedbackSystem = new FeedbackSystemService();

// React hook for easier usage
export function useFeedback() {
  return FeedbackSystem;
}