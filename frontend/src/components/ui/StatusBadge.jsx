import React from 'react';

export const StatusBadge = ({ status, size = 'sm' }) => {
  const norm = (status || 'Open').toLowerCase();

  const config = {
    open: {
      style: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-500'
    },
    assigned: {
      style: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      dot: 'bg-indigo-500'
    },
    'in progress': {
      style: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500 animate-ping'
    },
    'waiting for customer': {
      style: 'bg-purple-50 text-purple-700 border-purple-200',
      dot: 'bg-purple-500'
    },
    resolved: {
      style: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500'
    },
    closed: {
      style: 'bg-slate-100 text-slate-600 border-slate-200',
      dot: 'bg-slate-400'
    }
  };

  const current = config[norm] || config.open;

  const sizes = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-1 text-xs font-medium',
    md: 'px-3 py-1.5 text-sm font-medium'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border ${current.style} ${sizes[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      <span>{status}</span>
    </span>
  );
};
