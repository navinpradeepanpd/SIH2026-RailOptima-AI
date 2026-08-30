"use client";

import React, { useEffect, useRef, useState } from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  colorClass?: string;
  accentColor?: 'cyan' | 'emerald' | 'rose' | 'amber' | 'info';
}

const accentMap = {
  cyan: {
    border: 'border-l-cyan-400',
    iconBg: 'bg-cyan-400/10',
    iconText: 'text-cyan-400',
    glow: 'shadow-[0_0_20px_rgba(34,211,238,0.06)]',
  },
  emerald: {
    border: 'border-l-emerald-400',
    iconBg: 'bg-emerald-400/10',
    iconText: 'text-emerald-400',
    glow: 'shadow-[0_0_20px_rgba(52,211,153,0.06)]',
  },
  rose: {
    border: 'border-l-rose-400',
    iconBg: 'bg-rose-400/10',
    iconText: 'text-rose-400',
    glow: 'shadow-[0_0_20px_rgba(244,63,94,0.06)]',
  },
  amber: {
    border: 'border-l-amber-400',
    iconBg: 'bg-amber-400/10',
    iconText: 'text-amber-400',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.06)]',
  },
  info: {
    border: 'border-l-indigo-400',
    iconBg: 'bg-indigo-400/10',
    iconText: 'text-indigo-400',
    glow: 'shadow-[0_0_20px_rgba(129,140,248,0.06)]',
  },
};

function useCountUp(target: number, duration = 800) {
  const [count, setCount] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) {
        ref.current = requestAnimationFrame(animate);
      }
    };
    ref.current = requestAnimationFrame(animate);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [target, duration]);

  return count;
}

export default function StatCard({ title, value, icon: Icon, trend, trendUp, colorClass = "text-cyan-400", accentColor = 'cyan' }: StatCardProps) {
  const accent = accentMap[accentColor] || accentMap.cyan;
  const numericValue = typeof value === 'number' ? value : null;
  const animatedValue = useCountUp(numericValue ?? 0);
  const displayValue = numericValue !== null ? animatedValue : value;

  return (
    <div className={`glass-panel interactive-card border-l-[3px] ${accent.border} ${accent.glow} p-5 flex flex-col justify-between`}>
      <div className="flex justify-between items-start">
        <h3 className="text-[var(--text-secondary)] font-medium text-xs uppercase tracking-wider">{title}</h3>
        <div className={`p-2 rounded-lg ${accent.iconBg}`}>
          <Icon size={18} className={accent.iconText} />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-[var(--text-primary)] font-[var(--font-geist-mono)] animate-count-up">
          {displayValue}
        </span>
        {trend && (
          <span className={`text-xs font-semibold ${trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
