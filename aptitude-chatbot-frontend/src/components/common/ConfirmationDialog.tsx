'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

export interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'warning' | 'info';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmationDialogProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      // Error handling is done by the global error handler
      console.error('Confirmation action failed:', error);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const getIcon = () => {
    switch (variant) {
      case 'destructive':
        return <XCircle className="h-6 w-6 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      case 'info':
        return <Info className="h-6 w-6 text-blue-500" />;
      default:
        return <CheckCircle className="h-6 w-6 text-green-500" />;
    }
  };

  const getConfirmVariant = (): 'default' | 'destructive' => {
    return variant === 'destructive' ? 'destructive' : 'default';
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {getIcon()}
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isLoading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant={getConfirmVariant()}
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : confirmText}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Hook for easier usage
export function useConfirmationDialog() {
  const [dialogState, setDialogState] = React.useState<{
    open: boolean;
    props: Omit<ConfirmationDialogProps, 'open' | 'onOpenChange'> | null;
  }>({
    open: false,
    props: null,
  });

  const showConfirmation = (
    props: Omit<ConfirmationDialogProps, 'open' | 'onOpenChange'>
  ) => {
    setDialogState({
      open: true,
      props,
    });
  };

  const hideConfirmation = () => {
    setDialogState({
      open: false,
      props: null,
    });
  };

  const ConfirmationDialogComponent = dialogState.props ? (
    <ConfirmationDialog
      {...dialogState.props}
      open={dialogState.open}
      onOpenChange={hideConfirmation}
    />
  ) : null;

  return {
    showConfirmation,
    hideConfirmation,
    ConfirmationDialog: ConfirmationDialogComponent,
  };
}

// Predefined confirmation dialogs
export const confirmationDialogs = {
  delete: (itemName: string, onConfirm: () => void | Promise<void>) => ({
    title: 'Delete Item',
    description: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
    confirmText: 'Delete',
    variant: 'destructive' as const,
    onConfirm,
  }),

  logout: (onConfirm: () => void | Promise<void>) => ({
    title: 'Sign Out',
    description: 'Are you sure you want to sign out? You will need to log in again to access your account.',
    confirmText: 'Sign Out',
    variant: 'warning' as const,
    onConfirm,
  }),

  clearData: (dataType: string, onConfirm: () => void | Promise<void>) => ({
    title: `Clear ${dataType}`,
    description: `Are you sure you want to clear all ${dataType}? This action cannot be undone.`,
    confirmText: 'Clear',
    variant: 'destructive' as const,
    onConfirm,
  }),

  reprocess: (itemName: string, onConfirm: () => void | Promise<void>) => ({
    title: 'Reprocess Item',
    description: `Are you sure you want to reprocess "${itemName}"? This will overwrite the existing results.`,
    confirmText: 'Reprocess',
    variant: 'warning' as const,
    onConfirm,
  }),

  cancel: (actionName: string, onConfirm: () => void | Promise<void>) => ({
    title: `Cancel ${actionName}`,
    description: `Are you sure you want to cancel the ${actionName}? Any progress will be lost.`,
    confirmText: 'Cancel Action',
    variant: 'warning' as const,
    onConfirm,
  }),
};