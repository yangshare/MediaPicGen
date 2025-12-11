import React from 'react';

interface LinearProgressProps {
  progress: number;
  height?: number;
  className?: string;
  trackClassName?: string;
  indicatorClassName?: string;
}

export const LinearProgress: React.FC<LinearProgressProps> = ({
  progress,
  height = 4,
  className = '',
  trackClassName = 'bg-gray-200',
  indicatorClassName = 'bg-blue-600',
}) => {
  return (
    <div 
      className={`w-full overflow-hidden rounded-full ${trackClassName} ${className}`}
      style={{ height }}
    >
      <div 
        className={`h-full transition-all duration-300 ease-linear rounded-full ${indicatorClassName}`}
        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
      />
    </div>
  );
};
