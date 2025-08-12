'use client';

import React, { useEffect, useState } from 'react';
import { useTestStore } from '../../lib/stores/test';
import { TestResult } from '../../types';
import { TestResultsList } from './TestResultsList';
import { TestStatusFilter } from './TestStatusFilter';
import { TestDetailModal } from './TestDetailModal';
import { ETLProgressMonitor } from './ETLProgressMonitor';
import { Button } from '../ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';
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
} from '../ui/alert-dialog';

export function TestsLayout() {
  const {
    loadTests,
    reprocessTest,
    deleteTest,
    clearErrors,
    isLoadingTests,
    testsError,
    setSelectedTest,
    currentTest,
    cancelJob,
    retryJob,
  } = useTestStore();

  const { toast } = useToast();

  const [selectedTest, setSelectedTestLocal] = useState<TestResult | null>(
    null
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<TestResult | null>(null);
  const [testToReprocess, setTestToReprocess] = useState<TestResult | null>(
    null
  );
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load tests on component mount
  useEffect(() => {
    loadTests();
  }, [loadTests]);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      clearErrors();
    };
  }, [clearErrors]);

  const handleRefresh = async () => {
    await loadTests();
    toast({
      title: '새로고침 완료',
      description: '테스트 결과 목록이 업데이트되었습니다.',
    });
  };

  const handleTestSelect = (test: TestResult) => {
    setSelectedTestLocal(test);
    setSelectedTest(test.id);
    setIsDetailModalOpen(true);
  };

  const handleDetailModalClose = () => {
    setIsDetailModalOpen(false);
    setSelectedTestLocal(null);
    setSelectedTest(null);
  };

  const handleReprocessRequest = (test: TestResult) => {
    setTestToReprocess(test);
  };

  const handleReprocessConfirm = async () => {
    if (!testToReprocess) return;

    setIsReprocessing(true);
    try {
      const jobId = await reprocessTest(
        testToReprocess.userId,
        testToReprocess.anpSeq,
        true
      );

      if (jobId) {
        toast({
          title: '재처리 시작',
          description: `테스트 #${testToReprocess.anpSeq}의 재처리가 시작되었습니다.`,
        });
      } else {
        toast({
          title: '재처리 실패',
          description: '테스트 재처리를 시작할 수 없습니다.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '재처리 실패',
        description:
          error instanceof Error
            ? error.message
            : '알 수 없는 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsReprocessing(false);
      setTestToReprocess(null);
    }
  };

  const handleDeleteRequest = (test: TestResult) => {
    setTestToDelete(test);
  };

  const handleDeleteConfirm = async () => {
    if (!testToDelete) return;

    setIsDeleting(true);
    try {
      await deleteTest(testToDelete.id);
      toast({
        title: '삭제 완료',
        description: `테스트 #${testToDelete.anpSeq}가 삭제되었습니다.`,
      });
    } catch (error) {
      toast({
        title: '삭제 실패',
        description:
          error instanceof Error
            ? error.message
            : '알 수 없는 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setTestToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">테스트 결과</h1>
          <p className="text-gray-600 mt-1">
            완료된 적성검사 결과를 확인하고 관리할 수 있습니다.
          </p>
        </div>

        <Button
          onClick={handleRefresh}
          disabled={isLoadingTests}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${isLoadingTests ? 'animate-spin' : ''}`}
          />
          새로고침
        </Button>
      </div>

      {/* 에러 표시 */}
      {testsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">오류가 발생했습니다</span>
          </div>
          <p className="text-red-700 mt-1 text-sm">{testsError}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={clearErrors}
            className="mt-2"
          >
            오류 메시지 닫기
          </Button>
        </div>
      )}

      {/* ETL 진행률 모니터링 */}
      <ETLProgressMonitor />

      {/* 필터 */}
      <TestStatusFilter />

      {/* 테스트 결과 목록 */}
      <TestResultsList
        onTestSelect={handleTestSelect}
        onReprocess={handleReprocessRequest}
        onDelete={handleDeleteRequest}
      />

      {/* 상세 정보 모달 */}
      <TestDetailModal
        test={selectedTest || currentTest}
        isOpen={isDetailModalOpen}
        onClose={handleDetailModalClose}
        onReprocess={handleReprocessRequest}
      />

      {/* 재처리 확인 다이얼로그 */}
      <AlertDialog
        open={!!testToReprocess}
        onOpenChange={() => setTestToReprocess(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>테스트 재처리 확인</AlertDialogTitle>
            <AlertDialogDescription>
              테스트 #{testToReprocess?.anpSeq}를 재처리하시겠습니까?
              <br />
              기존 결과는 새로운 결과로 대체됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReprocessing}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReprocessConfirm}
              disabled={isReprocessing}
            >
              {isReprocessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  처리중...
                </>
              ) : (
                '재처리'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={!!testToDelete}
        onOpenChange={() => setTestToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>테스트 삭제 확인</AlertDialogTitle>
            <AlertDialogDescription>
              테스트 #{testToDelete?.anpSeq}를 삭제하시겠습니까?
              <br />
              <span className="text-red-600 font-medium">
                이 작업은 되돌릴 수 없습니다.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  삭제중...
                </>
              ) : (
                '삭제'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
