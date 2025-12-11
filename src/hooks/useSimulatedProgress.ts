import { useState, useEffect } from 'react';

interface UseSimulatedProgressOptions {
  duration?: number; // Total duration in ms to reach 100%
  stepInterval?: number; // Interval in ms to increase 1%
  stepValue?: number; // Amount to increase per step (default 1)
}

export const useSimulatedProgress = (
  isLoading: boolean, 
  options: UseSimulatedProgressOptions = {}
) => {
  const [progress, setProgress] = useState(0);
  const { duration, stepInterval, stepValue = 1 } = options;

  useEffect(() => {
    if (!isLoading) {
      setProgress(0);
      return;
    }

    let intervalMs = 100;
    
    if (stepInterval) {
      intervalMs = stepInterval;
    } else if (duration) {
      // Calculate interval to reach 100% in duration
      // steps = 100 / stepValue
      // interval = duration / steps
      const steps = 100 / stepValue;
      intervalMs = duration / steps;
    }

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 99) return 99; // Cap at 99% until actually finished
        return Math.min(prev + stepValue, 99);
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isLoading, duration, stepInterval, stepValue]);

  return progress;
};
