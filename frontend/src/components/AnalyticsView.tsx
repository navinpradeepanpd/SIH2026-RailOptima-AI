"use client";

import React, { useEffect, useState, useRef } from 'react';
import { BarChart3, TrendingUp, TrendingDown, CheckCircle, AlertTriangle, ArrowDown } from 'lucide-react';
import OperationalTimeline from './OperationalTimeline';

interface AnalyticsProps {
  simData: any;
  conflictData: any;
  optData: any;
}

function AnimatedBar({ label, value, max, color, delay = 0 }: { label: string, value: number, max: number, color: string, delay?: number }) {
  const [width, setWidth] = useState(0);
  const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  useEffect(() => {
    const timer = setTimeout(() => setWidth(percentage), 100 + delay);
    return () => clearTimeout(timer);
  }, [percentage, delay]);

  return (
    <div className="mb-5">
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-[var(--text-secondary)] font-medium text-xs">{label}</span>
        <span className="text-[var(--text-primary)] font-bold font-mono text-xs">{value} <span className="text-[var(--text-muted)]">/ {max}</span></span>
      </div>
      <div className="w-full bg-[var(--bg-deep)] rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full ${color} transition-all duration-[800ms] ease-out`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function DeltaChip({ before, after, label, unit = '' }: { before: number, after: number, label: string, unit?: string }) {
  const diff = after - before;
  const improved = diff <= 0;
  return (
    <div className="flex items-center justify-between bg-[var(--bg-deep)] px-3 py-2.5 rounded-lg border border-[var(--border-subtle)]">
      <span className="text-[var(--text-secondary)] text-xs">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[var(--text-muted)] text-xs font-mono line-through">{before}{unit}</span>
        <ArrowDown size={12} className={`${improved ? 'text-emerald-400' : 'text-rose-400 rotate-180'}`} />
        <span className={`text-xs font-bold font-mono ${improved ? 'text-emerald-400' : 'text-rose-400'}`}>{after}{unit}</span>
      </div>
    </div>
  );
}

export default function AnalyticsView({ simData, conflictData, optData }: AnalyticsProps) {
  if (!optData) {
    return (
      <div className="glass-panel-elevated p-12 text-center">
        <AlertTriangle className="mx-auto text-amber-400 mb-4" size={36} />
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">Optimization Data Required</h2>
        <p className="text-[var(--text-muted)] text-sm">Run the AI Optimizer first to generate before/after analytics.</p>
      </div>
    );
  }

  const metrics = optData?.summary_metrics || {};
  const totalMaint = metrics?.total_maintenance_requests || 0;

  // Before stats
  const beforeConflicts = conflictData?.summary_counts?.total || 0;
  const beforeUnscheduled = totalMaint;
  const beforeBlockHours = metrics?.block_hours || 0;
  const beforeUtilized = 0;

  // After stats
  const afterConflicts = optData?.conflicts_after?.total || 0;
  const afterUnscheduled = metrics?.unscheduled_requests || 0;
  const afterUtilized = metrics?.utilized_block_hours || 0;

  return (
    <div className="space-y-6">

      {/* Simulation Notice */}
      <div className="glass-panel px-5 py-3 flex items-start gap-3 accent-left-amber">
        <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={16} />
        <p className="text-xs text-[var(--text-secondary)]">
          All analytics below are generated from <span className="font-bold text-amber-400">simulation data</span>. These results demonstrate system capability and must not be confused with actual Indian Railways performance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* BEFORE OPTIMIZATION */}
        <div className="glass-panel p-6 relative opacity-75">
          <h2 className="text-sm font-bold text-[var(--text-primary)] mb-5 pb-3 border-b border-[var(--border-subtle)] flex items-center gap-2 uppercase tracking-wider">
            <BarChart3 className="text-amber-400" size={16} />
            Before Optimization
          </h2>

          <AnimatedBar label="Unscheduled Requests" value={beforeUnscheduled} max={totalMaint} color="bg-amber-500" delay={0} />
          <AnimatedBar label="Schedule Conflicts" value={beforeConflicts} max={Math.max(beforeConflicts, 10)} color="bg-rose-500" delay={100} />
          <AnimatedBar label="Block Hours Utilized" value={beforeUtilized} max={Math.max(beforeBlockHours, 1)} color="bg-[var(--text-muted)]" delay={200} />

          <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] space-y-2">
            <div className="flex justify-between items-center bg-[var(--bg-deep)] px-3 py-2.5 rounded-lg border border-[var(--border-subtle)]">
              <span className="text-[var(--text-muted)] text-xs">Unused Requested Hours</span>
              <span className="text-amber-400 font-bold text-xs font-mono">{beforeBlockHours}h</span>
            </div>
            <div className="flex justify-between items-center bg-[var(--bg-deep)] px-3 py-2.5 rounded-lg border border-[var(--border-subtle)]">
              <span className="text-[var(--text-muted)] text-xs">Total Overlap Time</span>
              <span className="text-rose-400 font-bold text-xs font-mono">{conflictData?.summary_counts?.total_overlap_duration_minutes || 0}m</span>
            </div>
            <div className="flex justify-between items-center bg-[var(--bg-deep)] px-3 py-2.5 rounded-lg border border-[var(--border-subtle)]">
              <span className="text-[var(--text-muted)] text-xs">Utilization Rate</span>
              <span className="text-[var(--text-muted)] font-bold text-xs">Uncoordinated</span>
            </div>
          </div>
        </div>

        {/* AFTER OPTIMIZATION */}
        <div className="glass-panel-elevated p-6 relative glow-border-emerald">
          <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-500 to-emerald-600 text-white text-[10px] font-bold px-4 py-1 rounded-bl-xl z-10 tracking-wider">
            AI OPTIMIZED
          </div>

          <h2 className="text-sm font-bold text-[var(--text-primary)] mb-5 pb-3 border-b border-[var(--border-subtle)] flex items-center gap-2 uppercase tracking-wider">
            <TrendingUp className="text-emerald-400" size={16} />
            After Optimization
          </h2>

          <AnimatedBar label="Scheduled Requests" value={metrics?.scheduled_requests || 0} max={totalMaint} color="bg-emerald-500" delay={300} />
          <AnimatedBar label="Remaining Conflicts" value={afterConflicts} max={Math.max(beforeConflicts, 10)} color="bg-rose-500" delay={400} />
          <AnimatedBar label="Block Hours Utilized" value={afterUtilized} max={Math.max(beforeBlockHours, 1)} color="bg-cyan-400" delay={500} />

          <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] space-y-2">
            <div className="flex justify-between items-center bg-emerald-950/20 px-3 py-2.5 rounded-lg border border-emerald-500/15">
              <span className="text-emerald-200 text-xs flex items-center gap-1.5"><CheckCircle size={12}/>Critical Completed</span>
              <span className="text-emerald-400 font-bold text-xs font-mono">{metrics?.critical_maintenance_completed || 0}</span>
            </div>
            <div className="flex justify-between items-center bg-cyan-950/15 px-3 py-2.5 rounded-lg border border-cyan-500/15">
              <span className="text-cyan-200 text-xs">Avg Shift Duration</span>
              <span className="text-cyan-400 font-bold text-xs font-mono">{metrics?.avg_shift_duration_mins || 0}m</span>
            </div>
            <div className="flex justify-between items-center bg-emerald-950/20 px-3 py-2.5 rounded-lg border border-emerald-500/15">
              <span className="text-emerald-200 text-xs">Utilization Rate</span>
              <span className="text-emerald-400 font-bold text-xs font-mono">{metrics?.utilization_percentage || 0}%</span>
            </div>
            <div className="flex justify-between items-center bg-emerald-950/20 px-3 py-2.5 rounded-lg border border-emerald-500/15">
              <span className="text-emerald-200 text-xs">Remaining Overlap</span>
              <span className="text-emerald-400 font-bold text-xs font-mono">{optData?.conflicts_after?.total_overlap_duration_minutes || 0}m</span>
            </div>
          </div>
        </div>

      </div>

      {/* DELTA SUMMARY */}
      <div className="glass-panel p-5">
        <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Optimization Impact Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <DeltaChip before={beforeConflicts} after={afterConflicts} label="Conflicts" />
          <DeltaChip before={beforeUnscheduled} after={metrics?.scheduled_requests || 0} label="Scheduled" />
          <DeltaChip before={0} after={afterUtilized} label="Block Hours" unit="h" />
        </div>
      </div>

      {/* TIMELINE */}
      <div>
        <h2 className="text-sm font-bold text-[var(--text-primary)] mb-4 uppercase tracking-wider">Operational Timeline (Post-Optimization)</h2>
        <OperationalTimeline
          trains={simData?.trains || []}
          maintenance={simData?.maintenance || []}
          sections={simData?.sections || []}
          conflicts={optData?.conflicts_after?.conflicts || []}
          optData={optData}
        />
      </div>
    </div>
  );
}
