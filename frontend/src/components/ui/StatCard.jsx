import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const StatCard = ({ title, value, icon: Icon, trend, trendType = 'up', color = 'blue', onClick, isActive }) => {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    slate: 'bg-slate-100 text-slate-600 border-slate-200'
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-5 border transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-md' : 'shadow-xs border-slate-200/80'
      } ${isActive ? 'ring-2 ring-blue-500 border-blue-500 shadow-md' : 'border-slate-200/80'}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-lg border ${colorStyles[color] || colorStyles.blue}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
        {trend && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold ${
              trendType === 'up' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 bg-slate-100'
            } px-2 py-0.5 rounded-full`}
          >
            {trendType === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};
