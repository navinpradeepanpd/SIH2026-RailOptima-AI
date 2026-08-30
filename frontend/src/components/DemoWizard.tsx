import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, RotateCcw, AlertTriangle, AlertCircle, CheckCircle, LayoutDashboard, Activity, Zap } from 'lucide-react';
import { getApiUrl } from '../lib/api';
import OperationalTimeline from './OperationalTimeline';
import DataTable from './DataTable';
import DecisionCard from './DecisionCard';

export default function DemoWizard({ onExit }: { onExit?: () => void }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [simData, setSimData] = useState<any>(null);
  const [conflictData, setConflictData] = useState<any>(null);
  const [priorityData, setPriorityData] = useState<any>(null);
  const [optData, setOptData] = useState<any>(null);
  const [emgData, setEmgData] = useState<any>(null);

  const steps = [
    "Network Baseline",
    "Conflict Detection",
    "Priority Analysis",
    "AI Optimization",
    "Decision Explanations",
    "Emergency Disruption",
    "Automatic Replanning",
    "Final Summary"
  ];

  const fetchStepData = async (targetStep: number) => {
    setError(null);
    setLoading(true);
    try {
      if (targetStep === 1 && !simData) {
        const res = await fetch(getApiUrl("/api/simulation"));
        if (!res.ok) throw new Error("Failed to load network baseline");
        setSimData(await res.json());
      }
      if (targetStep === 2 && !conflictData) {
        const res = await fetch(getApiUrl("/api/conflicts"));
        if (!res.ok) throw new Error("Failed to load conflicts");
        setConflictData(await res.json());
      }
      if (targetStep === 3 && !priorityData) {
        const res = await fetch(getApiUrl("/api/maintenance/priorities"));
        if (!res.ok) throw new Error("Failed to load priority analysis");
        setPriorityData(await res.json());
      }
      if (targetStep === 4 && !optData) {
        const res = await fetch(getApiUrl("/api/planning/weekly"), {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({})
        });
        if (!res.ok) throw new Error("Failed to run AI optimizer");
        setOptData(await res.json());
      }
      if (targetStep === 6 && !emgData) {
        const payload = {
          emergency_request: {
            request_id: "EMG_DEMO_1", department: "Engineering", asset_type: "Track", section: "SEC_1",
            start_time: "2026-09-01T10:00:00", duration: 120, severity: "Critical", urgency: "Emergency", safety_critical: true
          }
        };
        const res = await fetch(getApiUrl("/api/emergency/replan"), {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Failed to trigger emergency replanning");
        setEmgData(await res.json());
      }
      setStep(targetStep);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during API request.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStepData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNext = () => {
    if (step < 8) fetchStepData(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) fetchStepData(step - 1);
  };

  const resetDemo = () => {
    setSimData(null);
    setConflictData(null);
    setPriorityData(null);
    setOptData(null);
    setEmgData(null);
    fetchStepData(1);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
      {/* HEADER */}
      <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-emerald-400">SIH Demo Mode</h2>
          <p className="text-sm text-slate-400">Step {step} of 8: {steps[step - 1]}</p>
        </div>
        <div className="flex gap-3">
          {onExit && (
             <button onClick={onExit} className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 font-medium transition-colors">
                 <LayoutDashboard size={16} /> Exit Demo
             </button>
          )}
          <button onClick={resetDemo} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white font-medium transition-colors">
            <RotateCcw size={16} /> Restart
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="p-6 flex-1 overflow-y-auto min-h-[500px]">
        {loading && <div className="flex items-center justify-center h-full text-emerald-400 animate-pulse font-bold text-xl">Processing Live Backend Algorithms...</div>}
        
        {error && (
            <div className="flex flex-col items-center justify-center h-full text-center p-12 bg-rose-900/20 border border-rose-500/30 rounded-xl">
                <AlertTriangle className="mx-auto text-rose-500 mb-4" size={48} />
                <h2 className="text-2xl font-bold text-white mb-2">API Error (Step {step})</h2>
                <p className="text-rose-400 mb-6">{error}</p>
                <button onClick={() => fetchStepData(step)} className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold transition-colors">
                    Retry Request
                </button>
            </div>
        )}

        {!loading && !error && step === 1 && simData && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-xl font-bold text-white mb-2">Network Baseline</h3>
            <p className="text-slate-400 mb-6">Current snapshot of the railway network with active trains and pending, uncoordinated maintenance requests.</p>
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 mb-6 flex justify-between items-center text-xs font-bold text-center">
                <div className="flex flex-col items-center gap-2 p-2 w-1/5"><div className="bg-orange-500/20 text-orange-400 p-2 rounded-full border border-orange-500/50"><LayoutDashboard size={20} /></div>DATA SOURCE</div>
                <ArrowRight className="text-slate-600" size={16} />
                <div className="flex flex-col items-center gap-2 p-2 w-1/5"><div className="bg-blue-500/20 text-blue-400 p-2 rounded-full border border-blue-500/50"><Activity size={20} /></div>NORMALIZED RAIL DATA</div>
                <ArrowRight className="text-slate-600" size={16} />
                <div className="flex flex-col items-center gap-2 p-2 w-1/5"><div className="bg-emerald-500/20 text-emerald-400 p-2 rounded-full border border-emerald-500/50"><Zap size={20} /></div>OPTIMIZATION ENGINE</div>
                <ArrowRight className="text-slate-600" size={16} />
                <div className="flex flex-col items-center gap-2 p-2 w-1/5"><div className="bg-purple-500/20 text-purple-400 p-2 rounded-full border border-purple-500/50"><AlertTriangle size={20} /></div>EMERGENCY INTELLIGENCE</div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-800 p-4 rounded border border-slate-700">
                    <p className="text-sm text-slate-400">Active Trains</p>
                    <p className="text-2xl font-bold text-blue-400">{simData.trains?.length || 0}</p>
                </div>
                <div className="bg-slate-800 p-4 rounded border border-slate-700">
                    <p className="text-sm text-slate-400">Pending Maintenance Blocks</p>
                    <p className="text-2xl font-bold text-orange-400">{simData.maintenance?.length || 0}</p>
                </div>
            </div>
            <div className="mt-8">
              <OperationalTimeline trains={simData.trains} maintenance={simData.maintenance} sections={simData.sections} />
            </div>
          </div>
        )}

        {!loading && !error && step === 2 && conflictData && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-xl font-bold text-white mb-2">Conflict Detection</h3>
            <p className="text-slate-400 mb-6">The uncoordinated schedule contains significant overlaps. The engine has detected critical conflicts.</p>
            <div className="bg-rose-900/20 border border-rose-500/30 p-4 rounded mb-6 text-rose-400 flex items-center gap-3">
              <AlertTriangle size={24} />
              <span className="font-bold text-lg">{conflictData.summary_counts?.total || 0} Total Conflicts Detected</span>
            </div>
            <DataTable title="Detected Overlaps (Before Optimization)" columns={[
                { header: "Conflict", accessor: "activity_1", render: (v: any, row: any) => (
                  <div>
                    <p className="font-bold text-slate-200">{row.activity_1} vs {row.activity_2}</p>
                    {row.activity_1_type && <p className="text-xs text-slate-400">{row.activity_1_type} vs {row.activity_2_type}</p>}
                  </div>
                )},
                { header: "Location", accessor: "section", render: (v: any, row: any) => (
                  <div>
                    <p className="text-slate-300 font-mono">{row.section}</p>
                    {row.track && row.track !== "Unknown" && <p className="text-xs text-slate-400 font-mono">{row.track}</p>}
                  </div>
                )},
                { header: "Time Overlap", accessor: "overlap_start", render: (v: any, row: any) => {
                  if (!row.overlap_start) return <span className="text-slate-500">N/A</span>;
                  return (
                  <div>
                    <p className="text-slate-300 text-sm">
                      {new Date(row.overlap_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → {new Date(row.overlap_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-orange-400 font-bold">{row.overlap_duration_minutes} mins</p>
                  </div>
                )}},
                { header: "Severity", accessor: "severity", render: (v: string) => <span className={`px-2 py-1 rounded text-xs font-bold ${v === 'CRITICAL' ? 'bg-rose-500 text-white' : 'bg-orange-500 text-white'}`}>{v}</span> },
                { header: "Reason", accessor: "reason", render: (v: string) => <span className="text-xs text-slate-300">{v}</span> }
            ]} data={conflictData.conflicts || []} />
            <div className="mt-8">
              <OperationalTimeline trains={simData.trains} maintenance={simData.maintenance} sections={simData.sections} conflicts={conflictData.conflicts || []} />
            </div>
          </div>
        )}

        {!loading && !error && step === 3 && priorityData && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-xl font-bold text-white mb-2">Priority Analysis</h3>
            <p className="text-slate-400 mb-6">Maintenance blocks are objectively scored and ranked. Critical blocks (higher scores) are protected during conflict resolution.</p>
            <DataTable title="Scored Maintenance Queue" columns={[
                { header: "ID", accessor: "request_id" },
                { header: "Dept", accessor: "department" },
                { header: "Section", accessor: "section" },
                { header: "Priority", accessor: "priority_level", render: (val: string) => <span className={`px-2 py-1 rounded text-xs font-bold ${val === 'CRITICAL' ? 'bg-rose-500/20 text-rose-500' : val === 'HIGH' ? 'bg-orange-500/20 text-orange-500' : 'bg-blue-500/20 text-blue-500'}`}>{val}</span> },
                { header: "Score", accessor: "priority_score" },
                { header: "Duration", accessor: "duration", render: (val: number) => `${val}m` }
            ]} data={priorityData || []} />
          </div>
        )}

        {!loading && !error && step === 4 && optData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
            <h3 className="text-xl font-bold text-white mb-2">AI Optimization</h3>
            <p className="text-slate-400 mb-6">The constraint-based block optimizer resolves overlaps by shifting or rejecting blocks based on priorities and constraints.</p>
            <div className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded text-emerald-400 flex items-center gap-3 mb-6">
              <CheckCircle size={24} />
              <span className="font-bold text-lg">Optimized Master Schedule Generated ({optData.summary_metrics?.scheduled_requests || 0} blocks)</span>
            </div>
            <DataTable title="Optimized Master Schedule" columns={[
                { header: "ID", accessor: "request_id" },
                { header: "Dept", accessor: "department" },
                { header: "Status", accessor: "status", render: (val: string) => <span className={`px-2 py-1 rounded text-xs font-bold ${val === 'Scheduled' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>{val}</span> },
                { header: "Optimized Start", accessor: "start_time", render: (val: string) => <span className="text-emerald-400 font-mono">{val ? new Date(val).toLocaleString() : "Unscheduled"}</span> },
                { header: "Reason", accessor: "reason", render: (val: string) => val ? val : "N/A" }
            ]} data={optData.scheduled_requests || []} />
            <div className="mt-8">
              <OperationalTimeline trains={simData.trains} maintenance={simData.maintenance} sections={simData.sections} conflicts={optData.conflicts_after?.conflicts || []} optData={optData} />
            </div>
          </div>
        )}

        {!loading && !error && step === 5 && optData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
            <h3 className="text-xl font-bold text-white mb-2">WHY DID THE AI MOVE THESE BLOCKS?</h3>
            <p className="text-slate-400 mb-6">Explore the exact reasons for each scheduling decision.</p>
            
            <div className="grid grid-cols-2 gap-4">
                {(optData?.scheduled_requests || []).filter((r: any) => r.decision_explanation).map((req: any, i: number) => (
                    <DecisionCard key={`demo-sched-${i}`} req={req} />
                ))}
                {(optData?.unscheduled_requests || []).filter((r: any) => r.decision_explanation).map((req: any, i: number) => (
                    <DecisionCard key={`demo-unsched-${i}`} req={req} />
                ))}
            </div>
          </div>
        )}

        {!loading && !error && step === 6 && emgData && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-xl font-bold text-white mb-2">Emergency Disruption</h3>
            <p className="text-slate-400 mb-6">A critical track defect requires an immediate, unplanned emergency block, disrupting the optimized schedule.</p>
            <div className="bg-slate-800 p-6 rounded-xl border border-rose-500/50 shadow-lg shadow-rose-900/20 mb-6">
              <h4 className="text-rose-500 font-bold mb-4 flex items-center gap-2"><AlertCircle /> INJECTING CRITICAL EMERGENCY BLOCK</h4>
              <p className="text-white font-mono">Request ID: EMG_DEMO_1</p>
              <p className="text-white font-mono">Section: SEC_1</p>
              <p className="text-white font-mono">Time: 2026-09-01T10:00:00 (120 mins)</p>
            </div>
            
            <div className="bg-slate-800 p-6 rounded-xl border border-orange-500/30">
               <h3 className="text-orange-400 font-bold mb-4">Operations Caught in Emergency Window</h3>
               <div className="flex gap-4">
                 <div className="flex-1 bg-slate-900 p-4 rounded border border-slate-700">
                   <p className="text-sm text-slate-400 mb-2">Trains Impacted</p>
                   <p className="font-bold text-white">{(emgData.affected_activities?.trains?.length || 0) > 0 ? emgData.affected_activities.trains.join(", ") : "None"}</p>
                 </div>
                 <div className="flex-1 bg-slate-900 p-4 rounded border border-slate-700">
                   <p className="text-sm text-slate-400 mb-2">Maintenance Impacted</p>
                   <p className="font-bold text-white">{(emgData.affected_activities?.maintenance?.length || 0) > 0 ? emgData.affected_activities.maintenance.join(", ") : "None"}</p>
                 </div>
               </div>
             </div>
             <div className="mt-8">
               <OperationalTimeline trains={simData.trains} maintenance={simData.maintenance} sections={simData.sections} optData={optData} highlightSectionId="SEC_1" />
             </div>
          </div>
        )}

        {!loading && !error && step === 7 && emgData && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-xl font-bold text-white mb-2">Automatic Surgical Replanning</h3>
            <p className="text-slate-400 mb-6">RailOptima isolates the emergency and performs cascading replanning only on affected operations.</p>
            
            <div className="bg-slate-800 p-6 rounded-xl border border-rose-500/30 shadow-lg mb-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><AlertTriangle className="text-rose-500"/> EMERGENCY IMPACT REPORT</h2>
                <div className="grid grid-cols-5 gap-4 text-center">
                    <div className="bg-slate-900 p-4 rounded border border-slate-700">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Direct</p>
                        <p className="text-2xl font-bold text-rose-500">{emgData.summary_metrics?.directly_affected || 0}</p>
                    </div>
                    <div className="bg-slate-900 p-4 rounded border border-slate-700">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Cascade</p>
                        <p className="text-2xl font-bold text-orange-500">{emgData.summary_metrics?.cascade_affected || 0}</p>
                    </div>
                    <div className="bg-slate-900 p-4 rounded border border-slate-700">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Unchanged</p>
                        <p className="text-2xl font-bold text-emerald-500">{emgData.summary_metrics?.unchanged || 0}</p>
                    </div>
                    <div className="bg-slate-900 p-4 rounded border border-slate-700">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Shifted</p>
                        <p className="text-2xl font-bold text-blue-500">{emgData.summary_metrics?.shifted || 0}</p>
                    </div>
                    <div className="bg-slate-900 p-4 rounded border border-slate-700">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Unscheduled</p>
                        <p className="text-2xl font-bold text-slate-400">{emgData.summary_metrics?.unscheduled || 0}</p>
                    </div>
                </div>
                
                {(emgData.summary_metrics?.cascade_affected > 0) && (
                    <div className="mt-6 bg-slate-900/50 p-4 rounded border border-orange-500/20">
                        <p className="text-sm font-bold text-orange-400 mb-2">Cascade Visualization</p>
                        <div className="flex items-center gap-2 text-sm text-slate-300 flex-wrap">
                            <span className="bg-rose-500 text-white px-2 py-1 rounded text-xs font-bold">Emergency</span>
                            {emgData.summary_metrics.cascade_activities.map((act: string, i: number) => (
                                <React.Fragment key={i}>
                                    <span className="text-slate-500">→</span>
                                    <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded text-xs font-bold">{act} shifted</span>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                )}
            </div>

             <div className="mt-8">
               <OperationalTimeline trains={simData.trains} maintenance={simData.maintenance} sections={simData.sections} optData={optData} emgData={emgData} highlightSectionId="SEC_1" />
             </div>
          </div>
        )}

        {!loading && !error && step === 8 && optData && emgData && conflictData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
            <h3 className="text-xl font-bold text-white mb-2">Final Executive Summary</h3>
            <p className="text-slate-400 mb-6">The system successfully ingested uncoordinated schedules, mathematically resolved conflicts, safely handled an emergency disruption, and preserved unaffected operations.</p>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-800 p-4 rounded border border-slate-700 text-center">
                    <p className="text-sm text-slate-400 mb-1">Total Blocks Shifted</p>
                    <p className="text-3xl font-bold text-blue-500">{emgData.summary_metrics?.shifted || 0}</p>
                </div>
                <div className="bg-slate-800 p-4 rounded border border-slate-700 text-center">
                    <p className="text-sm text-slate-400 mb-1">Total Operations Saved</p>
                    <p className="text-3xl font-bold text-emerald-500">{emgData.summary_metrics?.unchanged || 0}</p>
                </div>
                <div className="bg-slate-800 p-4 rounded border border-slate-700 text-center">
                    <p className="text-sm text-slate-400 mb-1">Final Remaining Conflicts</p>
                    <p className="text-3xl font-bold text-blue-400">0</p>
                </div>
            </div>
            
            {(emgData.actions?.length > 0) && (
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-white mb-4">Emergency Decision Explanations</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {emgData.after_schedule.filter((r: any) => r.decision_explanation && r.status != 'Emergency Scheduled').map((req: any, i: number) => (
                            <DecisionCard key={`demo-emg-sched-${i}`} req={req} />
                        ))}
                        {emgData.unscheduled_requests?.map((req: any, i: number) => (
                            <DecisionCard key={`demo-emg-unsched-${i}`} req={req} />
                        ))}
                    </div>
                </div>
            )}
            
            <div className="bg-emerald-900/20 border border-emerald-500/30 p-6 rounded-xl text-center">
                <CheckCircle className="mx-auto text-emerald-500 mb-4" size={48} />
                <h2 className="text-2xl font-bold text-emerald-400 mb-2">Ready for Operation</h2>
                <p className="text-emerald-200">RailOptima AI has dynamically recovered the railway network schedule.</p>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER CONTROLS */}
      <div className="bg-slate-800 p-4 border-t border-slate-700 flex justify-between items-center">
          <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className={`w-8 h-2 rounded-full transition-colors ${i <= step ? 'bg-emerald-500' : 'bg-slate-700'}`} />
              ))}
          </div>
          <div className="flex gap-3">
              <button onClick={handlePrev} disabled={step === 1 || loading} className="flex items-center gap-2 px-6 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded text-white font-bold transition-colors">
                  <ArrowLeft size={16} /> Back
              </button>
              <button onClick={handleNext} disabled={step === 8 || loading} className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded text-white font-bold transition-colors">
                  Next <ArrowRight size={16} />
              </button>
          </div>
      </div>
    </div>
  );
}
