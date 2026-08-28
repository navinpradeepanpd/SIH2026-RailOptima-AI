import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  colorClass?: string;
}

export default function StatCard({ title, value, icon: Icon, trend, trendUp, colorClass = "text-blue-400" }: StatCardProps) {
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <h3 className="text-slate-400 font-medium text-sm">{title}</h3>
        <div className={`p-2 bg-slate-900 rounded-lg ${colorClass}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-white">{value}</span>
        {trend && (
          <span className={`text-xs font-semibold ${trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
