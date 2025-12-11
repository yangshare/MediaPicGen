import React from 'react';

interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  trackColor?: string;
  indicatorColor?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 24,
  strokeWidth = 3,
  className = '',
  trackColor = 'text-blue-200',
  indicatorColor = 'text-blue-600',
}) => {
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90 w-full h-full"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Track */}
        <circle
          className={`stroke-current ${trackColor}`}
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={center}
          cy={center}
        />
        {/* Indicator */}
        <circle
          className={`stroke-current transition-all duration-300 ease-linear ${indicatorColor}`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={center}
          cy={center}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
    </div>
  );
};
