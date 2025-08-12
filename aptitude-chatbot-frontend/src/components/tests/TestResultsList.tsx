'use client';

import React from 'react';
import { useTestStore, useFilteredTests, useActiveJobs } from '../../lib/stores/test';
import { TestResult } from '../../types';
import { ETLJobStatus } from './ETLJobStatus';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  Eye,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface TestResultsListProps {
  onTestSelect?: (test: TestResult) => void;
  onReprocess?: (test: TestResult) => void;
  onDelete?: (test: TestResult) => void;
}

export function TestResultsList({
  onTestSelect,
  onReprocess,
  onDelete,
}: TestResultsListProps) {
  const filteredTests = useFilteredTests();
  const activeJobs = useActiveJobs();
  const { isLoadingTests, testsError, cancelJob, retryJob } = useTestStore();

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      completed: 'default' as const,
      processing: 'secondary' as const,
      failed: 'destructive' as const,
    };

    const labels = {
      completed: '완료',
      processing: '처리중',
      failed: '실패',
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ko,
      });
    } catch {
      return dateString;
    }
  };

  const handleTestAction = (
    action: 'view' | 'reprocess' | 'delete',
    test: TestResult
  ) => {
    switch (action) {
      case 'view':
        onTestSelect?.(test);
        break;
      case 'reprocess':
        onReprocess?.(test);
        break;
      case 'delete':
        onDelete?.(test);
        break;
    }
  };

  const getActiveJobForTest = (test: TestResult) => {
    return activeJobs.find(
      (job) => 
        job.jobId.includes(test.userId) || 
        job.jobId.includes(test.anpSeq.toString())
    );
  };

  if (isLoadingTests) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (testsError) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <XCircle className="h-8 w-8 mx-auto mb-2" />
            <p className="font-medium">테스트 결과를 불러오는데 실패했습니다</p>
            <p className="text-sm text-gray-500 mt-1">{testsError}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filteredTests.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="font-medium text-lg mb-2">테스트 결과가 없습니다</h3>
            <p className="text-sm">
              아직 완료된 적성검사가 없습니다. 적성검사를 완료하면 여기에 결과가
              표시됩니다.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {filteredTests.map((test) => (
        <Card key={test.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                {getStatusIcon(test.status)}
                적성검사 결과 #{test.anpSeq}
              </CardTitle>
              <div className="flex items-center gap-2">
                {getStatusBadge(test.status)}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleTestAction('view', test)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      상세 보기
                    </DropdownMenuItem>
                    {test.status !== 'processing' && (
                      <DropdownMenuItem
                        onClick={() => handleTestAction('reprocess', test)}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        재처리
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => handleTestAction('delete', test)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>완료일: {formatDate(test.completedAt)}</span>
                <span>문서 수: {test.documents.length}개</span>
              </div>

              {/* Active ETL Job Status */}
              {(() => {
                const activeJob = getActiveJobForTest(test);
                return activeJob ? (
                  <ETLJobStatus
                    job={activeJob}
                    onCancel={cancelJob}
                    onRetry={retryJob}
                    compact={true}
                    showActions={true}
                  />
                ) : null;
              })()}

              {test.documents.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {test.documents.slice(0, 3).map((doc) => (
                    <Badge key={doc.id} variant="outline" className="text-xs">
                      {doc.type.replace('_', ' ')}
                    </Badge>
                  ))}
                  {test.documents.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{test.documents.length - 3}개 더
                    </Badge>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestAction('view', test)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  상세 보기
                </Button>

                {test.status !== 'processing' && !getActiveJobForTest(test) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTestAction('reprocess', test)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    재처리
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
