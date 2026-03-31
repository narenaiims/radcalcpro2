import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
  );
};

export const CalculatorSkeleton: React.FC = () => {
  return (
    <div className="p-4 space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <div className="lg:col-span-8">
          <Skeleton className="h-[500px] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
};

export const ListSkeleton: React.FC = () => {
  return (
    <div className="p-4 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-full md:w-64" />
      </div>
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
};

export const PageSkeleton: React.FC<{ type?: 'default' | 'calculator' | 'list' }> = ({ type = 'default' }) => {
  if (type === 'calculator') return <CalculatorSkeleton />;
  if (type === 'list') return <ListSkeleton />;

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
};
