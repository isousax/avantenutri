import React from 'react';

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', lines = 1 }) => {
  if (lines <= 1) {
    return <div className={`animate-pulse rounded bg-gray-200 dark:bg-gray-700 h-4 ${className}`} />;
  }
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="animate-pulse rounded bg-gray-200 dark:bg-gray-700 h-4"/>
      ))}
    </div>
  );
};

export default Skeleton;
