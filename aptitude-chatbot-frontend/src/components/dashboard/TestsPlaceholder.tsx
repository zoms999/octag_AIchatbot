'use client';

import { FileText, BarChart3 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function TestsPlaceholder() {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            테스트 결과 관리
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardTitle>
          <CardDescription>
            적성검사 결과를 확인하고 진행 상황을 모니터링하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          <p>테스트 결과 기능은 곧 구현될 예정입니다.</p>
          <p className="mt-2">
            여기서 적성검사 결과를 조회하고 데이터 처리 상태를 실시간으로 확인할
            수 있습니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
