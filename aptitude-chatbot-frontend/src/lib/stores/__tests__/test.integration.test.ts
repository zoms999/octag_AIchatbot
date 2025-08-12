/**
 * Integration test for TestStore
 * This file demonstrates how the TestStore should work in practice
 * Run this manually to verify the implementation
 */

import { useTestStore } from '../test';
import { TestResult, ProcessingJob } from '../../../types';

// Mock data for testing
const mockTestResult: TestResult = {
  id: 'test-1',
  userId: 'user-1',
  anpSeq: 12345,
  status: 'completed',
  completedAt: '2024-01-01T00:00:00Z',
  documents: [
    {
      id: 'doc-1',
      type: 'aptitude_summary',
      summary: 'Test aptitude summary',
      contentPreview: { score: 85 },
      createdAt: '2024-01-01T00:00:00Z',
    },
  ],
};

const mockProcessingJob: ProcessingJob = {
  jobId: 'job-1',
  status: 'running',
  progress: 50,
  currentStep: 'Processing documents',
  estimatedCompletion: '2024-01-01T01:00:00Z',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:30:00Z',
};

/**
 * Manual test function to verify store functionality
 * Call this function in a React component to test the store
 */
export const testStoreManually = () => {
  const store = useTestStore.getState();

  console.log('Testing TestStore...');

  // Test initial state
  console.log('Initial state:', {
    tests: store.tests,
    processingJobs: store.processingJobs,
    isLoadingTests: store.isLoadingTests,
    isLoadingJobs: store.isLoadingJobs,
  });

  // Test adding a job
  store.addJob(mockProcessingJob);
  console.log('After adding job:', store.processingJobs);

  // Test updating job status
  store.updateJobStatus('job-1', { progress: 75, currentStep: 'Finalizing' });
  console.log('After updating job:', store.processingJobs[0]);

  // Test UI actions
  store.setSelectedTest('test-1');
  console.log('Selected test ID:', store.selectedTestId);

  store.setFilterStatus('completed');
  console.log('Filter status:', store.filterStatus);

  // Test clearing errors
  store.clearErrors();
  console.log('Errors cleared');

  console.log('TestStore manual test completed successfully!');
};

/**
 * Test the selectors
 */
export const testSelectors = () => {
  const store = useTestStore.getState();

  // Add some test data
  store.addJob({ ...mockProcessingJob, status: 'running' });
  store.addJob({ ...mockProcessingJob, jobId: 'job-2', status: 'completed' });
  store.addJob({ ...mockProcessingJob, jobId: 'job-3', status: 'failed' });

  // Test selectors (these would normally be used in components)
  const activeJobs = store.processingJobs.filter(
    (job) => job.status === 'pending' || job.status === 'running'
  );

  const completedJobs = store.processingJobs.filter(
    (job) =>
      job.status === 'completed' ||
      job.status === 'failed' ||
      job.status === 'cancelled'
  );

  console.log('Active jobs:', activeJobs);
  console.log('Completed jobs:', completedJobs);
};

// Export for use in components
export { mockTestResult, mockProcessingJob };
