import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestStatusFilter } from '../TestStatusFilter';
import { useTestStore } from '../../../lib/stores/test';
import { TestResult } from '../../../types';

// Mock the store
jest.mock('../../../lib/stores/test');
const mockUseTestStore = useTestStore as jest.MockedFunction<
  typeof useTestStore
>;

const mockTests: TestResult[] = [
  {
    id: 'test-1',
    userId: 'user-1',
    anpSeq: 1,
    status: 'completed',
    completedAt: '2024-01-15T10:00:00Z',
    documents: [],
  },
  {
    id: 'test-2',
    userId: 'user-1',
    anpSeq: 2,
    status: 'processing',
    completedAt: '2024-01-15T11:00:00Z',
    documents: [],
  },
  {
    id: 'test-3',
    userId: 'user-1',
    anpSeq: 3,
    status: 'failed',
    completedAt: '2024-01-15T12:00:00Z',
    documents: [],
  },
];

describe('TestStatusFilter', () => {
  const mockSetFilterStatus = jest.fn();

  beforeEach(() => {
    mockUseTestStore.mockReturnValue({
      filterStatus: 'all',
      setFilterStatus: mockSetFilterStatus,
      tests: mockTests,
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders all filter options with correct counts', () => {
    render(<TestStatusFilter />);

    expect(screen.getByText('전체')).toBeInTheDocument();
    expect(screen.getByText('완료')).toBeInTheDocument();
    expect(screen.getByText('처리중')).toBeInTheDocument();
    expect(screen.getByText('실패')).toBeInTheDocument();

    // Check counts
    expect(screen.getByText('3')).toBeInTheDocument(); // Total count
    expect(screen.getByText('1')).toBeInTheDocument(); // Completed, processing, failed counts
  });

  it('highlights active filter', () => {
    mockUseTestStore.mockReturnValue({
      filterStatus: 'completed',
      setFilterStatus: mockSetFilterStatus,
      tests: mockTests,
    } as any);

    render(<TestStatusFilter />);

    const completedButton = screen.getByRole('button', { name: /완료/ });
    expect(completedButton).toHaveClass('bg-primary'); // Active button styling
  });

  it('calls setFilterStatus when filter is clicked', () => {
    render(<TestStatusFilter />);

    const processingButton = screen.getByRole('button', { name: /처리중/ });
    fireEvent.click(processingButton);

    expect(mockSetFilterStatus).toHaveBeenCalledWith('processing');
  });

  it('shows zero counts for empty status', () => {
    const emptyTests: TestResult[] = [];
    mockUseTestStore.mockReturnValue({
      filterStatus: 'all',
      setFilterStatus: mockSetFilterStatus,
      tests: emptyTests,
    } as any);

    render(<TestStatusFilter />);

    expect(screen.getByText('0')).toBeInTheDocument(); // Total count should be 0
  });
});
