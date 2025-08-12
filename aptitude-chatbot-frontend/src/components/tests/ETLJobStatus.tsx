'use client';

import React from 'react';
import { ProcessingJob } from '../../types';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
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

interface ETLJobStatusProps {
  job: ProcessingJob;
  onCancel?: (jobId: string) => void;
  onRetry?: (jobId: string) => void;
  compact?: boolean;
  showActions?: boolean;
}

export function ETLJobStatus({
  job,
  onCancel,
  onRetry,
  compact = false,
  showActions = true,
}: ETLJobStatusProps) {
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

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
        {getJobStatusIcon(job.status)}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">
              {job.currentStep}
            </span>
            {getJobStatusBadge(job.status)}
          </div>
          {(job.status === 'running' || job.status === 'pending') && (
            <div className="mt-1">
              <Progress value={job.progress} className="h-1" />
            </div>
          )}
        </div>
        {showActions && (
          <div className="flex items-center gap-1">
            {job.status === 'running' && onCancel && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <X className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>작업 취소</AlertDialogTitle>
                    <AlertDialogDescription>
                      진행중인 ETL 작업을 취소하시겠습니까?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onCancel(job.jobId)}>
                      작업 취소
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {job.status === 'failed' && onRetry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRetry(job.jobId)}
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getJobStatusIcon(job.status)}
          <span className="font-medium">
            작업 ID: {job.jobId.slice(0, 8)}...
          </span>
          {getJobStatusBadge(job.status)}
        </div>
        {showActions && (
          <div className="flex items-center gap-2">
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
                    <AlertDialogAction onClick={() => onCancel(job.jobId)}>
                      작업 취소
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {job.status === 'failed' && onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRetry(job.jobId)}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                재시도
              </Button>
            )}
          </div>
        )}
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

      {/* Job Details */}
      <div className="text-sm text-gray-600 space-y-1">
        <div className="flex justify-between">
          <span>생성일:</span>
          <span>{formatDate(job.createdAt)}</span>
        </div>
        <div className="flex justify-between">
          <span>수정일:</span>
          <span>{formatDate(job.updatedAt)}</span>
        </div>
        {job.estimatedCompletion && (
          <div className="flex justify-between">
            <span>예상 완료:</span>
            <span>{formatDate(job.estimatedCompletion)}</span>
          </div>
        )}
      </div>
    </div>
  );
}