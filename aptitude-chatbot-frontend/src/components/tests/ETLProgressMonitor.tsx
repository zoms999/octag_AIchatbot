'use client';

import React, { useEffect, useState } from 'react';
import { ProcessingJob } from '../../types';
import { useTestStore } from '../../lib/stores/test';
import { useETLMonitoring } from '../../hooks/useETLMonitoring';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Pause,
  Play,
  RotateCcw,
  X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useToast } from '../ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';

interface ETLProgressMonitorProps {
  className?: string;
}

export function ETLProgressMonitor({ className }: ETLProgressMonitorProps) {
  const {
    processingJobs,
    isLoadingJobs,
    jobsError,
    loadETLJobs,
    cancelJob,
    retryJob,
    clearErrors,
  } = useTestStore();

  const { isConnected, reconnectAttempts } = useETLMonitoring({
    autoConnect: true,
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
  });

  const { toast } = useToast();
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());

  // Load jobs on mount
  useEffect(() => {
    loadETLJobs();
  }, [loadETLJobs]);

  // Show error toast when jobs error occurs
  useEffect(() => {
    if (jobsError) {
      toast({
        title: 'ETL 작업 오류',
        description: jobsError,
        variant: 'destructive',
      });
      clearErrors();
    }
  }, [jobsError, toast, clearErrors]);

  const getJobStatusIcon = (status: ProcessingJob['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'running':
        return <Play className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <Pause className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getJobStatusBadge = (status: ProcessingJob['status']) => {
    const variants = {
      pending: 'secondary' as const,
      running: 'default' as const,
      completed: 'default' as const,
      failed: 'destructive' as const,
      cancelled: 'secondary' as const,
    };

    const labels = {
      pending: '대기중',
      running: '실행중',
      completed: '완료',
      failed: '실패',
      cancelled: '취소됨',
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

  const handleCancelJob = async (jobId: string) => {
    try {
      await cancelJob(jobId);
      toast({
        title: '작업 취소',
        description: 'ETL 작업이 취소되었습니다.',
      });
    } catch (error) {
      toast({
        title: '작업 취소 실패',
        description: '작업을 취소하는데 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      await retryJob(jobId);
      toast({
        title: '작업 재시도',
        description: 'ETL 작업을 다시 시작했습니다.',
      });
    } catch (error) {
      toast({
        title: '작업 재시도 실패',
        description: '작업을 재시도하는데 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const toggleJobExpansion = (jobId: string) => {
    const newExpanded = new Set(expandedJobs);
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId);
    } else {
      newExpanded.add(jobId);
    }
    setExpandedJobs(newExpanded);
  };

  const activeJobs = processingJobs.filter(
    (job) => job.status === 'pending' || job.status === 'running'
  );

  const completedJobs = processingJobs.filter(
    (job) =>
      job.status === 'completed' ||
      job.status === 'failed' ||
      job.status === 'cancelled'
  );

  if (isLoadingJobs) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 animate-spin" />
            ETL 작업 상태 로딩중...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Connection Status */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-sm text-gray-600">
                실시간 모니터링{' '}
                {isConnected ? '연결됨' : `연결 끊김 (재시도: ${reconnectAttempts})`}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadETLJobs}
              disabled={isLoadingJobs}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              새로고침
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-blue-500" />
              진행중인 작업 ({activeJobs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeJobs.map((job) => (
                <JobProgressCard
                  key={job.jobId}
                  job={job}
                  isExpanded={expandedJobs.has(job.jobId)}
                  onToggleExpansion={() => toggleJobExpansion(job.jobId)}
                  onCancel={() => handleCancelJob(job.jobId)}
                  showActions={true}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Jobs */}
      {completedJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              완료된 작업 ({completedJobs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedJobs.slice(0, 5).map((job) => (
                <JobProgressCard
                  key={job.jobId}
                  job={job}
                  isExpanded={expandedJobs.has(job.jobId)}
                  onToggleExpansion={() => toggleJobExpansion(job.jobId)}
                  onRetry={
                    job.status === 'failed'
                      ? () => handleRetryJob(job.jobId)
                      : undefined
                  }
                  showActions={job.status === 'failed'}
                />
              ))}
              {completedJobs.length > 5 && (
                <p className="text-sm text-gray-500 text-center">
                  {completedJobs.length - 5}개의 추가 작업이 있습니다.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Jobs */}
      {processingJobs.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="font-medium text-lg mb-2">진행중인 작업이 없습니다</h3>
              <p className="text-sm">
                테스트 재처리를 요청하면 여기에 진행 상황이 표시됩니다.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface JobProgressCardProps {
  job: ProcessingJob;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
  showActions?: boolean;
}

function JobProgressCard({
  job,
  isExpanded,
  onToggleExpansion,
  onCancel,
  onRetry,
  showActions = false,
}: JobProgressCardProps) {
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

  const getJobStatusIcon = (status: ProcessingJob['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'running':
        return <Play className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <Pause className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getJobStatusBadge = (status: ProcessingJob['status']) => {
    const variants = {
      pending: 'secondary' as const,
      running: 'default' as const,
      completed: 'default' as const,
      failed: 'destructive' as const,
      cancelled: 'secondary' as const,
    };

    const labels = {
      pending: '대기중',
      running: '실행중',
      completed: '완료',
      failed: '실패',
      cancelled: '취소됨',
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getJobStatusIcon(job.status)}
          <span className="font-medium">작업 ID: {job.jobId.slice(0, 8)}...</span>
          {getJobStatusBadge(job.status)}
        </div>
        <div className="flex items-center gap-2">
          {showActions && (
            <>
              {job.status === 'running' && onCancel && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <X className="h-4 w-4 mr-2" />
                      취소
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>작업 취소</AlertDialogTitle>
                      <AlertDialogDescription>
                        진행중인 ETL 작업을 취소하시겠습니까? 이 작업은 되돌릴 수
                        없습니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction onClick={onCancel}>
                        작업 취소
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {job.status === 'failed' && onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  재시도
                </Button>
              )}
            </>
          )}
          <Button variant="ghost" size="sm" onClick={onToggleExpansion}>
            {isExpanded ? '접기' : '자세히'}
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      {(job.status === 'running' || job.status === 'pending') && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{job.currentStep}</span>
            <span>{job.progress}%</span>
          </div>
          <Progress value={job.progress} className="h-2" />
          {job.estimatedCompletion && (
            <p className="text-xs text-gray-500">
              예상 완료: {formatDate(job.estimatedCompletion)}
            </p>
          )}
        </div>
      )}

      {/* Error Message */}
      {job.status === 'failed' && job.errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <div className="flex items-start gap-2">
            <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">오류 발생</p>
              <p className="text-sm text-red-700 mt-1">{job.errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t pt-3 space-y-2 text-sm text-gray-600">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">생성일:</span>{' '}
              {formatDate(job.createdAt)}
            </div>
            <div>
              <span className="font-medium">수정일:</span>{' '}
              {formatDate(job.updatedAt)}
            </div>
          </div>
          <div>
            <span className="font-medium">현재 단계:</span> {job.currentStep}
          </div>
          {job.estimatedCompletion && (
            <div>
              <span className="font-medium">예상 완료:</span>{' '}
              {formatDate(job.estimatedCompletion)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}