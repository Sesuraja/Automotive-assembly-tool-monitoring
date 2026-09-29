import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const s = (status || 'UNKNOWN').toUpperCase();

  let bg = 'bg-gray-100 text-gray-700 border-gray-200';
  let dot = 'bg-gray-400';

  if (['HEALTHY', 'ACTIVE', 'CONNECTED', 'OK', 'COMPLETE', 'READY', 'PASS'].includes(s)) {
    bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dot = 'bg-emerald-500';
  } else if (['RUNNING', 'IN_PROGRESS', 'CONNECTING', 'NORMAL'].includes(s)) {
    bg = 'bg-blue-50 text-blue-700 border-blue-200';
    dot = 'bg-blue-500 animate-pulse';
  } else if (['WARNING', 'DEGRADED', 'MILD_DISTURBANCE', 'RUNNING_REDUCED'].includes(s)) {
    bg = 'bg-amber-50 text-amber-700 border-amber-200';
    dot = 'bg-amber-500';
  } else if (['FAULT', 'LATCHED_STOP', 'STOPPED', 'CRITICAL', 'STRONG_DISTURBANCE', 'FAIL', 'OFFLINE', 'DISCONNECTED'].includes(s)) {
    bg = 'bg-red-50 text-red-700 border-red-200';
    dot = 'bg-red-500';
  }

  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium border rounded-full ${bg} ${px}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {s.replace(/_/g, ' ')}
    </span>
  );
};
