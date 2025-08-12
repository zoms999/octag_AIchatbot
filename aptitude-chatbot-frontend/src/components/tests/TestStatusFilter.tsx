'use client';

import React from 'react';
import { useTestStore } from '../../lib/stores/test';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CheckCircle, Clock, XCircle, List } from 'lucide-react';

type FilterStatus = 'all' | 'completed' | 'processing' | 'failed';

interface FilterOption {
  value: FilterStatus;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

export function TestStatusFilter() {
  const { filterStatus, setFilterStatus, tests } = useTestStore();

  // Calculate counts for each status
  const statusCounts = tests.reduce(
    (acc, test) => {
      acc[test.status] = (acc[test.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const filterOptions: FilterOption[] = [
    {
      value: 'all',
      label: '전체',
      icon: <List className="h-4 w-4" />,
      count: tests.length,
    },
    {
      value: 'completed',
      label: '완료',
      icon: <CheckCircle className="h-4 w-4" />,
      count: statusCounts.completed || 0,
    },
    {
      value: 'processing',
      label: '처리중',
      icon: <Clock className="h-4 w-4" />,
      count: statusCounts.processing || 0,
    },
    {
      value: 'failed',
      label: '실패',
      icon: <XCircle className="h-4 w-4" />,
      count: statusCounts.failed || 0,
    },
  ];

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mr-4">
        상태별 필터:
      </div>

      {filterOptions.map((option) => {
        const isActive = filterStatus === option.value;

        return (
          <Button
            key={option.value}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus(option.value)}
            className="flex items-center gap-2"
          >
            {option.icon}
            {option.label}
            {option.count !== undefined && (
              <Badge
                variant={isActive ? 'secondary' : 'outline'}
                className="ml-1 text-xs"
              >
                {option.count}
              </Badge>
            )}
          </Button>
        );
      })}
    </div>
  );
}
