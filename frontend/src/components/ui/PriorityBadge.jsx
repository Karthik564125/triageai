import React from 'react';
import { AlertTriangle, ArrowDown, ArrowUp, AlertOctagon } from 'lucide-react';

export const PriorityBadge = ({ priority, size = 'sm' }) => {
  const normalized = (priority || 'Medium').toLowerCase();

  const styles = {
    critical: 'bg-red-50 text-red-700 border-red-200 shadow-xs font-semibold ring-1 ring-red-500/20',
    high: 'bg-orange-50 text-orange-700 border-orange-200 font-medium',
    medium: 'bg-amber-50 text-amber-700 border-amber-200 font-medium',
    low: 'bg-slate-100 text-slate-700 border-slate-200 font-normal'
  };

  const icons = {
    critical: <AlertOctagon className="w-3.5 h-3.5 text-red-600 animate-pulse" />,
    high: <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />,
    medium: <ArrowUp className="w-3.5 h-3.5 text-amber-600" />,
    low: <ArrowDown className="w-3.5 h-3.5 text-slate-500" />
  };

  const sizes = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${styles[normalized] || styles.medium} ${sizes[size]}`}
    >
      {icons[normalized]}
      <span className="capitalize">{priority || 'Medium'}</span>
    </span>
  );
};
