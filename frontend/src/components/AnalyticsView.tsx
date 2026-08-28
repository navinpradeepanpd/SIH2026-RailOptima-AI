import React from 'react';
import { BarChart3, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';

interface AnalyticsProps {
  simData: any;
  conflictData: any;
  optData: any;
}

function SimpleBar({ label, value, max, color }: { label: string, value: number, max: number, color: string }) {
  const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-300 font-medium">{label}</span>
        <span className="text-slate-400">{value} <span className="text-xs opacity-50">(Simulation Result: {percentage}%)</span></span>
      </div>
      <div className="w-full bg-slate-900 rounded-full h-3">
        <div className={`h-3 rounded-full ${color}`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}

export default function AnalyticsView({ simData, conflictData, optData }: AnalyticsProps) {
  if (!optData) {
    return (
      <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 text-center">
        <AlertTriangle className="mx-auto text-orange-500 mb-4" size={32} />
        <h2 className="text-xl font-bold text-white mb-2">Optimization Data Required</h2>
        <p className="text-slate-400">Please run the AI Optimizer to generate analytics.</p>
      </div>
    );
  }

  const metrics = optData?.summary_metrics || {};
  const totalMaint = metrics?.total_maintenance_requests || 0;
  
  // Before stats
  const beforeConflicts = conflictData?.summary_counts?.total || 0;
  const beforeUnscheduled = totalMaint; // Everything unscheduled by optimizer initially
  const beforeBlockHours = metrics?.block_hours || 0; // Total requested hours
  const beforeUtilized = 0; // Pre-optimization utilization is effectively uncoordinated

  // After stats
  const afterConflicts = optData?.conflicts_after?.total || 0;
  const afterUnscheduled = metrics?.unscheduled_requests || 0;
  const afterUtilized = metrics?.utilized_block_hours || 0;

  return (
    <div className="space-y-6">
      
      <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg flex items-start gap-3">
        <AlertTriangle className="text-blue-400 shrink-0 mt-1" size={20} />
        <div>
          <h3 className="text-blue-400 font-bold">Important Notice</h3>
          <p className="text-sm text-slate-300">All data shown below is generated from simulated scenarios. Clearly distinguish these simulation results from real Indian Railways performance.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        
        {/* BEFORE OPTIMIZATION */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-700 pb-3 flex items-center gap-2">
            <BarChart3 className="text-orange-400" /> 
            BEFORE OPTIMIZATION
          </h2>
          
          <SimpleBar label="Unscheduled Requests" value={beforeUnscheduled} max={totalMaint} color="bg-orange-500" />
          <SimpleBar label="Schedule Conflicts" value={beforeConflicts} max={Math.max(beforeConflicts, 10)} color="bg-rose-500" />
          <SimpleBar label="Utilized Block Hours" value={beforeUtilized} max={beforeBlockHours} color="bg-slate-600" />
          
          <div className="mt-6 pt-4 border-t border-slate-700">
             <div className="flex justify-between items-center bg-slate-900 p-3 rounded">
               <span className="text-slate-400 text-sm">Unused Requested Hours</span>
               <span className="text-orange-400 font-bold">{beforeBlockHours}h</span>
             </div>
          </div>
        </div>

        {/* AFTER OPTIMIZATION */}
        <div className="bg-slate-800 rounded-xl p-6 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)] relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10">AI OPTIMIZED</div>
          
          <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-700 pb-3 flex items-center gap-2">
            <TrendingUp className="text-emerald-400" /> 
            AFTER OPTIMIZATION
          </h2>
          
          <SimpleBar label="Scheduled Requests" value={metrics?.scheduled_requests || 0} max={totalMaint} color="bg-emerald-500" />
          <SimpleBar label="Remaining Conflicts" value={afterConflicts} max={Math.max(beforeConflicts, 10)} color="bg-rose-500" />
          <SimpleBar label="Utilized Block Hours" value={afterUtilized} max={beforeBlockHours} color="bg-emerald-400" />
          
          <div className="mt-6 pt-4 border-t border-slate-700">
             <div className="flex justify-between items-center bg-emerald-900/30 p-3 rounded border border-emerald-500/20">
               <span className="text-emerald-200 text-sm flex items-center gap-2"><CheckCircle size={16}/> Critical Maintenance Completed</span>
               <span className="text-emerald-400 font-bold">{metrics?.critical_maintenance_completed || 0}</span>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
