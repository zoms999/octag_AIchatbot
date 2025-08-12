import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ETLProgressMonitor } from '../ETLProgressMonitor';
import { useTestStore } from '../../../lib/stores/test';
import { useETLMonitoring } from '../../../hooks/useETLMonitoring';
import { ProcessingJob } from '../../../types';

// Mock the stores and hooks
jest.mock('../../../lib/stores/test');
jest.mock('../../../hooks/useETLMonitoring');
jest.mock('../../ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

const mockUseTestStore = useTestStore as jest.MockedFunction<typeof useTestStore>;
const mockUseETLMonitoring = useETLMonitoring as jest.MockedFunction<
  typeof useETLMonitoring
>;

const mockProcessingJobs: ProcessingJob[] = [
  {
    jobId: 'job-1',
    status: 'running',
    progress: 45,
    currentStep: 'Processing documents',
    estimatedCompletion: new Date(Date.now() + 300000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    jobId: 'job-2',
    status: 'completed',
    progress: 100,
    currentStep: 'Completed',
    estimatedCompletion: new Date().toISOString(),
    createdAt: new Date(Date.now() - 600000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    jobId: 'job-3',
    status: 'failed',
    progress: 30,
    currentStep: 'Failed at document processing',
    estimatedCompletion: '',
    errorMessage: 'Document parsing failed',
    createdAt: new Date(Date.now() - 300000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('ETLProgressMonitor', () => {
  const mockLoadETLJobs = jest.fn();
  const mockCancelJob = jest.fn();
  const mockRetryJob = jest.fn();
  const mockClearErrors = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseTestStore.mockReturnValue({
      processingJobs: mockProcessingJobs,
      isLoadingJobs: false,
      jobsError: null,
      loadETLJobs: mockLoadETLJobs,
      cancelJob: mockCancelJob,
      retryJob: mockRetryJob,
      clearErrors: mockClearErrors,
      // Add other required properties with default values
      tests: [],
      currentTest: null,
      isLoadingTests: false,
      testsError: null,
      selectedTestId: null,
      filterStatus: 'all',
      loadTests: jest.fn(),
      loadTestById: jest.fn(),
      reprocessTest: jest.fn(),
      monitorJob: jest.fn(),
      deleteTest: jest.fn(),
      setSelectedTest: jest.fn(),
      setFilterStatus: jest.fn(),
      updateJobStatus: jest.fn(),
      addJob: jest.fn(),
      removeJob: jest.fn(),
    });

    mockUseETLMonitoring.mockReturnValue({
      connect: jest.fn(),
      disconnect: jest.fn(),
      isConnected: true,
      reconnectAttempts: 0,
    });
  });

  it('renders ETL progress monitor with jobs', () => {
    render(<ETLProgressMonitor />);

    expect(screen.getByText('진행중인 작업 (1)')).toBeInTheDocument();
    expect(screen.getByText('완료된 작업 (2)')).toBeInTheDocument();
    expect(screen.getByText('실시간 모니터링 연결됨')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseTestStore.mockReturnValue({
      ...mockUseTestStore(),
      isLoadingJobs: true,
      processingJobs: [],
    });

    render(<ETLProgressMonitor />);

    expect(screen.getByText('ETL 작업 상태 로딩중...')).toBeInTheDocument();
  });

  it('shows empty state when no jobs', () => {
    mockUseTestStore.mockReturnValue({
      ...mockUseTestStore(),
      processingJobs: [],
    });

    render(<ETLProgressMonitor />);

    expect(screen.getByText('진행중인 작업이 없습니다')).toBeInTheDocument();
    expect(
      screen.getByText('테스트 재처리를 요청하면 여기에 진행 상황이 표시됩니다.')
    ).toBeInTheDocument();
  });

  it('displays running job with progress bar', () => {
    render(<ETLProgressMonitor />);

    expect(screen.getByText('Processing documents')).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByText('실행중')).toBeInTheDocument();
  });

  it('displays completed job', () => {
    render(<ETLProgressMonitor />);

    expect(screen.getByText('완료')).toBeInTheDocument();
  });

  it('displays failed job with error message', () => {
    render(<ETLProgressMonitor />);

    expect(screen.getByText('실패')).toBeInTheDocument();
    expect(screen.getByText('Document parsing failed')).toBeInTheDocument();
  });

  it('handles job cancellation', async () => {
    render(<ETLProgressMonitor />);

    const cancelButton = screen.getByText('취소');
    fireEvent.click(cancelButton);

    // Confirm in dialog
    const confirmButton = screen.getByText('작업 취소');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockCancelJob).toHaveBeenCalledWith('job-1');
    });
  });

  it('handles job retry', async () => {
    render(<ETLProgressMonitor />);

    const retryButton = screen.getByText('재시도');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(mockRetryJob).toHaveBeenCalledWith('job-3');
    });
  });

  it('handles refresh', async () => {
    render(<ETLProgressMonitor />);

    const refreshButton = screen.getByText('새로고침');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockLoadETLJobs).toHaveBeenCalled();
    });
  });

  it('shows connection status', () => {
    render(<ETLProgressMonitor />);

    expect(screen.getByText('실시간 모니터링 연결됨')).toBeInTheDocument();
  });

  it('shows disconnected status', () => {
    mockUseETLMonitoring.mockReturnValue({
      connect: jest.fn(),
      disconnect: jest.fn(),
      isConnected: false,
      reconnectAttempts: 2,
    });

    render(<ETLProgressMonitor />);

    expect(
      screen.getByText('실시간 모니터링 연결 끊김 (재시도: 2)')
    ).toBeInTheDocument();
  });

  it('expands and collapses job details', () => {
    render(<ETLProgressMonitor />);

    const detailsButton = screen.getAllByText('자세히')[0];
    fireEvent.click(detailsButton);

    expect(screen.getByText('생성일:')).toBeInTheDocument();
    expect(screen.getByText('수정일:')).toBeInTheDocument();

    const collapseButton = screen.getByText('접기');
    fireEvent.click(collapseButton);

    expect(screen.queryByText('생성일:')).not.toBeInTheDocument();
  });

  it('calls loadETLJobs on mount', () => {
    render(<ETLProgressMonitor />);

    expect(mockLoadETLJobs).toHaveBeenCalled();
  });

  it('handles errors', () => {
    mockUseTestStore.mockReturnValue({
      ...mockUseTestStore(),
      jobsError: 'Failed to load jobs',
    });

    render(<ETLProgressMonitor />);

    // Error should be handled by useEffect and toast
    expect(mockClearErrors).toHaveBeenCalled();
  });
});