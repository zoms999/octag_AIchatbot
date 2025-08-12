import { useTestStore } from '../test';
import { testsApi } from '../../api/tests';
import { TestResult, ProcessingJob, ETLJobResponse } from '../../../types';

// Mock the API service
jest.mock('../../api/tests', () => ({
  testsApi: {
    getTestResults: jest.fn(),
    getTestResult: jest.fn(),
    requestETLProcessing: jest.fn(),
    getETLJobs: jest.fn(),
    getETLJobStatus: jest.fn(),
    cancelETLJob: jest.fn(),
    retryETLJob: jest.fn(),
    deleteTestResult: jest.fn(),
  },
}));

const mockTestsApi = testsApi as unknown;

describe('TestStore', () => {
  beforeEach(() => {
    // Reset store state
    useTestStore.setState({
      tests: [],
      currentTest: null,
      isLoadingTests: false,
      testsError: null,
      processingJobs: [],
      isLoadingJobs: false,
      jobsError: null,
      selectedTestId: null,
      filterStatus: 'all',
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('loadTests', () => {
    it('should load tests successfully', async () => {
      const mockTests: TestResult[] = [
        {
          id: '1',
          userId: 'user1',
          anpSeq: 123,
          status: 'completed',
          completedAt: '2024-01-01T00:00:00Z',
          documents: [],
        },
        {
          id: '2',
          userId: 'user1',
          anpSeq: 124,
          status: 'processing',
          completedAt: '2024-01-02T00:00:00Z',
          documents: [],
        },
      ];

      mockTestsApi.getTestResults.mockResolvedValue({
        success: true,
        data: mockTests,
      });

      const { loadTests } = useTestStore.getState();
      await loadTests();

      const state = useTestStore.getState();
      expect(state.tests).toEqual(mockTests);
      expect(state.isLoadingTests).toBe(false);
      expect(state.testsError).toBeNull();
    });

    it('should handle load tests error', async () => {
      const errorMessage = 'Failed to load tests';
      mockTestsApi.getTestResults.mockResolvedValue({
        success: false,
        error: { message: errorMessage },
      });

      const { loadTests } = useTestStore.getState();
      await loadTests();

      const state = useTestStore.getState();
      expect(state.tests).toEqual([]);
      expect(state.isLoadingTests).toBe(false);
      expect(state.testsError).toBe(errorMessage);
    });

    it('should handle network error', async () => {
      const error = new Error('Network error');
      mockTestsApi.getTestResults.mockRejectedValue(error);

      const { loadTests } = useTestStore.getState();
      await loadTests();

      const state = useTestStore.getState();
      expect(state.tests).toEqual([]);
      expect(state.isLoadingTests).toBe(false);
      expect(state.testsError).toBe('Network error');
    });
  });

  describe('reprocessTest', () => {
    it('should start reprocessing successfully', async () => {
      const mockResponse: ETLJobResponse = {
        jobId: 'job123',
        status: 'pending',
        message: 'Job started',
      };

      mockTestsApi.requestETLProcessing.mockResolvedValue({
        success: true,
        data: mockResponse,
      });

      mockTestsApi.getETLJobs.mockResolvedValue({
        success: true,
        data: [],
      });

      const { reprocessTest } = useTestStore.getState();
      const jobId = await reprocessTest('user1', 123, true);

      expect(jobId).toBe('job123');
      expect(mockTestsApi.requestETLProcessing).toHaveBeenCalledWith({
        userId: 'user1',
        anpSeq: 123,
        forceReprocess: true,
      });
    });

    it('should handle reprocessing error', async () => {
      const errorMessage = 'Failed to start reprocessing';
      mockTestsApi.requestETLProcessing.mockResolvedValue({
        success: false,
        error: { message: errorMessage },
      });

      const { reprocessTest } = useTestStore.getState();
      const jobId = await reprocessTest('user1', 123);

      expect(jobId).toBeNull();
      const state = useTestStore.getState();
      expect(state.jobsError).toBe(errorMessage);
    });
  });

  describe('loadETLJobs', () => {
    it('should load ETL jobs successfully', async () => {
      const mockJobs: ProcessingJob[] = [
        {
          jobId: 'job1',
          status: 'running',
          progress: 50,
          currentStep: 'Processing documents',
          estimatedCompletion: '2024-01-01T01:00:00Z',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:30:00Z',
        },
      ];

      mockTestsApi.getETLJobs.mockResolvedValue({
        success: true,
        data: mockJobs,
      });

      const { loadETLJobs } = useTestStore.getState();
      await loadETLJobs();

      const state = useTestStore.getState();
      expect(state.processingJobs).toEqual(mockJobs);
      expect(state.isLoadingJobs).toBe(false);
      expect(state.jobsError).toBeNull();
    });
  });

  describe('cancelJob', () => {
    it('should cancel job successfully', async () => {
      // Set up initial job
      const initialJob: ProcessingJob = {
        jobId: 'job1',
        status: 'running',
        progress: 50,
        currentStep: 'Processing',
        estimatedCompletion: '2024-01-01T01:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:30:00Z',
      };

      useTestStore.setState({ processingJobs: [initialJob] });

      mockTestsApi.cancelETLJob.mockResolvedValue({
        success: true,
        data: { message: 'Job cancelled' },
      });

      const { cancelJob } = useTestStore.getState();
      await cancelJob('job1');

      const state = useTestStore.getState();
      expect(state.processingJobs[0].status).toBe('cancelled');
    });
  });

  describe('UI actions', () => {
    it('should set selected test', () => {
      const { setSelectedTest } = useTestStore.getState();
      setSelectedTest('test123');

      const state = useTestStore.getState();
      expect(state.selectedTestId).toBe('test123');
    });

    it('should set filter status', () => {
      const { setFilterStatus } = useTestStore.getState();
      setFilterStatus('completed');

      const state = useTestStore.getState();
      expect(state.filterStatus).toBe('completed');
    });

    it('should clear errors', () => {
      useTestStore.setState({
        testsError: 'Test error',
        jobsError: 'Job error',
      });

      const { clearErrors } = useTestStore.getState();
      clearErrors();

      const state = useTestStore.getState();
      expect(state.testsError).toBeNull();
      expect(state.jobsError).toBeNull();
    });
  });

  describe('Job status updates', () => {
    it('should update job status', () => {
      const initialJob: ProcessingJob = {
        jobId: 'job1',
        status: 'running',
        progress: 50,
        currentStep: 'Processing',
        estimatedCompletion: '2024-01-01T01:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:30:00Z',
      };

      useTestStore.setState({ processingJobs: [initialJob] });

      const { updateJobStatus } = useTestStore.getState();
      updateJobStatus('job1', { progress: 75, currentStep: 'Finalizing' });

      const state = useTestStore.getState();
      expect(state.processingJobs[0].progress).toBe(75);
      expect(state.processingJobs[0].currentStep).toBe('Finalizing');
    });

    it('should add new job', () => {
      const newJob: ProcessingJob = {
        jobId: 'job2',
        status: 'pending',
        progress: 0,
        currentStep: 'Starting',
        estimatedCompletion: '2024-01-01T01:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const { addJob } = useTestStore.getState();
      addJob(newJob);

      const state = useTestStore.getState();
      expect(state.processingJobs).toContain(newJob);
    });

    it('should remove job', () => {
      const job: ProcessingJob = {
        jobId: 'job1',
        status: 'completed',
        progress: 100,
        currentStep: 'Done',
        estimatedCompletion: '2024-01-01T01:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T01:00:00Z',
      };

      useTestStore.setState({ processingJobs: [job] });

      const { removeJob } = useTestStore.getState();
      removeJob('job1');

      const state = useTestStore.getState();
      expect(state.processingJobs).toHaveLength(0);
    });
  });
});
