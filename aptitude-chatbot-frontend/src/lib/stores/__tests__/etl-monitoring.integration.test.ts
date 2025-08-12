import { renderHook, act } from '@testing-library/react';
import { useTestStore } from '../test';
import { useETLMonitoring } from '../../../hooks/useETLMonitoring';
import { testsApi } from '../../api/tests';
import { ProcessingJob } from '../../../types';

// Mock the API
jest.mock('../../api/tests');

const mockTestsApi = testsApi as jest.Mocked<typeof testsApi>;

// Mock EventSource
class MockEventSource {
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  addEventListener = jest.fn();
  close = jest.fn();
  readyState = EventSource.CONNECTING;

  constructor(public url: string, public options?: EventSourceInit) {}

  simulateOpen() {
    this.readyState = EventSource.OPEN;
    if (this.onopen) {
      this.onopen(new Event('open'));
    }
  }

  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }

  simulateEvent(type: string, data: any) {
    const handler = this.addEventListener.mock.calls.find(
      (call) => call[0] === type
    )?.[1];
    if (handler) {
      handler(new MessageEvent(type, { data: JSON.stringify(data) }));
    }
  }
}

// Replace global EventSource
(global as any).EventSource = MockEventSource;

describe('ETL Monitoring Integration', () => {
  let mockEventSource: MockEventSource;

  beforeEach(() => {
    jest.clearAllMocks();

    mockTestsApi.createETLJobsEventSource.mockImplementation(() => {
      mockEventSource = new MockEventSource('test-url');
      return mockEventSource as any;
    });

    mockTestsApi.getTestResults.mockResolvedValue({
      success: true,
      data: [],
    });

    mockTestsApi.getETLJobs.mockResolvedValue({
      success: true,
      data: [],
    });

    mockTestsApi.cancelETLJob.mockResolvedValue({
      success: true,
      data: { message: 'Job cancelled' },
    });

    mockTestsApi.retryETLJob.mockResolvedValue({
      success: true,
      data: { jobId: 'new-job-id', status: 'pending', message: 'Job retried' },
    });
  });

  it('integrates ETL monitoring with test store', async () => {
    // Render both hooks
    const { result: storeResult } = renderHook(() => useTestStore());
    const { result: monitoringResult } = renderHook(() =>
      useETLMonitoring({ autoConnect: true })
    );

    // Simulate connection
    act(() => {
      mockEventSource.simulateOpen();
    });

    expect(monitoringResult.current.isConnected).toBe(true);

    // Simulate job creation
    const newJob: ProcessingJob = {
      jobId: 'test-job-1',
      status: 'pending',
      progress: 0,
      currentStep: 'Queued',
      estimatedCompletion: new Date(Date.now() + 300000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    act(() => {
      mockEventSource.simulateEvent('job_started', newJob);
    });

    // Check that job was added to store
    expect(storeResult.current.processingJobs).toContainEqual(newJob);

    // Simulate job progress
    const progressUpdate = {
      jobId: 'test-job-1',
      progress: 50,
      currentStep: 'Processing documents',
    };

    act(() => {
      mockEventSource.simulateEvent('job_progress', progressUpdate);
    });

    // Check that job was updated in store
    const updatedJob = storeResult.current.processingJobs.find(
      (job) => job.jobId === 'test-job-1'
    );
    expect(updatedJob?.progress).toBe(50);
    expect(updatedJob?.currentStep).toBe('Processing documents');

    // Simulate job completion
    const completionUpdate = {
      jobId: 'test-job-1',
      completedAt: new Date().toISOString(),
    };

    act(() => {
      mockEventSource.simulateEvent('job_completed', completionUpdate);
    });

    // Check that job status was updated to completed
    const completedJob = storeResult.current.processingJobs.find(
      (job) => job.jobId === 'test-job-1'
    );
    expect(completedJob?.status).toBe('completed');
    expect(completedJob?.progress).toBe(100);
  });

  it('handles job cancellation through store', async () => {
    const { result: storeResult } = renderHook(() => useTestStore());

    // Add a running job
    const runningJob: ProcessingJob = {
      jobId: 'test-job-2',
      status: 'running',
      progress: 30,
      currentStep: 'Processing',
      estimatedCompletion: new Date(Date.now() + 300000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    act(() => {
      storeResult.current.addJob(runningJob);
    });

    // Cancel the job
    await act(async () => {
      await storeResult.current.cancelJob('test-job-2');
    });

    expect(mockTestsApi.cancelETLJob).toHaveBeenCalledWith('test-job-2');

    // Check that job status was updated
    const cancelledJob = storeResult.current.processingJobs.find(
      (job) => job.jobId === 'test-job-2'
    );
    expect(cancelledJob?.status).toBe('cancelled');
  });

  it('handles job retry through store', async () => {
    const { result: storeResult } = renderHook(() => useTestStore());

    // Add a failed job
    const failedJob: ProcessingJob = {
      jobId: 'test-job-3',
      status: 'failed',
      progress: 25,
      currentStep: 'Failed at processing',
      estimatedCompletion: '',
      errorMessage: 'Processing error',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    act(() => {
      storeResult.current.addJob(failedJob);
    });

    // Mock loadETLJobs to return the new job
    mockTestsApi.getETLJobs.mockResolvedValue({
      success: true,
      data: [
        {
          jobId: 'new-job-id',
          status: 'pending',
          progress: 0,
          currentStep: 'Queued for retry',
          estimatedCompletion: new Date(Date.now() + 300000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });

    // Retry the job
    await act(async () => {
      await storeResult.current.retryJob('test-job-3');
    });

    expect(mockTestsApi.retryETLJob).toHaveBeenCalledWith('test-job-3');
    expect(mockTestsApi.getETLJobs).toHaveBeenCalled();
  });

  it('handles real-time job updates correctly', async () => {
    const { result: storeResult } = renderHook(() => useTestStore());
    renderHook(() => useETLMonitoring({ autoConnect: true }));

    // Simulate connection
    act(() => {
      mockEventSource.simulateOpen();
    });

    // Test multiple job events in sequence
    const job: ProcessingJob = {
      jobId: 'test-job-4',
      status: 'pending',
      progress: 0,
      currentStep: 'Queued',
      estimatedCompletion: new Date(Date.now() + 300000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Job started
    act(() => {
      mockEventSource.simulateEvent('job_started', job);
    });

    expect(storeResult.current.processingJobs).toHaveLength(1);

    // Job progress updates
    act(() => {
      mockEventSource.simulateEvent('job_progress', {
        jobId: 'test-job-4',
        progress: 25,
        currentStep: 'Parsing documents',
      });
    });

    act(() => {
      mockEventSource.simulateEvent('job_progress', {
        jobId: 'test-job-4',
        progress: 75,
        currentStep: 'Generating embeddings',
      });
    });

    // Check final state
    const finalJob = storeResult.current.processingJobs.find(
      (j) => j.jobId === 'test-job-4'
    );
    expect(finalJob?.progress).toBe(75);
    expect(finalJob?.currentStep).toBe('Generating embeddings');

    // Job completion
    act(() => {
      mockEventSource.simulateEvent('job_completed', {
        jobId: 'test-job-4',
        completedAt: new Date().toISOString(),
      });
    });

    const completedJob = storeResult.current.processingJobs.find(
      (j) => j.jobId === 'test-job-4'
    );
    expect(completedJob?.status).toBe('completed');
    expect(completedJob?.progress).toBe(100);
  });

  it('handles job failures with error messages', async () => {
    const { result: storeResult } = renderHook(() => useTestStore());
    renderHook(() => useETLMonitoring({ autoConnect: true }));

    // Simulate connection
    act(() => {
      mockEventSource.simulateOpen();
    });

    // Start a job
    const job: ProcessingJob = {
      jobId: 'test-job-5',
      status: 'running',
      progress: 40,
      currentStep: 'Processing documents',
      estimatedCompletion: new Date(Date.now() + 300000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    act(() => {
      mockEventSource.simulateEvent('job_started', job);
    });

    // Simulate job failure
    act(() => {
      mockEventSource.simulateEvent('job_failed', {
        jobId: 'test-job-5',
        errorMessage: 'Document parsing failed due to invalid format',
        failedAt: new Date().toISOString(),
      });
    });

    const failedJob = storeResult.current.processingJobs.find(
      (j) => j.jobId === 'test-job-5'
    );
    expect(failedJob?.status).toBe('failed');
    expect(failedJob?.errorMessage).toBe(
      'Document parsing failed due to invalid format'
    );
  });
});