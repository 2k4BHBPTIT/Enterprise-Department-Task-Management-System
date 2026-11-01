import React from 'react';
import { TaskPriority } from '../../types';

interface PriorityBadgeProps {
  priority: TaskPriority;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  switch (priority) {
    case 'URGENT':
    case 'HIGH':
      return <span className="text-xs font-semibold text-rose-600">Cao</span>;
    case 'MEDIUM':
      return <span className="text-xs font-semibold text-amber-600">Trung bình</span>;
    case 'LOW':
    default:
      return <span className="text-xs font-semibold text-slate-500">Thấp</span>;
  }
};
