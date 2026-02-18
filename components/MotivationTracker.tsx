import React from 'react';
import { FireIcon } from './Icons';

interface MotivationTrackerProps {
  streak: number;
}

const MotivationTracker: React.FC<MotivationTrackerProps> = ({ streak }) => {
  return (
    <div className="flex items-center gap-2 bg-orange-100 dark:bg-orange-800/50 text-orange-600 dark:text-orange-300 font-semibold px-4 py-2 rounded-full shadow-inner">
      <FireIcon className="w-6 h-6 text-orange-500" />
      <span>{streak} Day Streak</span>
    </div>
  );
};

export default MotivationTracker;
