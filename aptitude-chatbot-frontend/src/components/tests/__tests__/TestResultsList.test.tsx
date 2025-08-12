import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestResultsList } from '../TestResultsList';
import { useTestStore, useFilteredTests } from '../../../lib/stores/test';
import { TestResult } from '../../../types';

// Mock the store
jest.mock('../../../lib/stores/test');
const mockUseTestStore = useTestStore as jest.MockedFunction<
  typeof useTestStore
>;
const mockUseFilteredTests = useFilteredTests as jest.MockedFunction<
  typeof useFilteredTests
>;

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2시간 전'),
}));

// Mock date-fns/locale
jest.mock('date-fns/locale', () => ({
  ko: {},
}));

const mockTestResult: TestResult = {
  id: 'test-1',
  userId: 'user-1',
  anpSeq: 12345,
  status: 'completed',
  completedAt: '2024-01-15T10:00:00Z',
  documents: [
    {
      id: 'doc-1',
      type: 'aptitude_summary',
      summary: '적성 요약 문서',
      contentPreview: { score: 85 },
      createdAt: '2024-01-15T10:00:00Z',
    },
  ],
};

describe('TestResultsList', () => {
  beforeEach(() => {
    mockUseTestStore.mockReturnValue({
      isLoadingTests: false,
      testsError: null,
    } as any);

    mockUseFilteredTests.mockReturnValue([mockTestResult]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders test results correctly', () => {
    render(<TestResultsList />);

    expect(screen.getByText('적성검사 결과 #12345')).toBeInTheDocument();
    expect(screen.getByText('완료')).toBeInTheDocument();
    expect(screen.getByText('문서 수: 1개')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseTestStore.mockReturnValue({
      isLoadingTests: true,
      testsError: null,
    } as any);

    render(<TestResultsList />);

    expect(screen.getAllByRole('generic')).toHaveLength(3); // 3 skeleton cards
  });

  it('shows error state', () => {
    mockUseTestStore.mockReturnValue({
      isLoadingTests: false,
      testsError: '테스트 로드 실패',
    } as any);

    render(<TestResultsList />);

    expect(
      screen.getByText('테스트 결과를 불러오는데 실패했습니다')
    ).toBeInTheDocument();
    expect(screen.getByText('테스트 로드 실패')).toBeInTheDocument();
  });

  it('shows empty state when no tests', () => {
    mockUseFilteredTests.mockReturnValue([]);

    render(<TestResultsList />);

    expect(screen.getByText('테스트 결과가 없습니다')).toBeInTheDocument();
  });

  it('calls onTestSelect when view button is clicked', () => {
    const mockOnTestSelect = jest.fn();
    render(<TestResultsList onTestSelect={mockOnTestSelect} />);

    const viewButton = screen.getByText('상세 보기');
    fireEvent.click(viewButton);

    expect(mockOnTestSelect).toHaveBeenCalledWith(mockTestResult);
  });

  it('calls onReprocess when reprocess button is clicked', () => {
    const mockOnReprocess = jest.fn();
    render(<TestResultsList onReprocess={mockOnReprocess} />);

    const reprocessButton = screen.getByText('재처리');
    fireEvent.click(reprocessButton);

    expect(mockOnReprocess).toHaveBeenCalledWith(mockTestResult);
  });

  it('does not show reprocess button for processing tests', () => {
    const processingTest = { ...mockTestResult, status: 'processing' as const };
    mockUseFilteredTests.mockReturnValue([processingTest]);

    render(<TestResultsList />);

    expect(screen.queryByText('재처리')).not.toBeInTheDocument();
  });
});
