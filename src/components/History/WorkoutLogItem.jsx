import React from 'react';
import { dayNames } from '../../constants/days';
import { Calendar } from 'react-feather';

const WorkoutLogItem = ({ log }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-lg">
            Allenamento {dayNames[log.day_of_week - 1]}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
            <Calendar size={14} />
            <span>{formatDate(log.completed_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutLogItem; 