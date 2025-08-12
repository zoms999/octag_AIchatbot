import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ETLJobStatus } from '../ETLJobStatus';
import { ProcessingJob } from '../../../types';

const mockRunningJob: ProcessingJob = {
  jobId: 'job-running-123',
  status: 'running',
  progress: 65,
  currentStep: 'Processing documents',
  estimatedCompletion: new Date(Date.now() + 300000).toISOString(),
  createdAt: new Date(Date.now() - 120000).toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockFailedJob: ProcessingJob = {
  jobId: 'job-failed-456',
  status: 'failed',
  progress: 30,
  currentStep: 'Failed at document processing',
  estimatedCompletion: '',
  errorMessage: 'Document parsing failed due to invalid format',
  createdAt: new Date(Date.now() - 300000).toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockCompletedJob: ProcessingJob = {
  jobId: 'job-completed-789',
  status: 'completed',
  progress: 100,
  currentStep: 'Completed successfully',
  estimatedCompletion: new Date().toISOString(),
  createdAt: new Date(Date.now() - 600000).toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('ETLJobStatus', () => {
  const mockOnCancel = jest.fn();
  const mockOnRetry = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Running Job', () => {
    it('renders running job with progress bar', () => {
      render(
        <ETLJobStatus
          job={mockRunningJob}
          onCancel={mockOnCancel}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.getByText('작업 ID: job-runn...')).toBeInTheDocument();
      expect(screen.getByText('실행중')).toBeInTheDocument();
      expect(screen.getByText('Processing documents')).toBeInTheDocument();
      expect(screen.getByText('65%')).toBeInTheDocument();
      expect(screen.getByText('취소')).toBeInTheDocument();
    });

    it('handles cancel action', () => {
      render(
        <ETLJobStatus
          job={mockRunningJob}
          onCancel={mockOnCancel}
          onRetry={mockOnRetry}
        />
      );

      const cancelButton = screen.getByText('취소');
      fireEvent.click(cancelButton);

      // Should open confirmation dialog
      expect(screen.getByText('작업 취소')).toBeInTheDocument();
      expect(
        screen.getByText(
          '진행중인 ETL 작업을 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.'
        )
      ).toBeInTheDocument();

      // Confirm cancellation
      const confirmButton = screen.getByText('작업 취소');
      fireEvent.click(confirmButton);

      expect(mockOnCancel).toHaveBeenCalledWith('job-running-123');
    });
  });

  describe('Failed Job', () => {
    it('renders failed job with error message', () => {
      render(
        <ETLJobStatus
          job={mockFailedJob}
          onCancel={mockOnCancel}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.getByText('작업 ID: job-fail...')).toBeInTheDocument();
      expect(screen.getByText('실패')).toBeInTheDocument();
      expect(screen.getByText('오류 발생')).toBeInTheDocument();
      expect(
        screen.getByText('Document parsing failed due to invalid format')
      ).toBeInTheDocument();
      expect(screen.getByText('재시도')).toBeInTheDocument();
    });

    it('handles retry action', () => {
      render(
        <ETLJobStatus
          job={mockFailedJob}
          onCancel={mockOnCancel}
          onRetry={mockOnRetry}
        />
      );

      const retryButton = screen.getByText('재시도');
      fireEvent.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalledWith('job-failed-456');
    });
  });

  describe('Completed Job', () => {
    it('renders completed job without actions', () => {
      render(
        <ETLJobStatus
          job={mockCompletedJob}
          onCancel={mockOnCancel}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.getByText('작업 ID: job-comp...')).toBeInTheDocument();
      expect(screen.getByText('완료')).toBeInTheDocument();
      expect(screen.queryByText('취소')).not.toBeInTheDocument();
      expect(screen.queryByText('재시도')).not.toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('renders in compact mode', () => {
      render(
        <ETLJobStatus
          job={mockRunningJob}
          onCancel={mockOnCancel}
          onRetry={mockOnRetry}
          compact={true}
        />
      );

      expect(screen.getByText('Processing documents')).toBeInTheDocument();
      expect(screen.getByText('실행중')).toBeInTheDocument();
      // Should not show full job ID in compact mode
      expect(screen.queryByText('작업 ID:')).not.toBeInTheDocument();
    });

    it('shows progress bar in compact mode for running jobs', () => {
      render(
        <ETLJobStatus
          job={mockRunningJob}
          onCancel={mockOnCancel}
          onRetry={mockOnRetry}
          compact={true}
        />
      );

      // Progress bar should be present (though we can't easily test the visual)
      expect(screen.getByText('Processing documents')).toBeInTheDocument();
    });

    it('handles actions in compact mode', () => {
      render(
        <ETLJobStatus
          job={mockRunningJob}
          onCancel={mockOnCancel}
          onRetry={mockOnRetry}
          compact={true}
        />
      );

      // Should have cancel button (X icon)
      const cancelButton = screen.getByRole('button');
      fireEvent.click(cancelButton);

      // Should open confirmation dialog
      expect(screen.getByText('작업 취소')).toBeInTheDocument();
    });
  });

  describe('Actions Control', () => {
    it('hides actions when showActions is false', () => {
      render(
        <ETLJobStatus
          job={mockRunningJob}
          onCancel={mockOnCancel}
          onRetry={mockOnRetry}
          showActions={false}
        />
      );

      expect(screen.queryByText('취소')).not.toBeInTheDocument();
    });

    it('shows actions when showActions is true', () => {
      render(
        <ETLJobStatus
          job={mockRunningJob}
          onCancel={mockOnCancel}
          onRetry={mockOnRetry}
          showActions={true}
        />
      );

      expect(screen.getByText('취소')).toBeInTheDocument();
    });
  });

  describe('Job Status Icons', () => {
    it('shows correct icon for pending job', () => {
      const pendingJob: ProcessingJob = {
        ...mockRunningJob,
        status: 'pending',
      };

      render(<ETLJobStatus job={pendingJob} />);

      expect(screen.getByText('대기중')).toBeInTheDocument();
    });

    it('shows correct icon for cancelled job', () => {
      const cancelledJob: ProcessingJob = {
        ...mockRunningJob,
        status: 'cancelled',
      };

      render(<ETLJobStatus job={cancelledJob} />);

      expect(screen.getByText('취소됨')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('displays formatted dates', () => {
      render(
        <ETLJobStatus
          job={mockRunningJob}
          onCancel={mockOnCancel}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.getByText('생성일:')).toBeInTheDocument();
      expect(screen.getByText('수정일:')).toBeInTheDocument();
    });

    it('displays estimated completion for running jobs', () => {
      render(
        <ETLJobStatus
          job={mockRunningJob}
          onCancel={mockOnCancel}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.getByText('예상 완료:')).toBeInTheDocument();
    });
  });
});