import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfirmationDialog, useConfirmationDialog, confirmationDialogs } from '../ConfirmationDialog';

describe('ConfirmationDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    title: 'Test Title',
    description: 'Test description',
    onConfirm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render dialog when open', () => {
    render(<ConfirmationDialog {...defaultProps} />);
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<ConfirmationDialog {...defaultProps} open={false} />);
    
    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
  });

  it('should call onConfirm when confirm button is clicked', async () => {
    render(<ConfirmationDialog {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Confirm'));
    
    expect(defaultProps.onConfirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('should call onCancel when cancel button is clicked', () => {
    const onCancel = jest.fn();
    render(<ConfirmationDialog {...defaultProps} onCancel={onCancel} />);
    
    fireEvent.click(screen.getByText('Cancel'));
    
    expect(onCancel).toHaveBeenCalled();
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should show custom button text', () => {
    render(
      <ConfirmationDialog
        {...defaultProps}
        confirmText="Delete"
        cancelText="Keep"
      />
    );
    
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Keep')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<ConfirmationDialog {...defaultProps} isLoading={true} />);
    
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeDisabled();
    expect(screen.getByText('Cancel')).toBeDisabled();
  });

  it('should render destructive variant', () => {
    render(<ConfirmationDialog {...defaultProps} variant="destructive" />);
    
    // Check for destructive icon (XCircle)
    expect(screen.getByText('Test Title').parentElement).toContainHTML('XCircle');
  });

  it('should handle async onConfirm', async () => {
    const asyncConfirm = jest.fn().mockResolvedValue(undefined);
    render(<ConfirmationDialog {...defaultProps} onConfirm={asyncConfirm} />);
    
    fireEvent.click(screen.getByText('Confirm'));
    
    expect(asyncConfirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('should handle async onConfirm error', async () => {
    const asyncConfirm = jest.fn().mockRejectedValue(new Error('Test error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    render(<ConfirmationDialog {...defaultProps} onConfirm={asyncConfirm} />);
    
    fireEvent.click(screen.getByText('Confirm'));
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Confirmation action failed:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });
});

describe('useConfirmationDialog', () => {
  function TestComponent() {
    const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

    return (
      <div>
        <button
          onClick={() =>
            showConfirmation({
              title: 'Test',
              description: 'Test description',
              onConfirm: jest.fn(),
            })
          }
        >
          Show Dialog
        </button>
        {ConfirmationDialog}
      </div>
    );
  }

  it('should show and hide confirmation dialog', () => {
    render(<TestComponent />);
    
    expect(screen.queryByText('Test')).not.toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Show Dialog'));
    
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });
});

describe('confirmationDialogs presets', () => {
  it('should create delete confirmation', () => {
    const onConfirm = jest.fn();
    const config = confirmationDialogs.delete('Test Item', onConfirm);
    
    expect(config.title).toBe('Delete Item');
    expect(config.description).toContain('Test Item');
    expect(config.variant).toBe('destructive');
    expect(config.confirmText).toBe('Delete');
    expect(config.onConfirm).toBe(onConfirm);
  });

  it('should create logout confirmation', () => {
    const onConfirm = jest.fn();
    const config = confirmationDialogs.logout(onConfirm);
    
    expect(config.title).toBe('Sign Out');
    expect(config.variant).toBe('warning');
    expect(config.confirmText).toBe('Sign Out');
    expect(config.onConfirm).toBe(onConfirm);
  });

  it('should create clear data confirmation', () => {
    const onConfirm = jest.fn();
    const config = confirmationDialogs.clearData('chat history', onConfirm);
    
    expect(config.title).toBe('Clear chat history');
    expect(config.description).toContain('chat history');
    expect(config.variant).toBe('destructive');
    expect(config.confirmText).toBe('Clear');
    expect(config.onConfirm).toBe(onConfirm);
  });

  it('should create reprocess confirmation', () => {
    const onConfirm = jest.fn();
    const config = confirmationDialogs.reprocess('Test Data', onConfirm);
    
    expect(config.title).toBe('Reprocess Item');
    expect(config.description).toContain('Test Data');
    expect(config.variant).toBe('warning');
    expect(config.confirmText).toBe('Reprocess');
    expect(config.onConfirm).toBe(onConfirm);
  });

  it('should create cancel confirmation', () => {
    const onConfirm = jest.fn();
    const config = confirmationDialogs.cancel('upload', onConfirm);
    
    expect(config.title).toBe('Cancel upload');
    expect(config.description).toContain('upload');
    expect(config.variant).toBe('warning');
    expect(config.confirmText).toBe('Cancel Action');
    expect(config.onConfirm).toBe(onConfirm);
  });
});