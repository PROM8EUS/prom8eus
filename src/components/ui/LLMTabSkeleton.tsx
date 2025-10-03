/**
 * LLMTabSkeleton Component
 * Skeleton loading states for the LLMTab
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface LLMTabSkeletonProps {
  count?: number;
  compact?: boolean;
  className?: string;
}

const PromptCardSkeleton = ({ compact = true }: { compact?: boolean }) => (
  <Card className={cn(
    "animate-pulse",
    compact ? "h-64" : "h-80"
  )}>
    <CardContent className="p-4">
      <div className="space-y-3">
        {/* Header skeleton */}
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="flex gap-2">
              <div className="h-5 w-16 bg-gray-200 rounded"></div>
              <div className="h-5 w-20 bg-gray-200 rounded"></div>
              <div className="h-5 w-14 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="h-6 w-16 bg-gray-200 rounded"></div>
        </div>
        
        {/* Code block skeleton */}
        <div className="bg-gray-900 rounded-lg p-3 space-y-2">
          <div className="h-3 bg-gray-700 rounded"></div>
          <div className="h-3 bg-gray-700 rounded w-5/6"></div>
          <div className="h-3 bg-gray-700 rounded w-4/5"></div>
          <div className="h-3 bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-700 rounded w-5/6"></div>
        </div>
        
        {/* Tags skeleton */}
        <div className="flex flex-wrap gap-1">
          <div className="h-5 w-16 bg-gray-200 rounded"></div>
          <div className="h-5 w-20 bg-gray-200 rounded"></div>
          <div className="h-5 w-14 bg-gray-200 rounded"></div>
        </div>
        
        {/* Stats skeleton */}
        <div className="flex gap-4">
          <div className="h-3 w-16 bg-gray-200 rounded"></div>
          <div className="h-3 w-12 bg-gray-200 rounded"></div>
          <div className="h-3 w-10 bg-gray-200 rounded"></div>
        </div>
        
        {/* Actions skeleton */}
        <div className="flex gap-2 pt-2">
          <div className="h-8 w-20 bg-gray-200 rounded"></div>
          <div className="h-8 w-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const SearchBarSkeleton = () => (
  <div className="animate-pulse">
    <div className="flex gap-3 mb-4">
      <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
      <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
      <div className="h-10 w-20 bg-gray-200 rounded-lg"></div>
    </div>
  </div>
);

const FilterBarSkeleton = () => (
  <div className="animate-pulse mb-6">
    <div className="flex gap-2">
      <div className="h-8 w-20 bg-gray-200 rounded"></div>
      <div className="h-8 w-24 bg-gray-200 rounded"></div>
      <div className="h-8 w-16 bg-gray-200 rounded"></div>
      <div className="h-8 w-28 bg-gray-200 rounded"></div>
      <div className="h-8 w-32 bg-gray-200 rounded"></div>
    </div>
  </div>
);

const StatsBarSkeleton = () => (
  <div className="animate-pulse mb-6">
    <div className="flex items-center justify-between">
      <div className="flex gap-6">
        <div className="h-4 w-20 bg-gray-200 rounded"></div>
        <div className="h-4 w-16 bg-gray-200 rounded"></div>
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
        <div className="h-4 w-18 bg-gray-200 rounded"></div>
      </div>
      <div className="h-6 w-32 bg-gray-200 rounded"></div>
    </div>
  </div>
);

export const LLMTabSkeleton: React.FC<LLMTabSkeletonProps> = ({
  count = 6,
  compact = true,
  className
}) => {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Search and filter skeleton */}
      <SearchBarSkeleton />
      <FilterBarSkeleton />
      <StatsBarSkeleton />
      
      {/* Prompt cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, index) => (
          <PromptCardSkeleton 
            key={index} 
            compact={compact}
          />
        ))}
      </div>
      
      {/* Load more skeleton */}
      <div className="flex justify-center pt-4">
        <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
    </div>
  );
};

// Individual skeleton components for different states
export const EmptyStateSkeleton = () => (
  <div className="animate-pulse">
    <div className="text-center py-12">
      <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
      <div className="h-6 w-48 bg-gray-200 rounded mx-auto mb-2"></div>
      <div className="h-4 w-64 bg-gray-200 rounded mx-auto mb-4"></div>
      <div className="h-10 w-32 bg-gray-200 rounded mx-auto"></div>
    </div>
  </div>
);

export const ErrorStateSkeleton = () => (
  <div className="animate-pulse">
    <div className="text-center py-12">
      <div className="h-16 w-16 bg-red-200 rounded-full mx-auto mb-4"></div>
      <div className="h-6 w-40 bg-gray-200 rounded mx-auto mb-2"></div>
      <div className="h-4 w-56 bg-gray-200 rounded mx-auto mb-4"></div>
      <div className="h-10 w-28 bg-gray-200 rounded mx-auto"></div>
    </div>
  </div>
);

export const LoadingStateSkeleton = () => (
  <div className="animate-pulse">
    <div className="text-center py-12">
      <div className="h-16 w-16 bg-primary/20 rounded-full mx-auto mb-4 animate-spin"></div>
      <div className="h-6 w-32 bg-gray-200 rounded mx-auto mb-2"></div>
      <div className="h-4 w-48 bg-gray-200 rounded mx-auto"></div>
    </div>
  </div>
);

export default LLMTabSkeleton;
