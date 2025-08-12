import { renderHook, act } from '@testing-library/react';
import { useETLMonitoring } from '../useETLMonitoring';
import { useTestStore } from '../../lib/stores/test';
import { testsApi } from '../../lib/api/tests';

// Mock dependencies
jest.mock('../../lib/stores/test');
jest.mock('../../lib/api/tests');

const mockUseTestStore = useTestStore as jest.MockedFunction<typeof useTestStore>;
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

  // Helper methods for testing
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

  simulateError() {
    this.readyState = EventSource.CLOSED;
    if (this.onerror) {
      this.onerror(new Event('error'));
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

describe('useETLMonitoring', () => {
  const mockUpdateJobStatus = jest.fn();
  const mockAddJob = jest.fn();
  const mockRemoveJob = jest.fn();

  let mockEventSource: MockEventSource;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockUseTestStore.mockReturnValue({
      updateJobStatus: mockUpdateJobStatus,
      addJob: mockAddJob,
      removeJob: mockRemoveJob,
      // Add other required properties
      tests: [],
      currentTest: null,
      isLoadingTests: false,
      testsError: null,
      processingJobs: [],
      isLoadingJobs: false,
      jobsError: null,
      selectedTestId: null,
      filterStatus: 'all',
      loadTests: jest.fn(),
      loadTestById: jest.fn(),
      reprocessTest: jest.fn(),
      loadETLJobs: jest.fn(),
      monitorJob: jest.fn(),
      cancelJob: jest.fn(),
      retryJob: jest.fn(),
      deleteTest: jest.fn(),
      setSelectedTest: jest.fn(),
      setFilterStatus: jest.fn(),
      clearErrors: jest.fn(),
    });

    mockTestsApi.createETLJobsEventSource.mockImplementation(() => {
      mockEventSource = new MockEventSource('test-url');
      return mockEventSource as any;
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('connects automatically when autoConnect is true', () => {
    renderHook(() => useETLMonitoring({ autoConnect: true }));

    expect(mockTestsApi.createETLJobsEventSource).toHaveBeenCalled();
  });

  it('does not connect automatically when autoConnect is false', () => {
    renderHook(() => useETLMonitoring({ autoConnect: false }));

    expect(mockTestsApi.createETLJobsEventSource).not.toHaveBeenCalled();
  });

  it('handles connection open', () => {
    const { result } = renderHook(() => useETLMonitoring());

    act(() => {
      mockEventSource.simulateOpen();
    });

    expect(result.current.isConnected).toBe(true);
  });

  it('handles job update messages', () => {
    renderHook(() => useETLMonitoring());

    const jobData = {
      jobId: 'test-job-1',
      status: 'running',
      progress: 50,
      currentStep: 'Processing',
      estimatedCompletion: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    act(() => {
      mockEventSource.simulateMessage({
        type: 'job_update',
        job: jobData,
      });
    });

    expect(mockUpdateJobStatus).toHaveBeenCalledWith('test-job-1', jobData);
  });

  it('handles job created messages', () => {
    renderHook(() => useETLMonitoring());

    const jobData = {
      jobId: 'test-job-2',
      status: 'pending',
      progress: 0,
      currentStep: 'Queued',
      estimatedCompletion: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    act(() => {
      mockEventSource.simulateMessage({
        type: 'job_created',
        job: jobData,
      });
    });

    expect(mockAddJob).toHaveBeenCalledWith(jobData);
  });

  it('handles job removed messages', () => {
    renderHook(() => useETLMonitoring());

    act(() => {
      mockEventSource.simulateMessage({
        type: 'job_removed',
        jobId: 'test-job-3',
      });
    });

    expect(mockRemoveJob).toHaveBeenCalledWith('test-job-3');
  });

  it('handles specific job events', () => {
    renderHook(() => useETLMonitoring());

    const jobData = {
      jobId: 'test-job-4',
      status: 'running',
      progress: 25,
      currentStep: 'Starting',
      estimatedCompletion: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Test job_started event
    act(() => {
      mockEventSource.simulateEvent('job_started', jobData);
    });

    expect(mockAddJob).toHaveBeenCalledWith(jobData);

    // Test job_progress event
    const progressUpdate = {
      jobId: 'test-job-4',
      progress: 75,
      currentStep: 'Almost done',
    };

    act(() => {
      mockEventSource.simulateEvent('job_progress', progressUpdate);
    });

    expect(mockUpdateJobStatus).toHaveBeenCalledWith('test-job-4', progressUpdate);

    // Test job_completed event
    const completedUpdate = {
      jobId: 'test-job-4',
      completedAt: new Date().toISOString(),
    };

    act(() => {
      mockEventSource.simulateEvent('job_completed', completedUpdate);
    });

    expect(mockUpdateJobStatus).toHaveBeenCalledWith('test-job-4', {
      ...completedUpdate,
      status: 'completed',
      progress: 100,
    });

    // Test job_failed event
    const failedUpdate = {
      jobId: 'test-job-4',
      errorMessage: 'Processing failed',
    };

    act(() => {
      mockEventSource.simulateEvent('job_failed', failedUpdate);
    });

    expect(mockUpdateJobStatus).toHaveBeenCalledWith('test-job-4', {
      ...failedUpdate,
      status: 'failed',
    });

    // Test job_cancelled event
    const cancelledUpdate = {
      jobId: 'test-job-4',
      cancelledAt: new Date().toISOString(),
    };

    act(() => {
      mockEventSource.simulateEvent('job_cancelled', cancelledUpdate);
    });

    expect(mockUpdateJobStatus).toHaveBeenCalledWith('test-job-4', {
      ...cancelledUpdate,
      status: 'cancelled',
    });
  });

  it('handles connection errors and reconnects', () => {
    const { result } = renderHook(() =>
      useETLMonitoring({
        reconnectInterval: 1000,
        maxReconnectAttempts: 3,
      })
    );

    // Simulate connection error
    act(() => {
      mockEventSource.simulateError();
    });

    expect(result.current.isConnected).toBe(false);
    expect(mockEventSource.close).toHaveBeenCalled();

    // Fast-forward time to trigger reconnection
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.reconnectAttempts).toBe(1);
    expect(mockTestsApi.createETLJobsEventSource).toHaveBeenCalledTimes(2);
  });

  it('stops reconnecting after max attempts', () => {
    renderHook(() =>
      useETLMonitoring({
        reconnectInterval: 1000,
        maxReconnectAttempts: 2,
      })
    );

    // Simulate multiple connection errors
    for (let i = 0; i < 3; i++) {
      act(() => {
        mockEventSource.simulateError();
        jest.advanceTimersByTime(1000);
      });
    }

    // Should not exceed max attempts
    expect(mockTestsApi.createETLJobsEventSource).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it('provides manual connect and disconnect methods', () => {
    const { result } = renderHook(() =>
      useETLMonitoring({ autoConnect: false })
    );

    // Manual connect
    act(() => {
      result.current.connect();
    });

    expect(mockTestsApi.createETLJobsEventSource).toHaveBeenCalled();

    // Manual disconnect
    act(() => {
      result.current.disconnect();
    });

    expect(mockEventSource.close).toHaveBeenCalled();
    expect(result.current.isConnected).toBe(false);
  });

  it('cleans up on unmount', () => {
    const { unmount } = renderHook(() => useETLMonitoring());

    unmount();

    expect(mockEventSource.close).toHaveBeenCalled();
  });

  it('handles malformed JSON messages gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    renderHook(() => useETLMonitoring());

    act(() => {
      if (mockEventSource.onmessage) {
        mockEventSource.onmessage(
          new MessageEvent('message', { data: 'invalid json' })
        );
      }
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to parse ETL job update:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});