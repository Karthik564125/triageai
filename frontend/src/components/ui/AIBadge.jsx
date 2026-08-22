import React from 'react';
import { Sparkles } from 'lucide-react';

export const AIBadge = ({ label = 'AI Suggested', size = 'sm' }) => {
  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 rounded-full ${sizes[size]} shadow-xs ring-1 ring-indigo-500/10 tracking-wide`}
    >
      <Sparkles className="w-3 h-3 text-indigo-600 fill-indigo-200 animate-pulse" />
      <span>{label}</span>
    </span>
  );
};
