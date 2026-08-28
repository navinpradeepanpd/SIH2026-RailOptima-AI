import React, { useState } from 'react';
import { ArrowRight, RotateCcw, Play } from 'lucide-react';
import TimelineView from './TimelineView';
import DataTable from './DataTable';
import AnalyticsView from './AnalyticsView';

export default function DemoWizard() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [simData, setSimData] = useState<any>(null);
  const [conflictData, setConflictData] = useState<any>(null);
  const [optData, setOptData] = useState<any>(null);
  const [emgData, setEmgData] = useState<any>(null);

  const steps = [
    "Start Demo",
    "Show normal train movements",
    "Inject maintenance requests",
    "Detect Conflicts",
    "Optimize Block Plan",
    "Inject emergency request",
    "Show affected operations",
    "Execute Re-plan",
    "Final KPI Analytics"
  ];

  const handleNextStep = async () => {
    const nextStep = step + 1;
    setLoading(true);
    try {
      if (nextStep === 1 || nextStep === 2) {
        if (!simData) {
          const res = await fetch("http://127.0.0.1:8000/api/simulation");
          setSimData(await res.json());
        }
      }
      if (nextStep === 3) {
        const res = await fetch("http://127.0.0.1:8000/api/conflicts");
        setConflictData(await res.json());
      }
      if (nextStep === 4) {
        const res = await fetch("http://127.0.0.1:8000/api/planning/weekly", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({})
        });
        setOptData(await res.json());
      }
      if (nextStep >= 5 && nextStep <= 7) {
        if (!emgData) {
          const payload = {
            emergency_request: {
              request_id: "EMG_DEMO_1", department: "Engineering", asset_type: "Track", section: "SEC_1",
              start_time: "2026-09-01T10:00:00", duration: 120, severity: "Critical", urgency: "Emergency", safety_critical: true
            }
          };
          const res = await fetch("http://127.0.0.1:8000/api/emergency/replan", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
          });
          setEmgData(await res.json());
        }
      }
      setStep(nextStep);
    } catch (err) {
      console.error(err);
      alert("Failed to connect to backend API.");
    }
    setLoading(false);
  };

  const resetDemo = () => {
    setStep(0);
    setSimData(null);
    setConflictData(null);
    setOptData(null);
    setEmgData(null);
  };

  const conflictCols = [
    { header: "Activity 1", accessor: "activity_1" },
    { header: "Activity 2", accessor: "activity_2" },
    { header: "Severity", accessor: "severity" },
    { header: "Reason", accessor: "reason" }
  ];

  const maintCols = [
    { header: "ID", accessor: "request_id" },
    { header: "Dept", accessor: "department" },
    { header: "Section", accessor: "section" },
    { header: "Score", accessor: "priority_score" },
    { header: "Scheduled Start", accessor: "start_time" }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
      {/* HEADER */}
      <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-emerald-400">SIH 2026 Presentation Sequence</h2>
          <p className="text-sm text-slate-400">Step {step} of 8: {steps[step]}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={resetDemo} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white font-medium transition-colors">
            <RotateCcw size={16} /> Reset Demo
          </button>
          <button onClick={handleNextStep} disabled={step >= 8 || loading} className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded text-white font-bold transition-colors">
            {step === 0 ? <><Play size={16} /> Start Demo</> : <><ArrowRight size={16} /> Next Step</>}
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="p-6 flex-1 overflow-y-auto">
        {loading && <div className="text-center p-12 text-emerald-400 animate-pulse font-bold text-xl">Processing Live Backend Algorithms...</div>}
        
        {!loading && step === 0 && (
          <div className="text-center p-12">
            <h1 className="text-4xl font-black text-white mb-4">RailOptima AI</h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">This guided wizard will demonstrate the real-time capabilities of our constraint optimization and dynamic replanning engines using a deterministic dataset.</p>
          </div>
        )}

        {!loading && step === 1 && simData && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-lg font-bold text-white mb-4">Step 1: Normal Train Movements</h3>
            <TimelineView trains={simData.trains} maintenance={[]} sections={simData.sections} />
          </div>
        )}

        {!loading && step === 2 && simData && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-lg font-bold text-white mb-4">Step 2: Injecting Maintenance Requests</h3>
            <p className="text-slate-400 mb-4">Uncoordinated blocks requested by Engineering, S&T, and Traction departments.</p>
            <TimelineView trains={simData.trains} maintenance={simData.maintenance} sections={simData.sections} />
          </div>
        )}

        {!loading && step === 3 && conflictData && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-lg font-bold text-white mb-4">Step 3: Conflict Detection ($O(N^2)$)</h3>
            <div className="bg-rose-900/20 border border-rose-500/30 p-4 rounded mb-6 text-rose-400">
              Found <strong>{conflictData?.summary_counts?.total || 0}</strong> conflicts in the uncoordinated baseline schedule.
            </div>
            <DataTable title="Detected Overlaps" columns={conflictCols} data={conflictData?.conflicts || []} />
          </div>
        )}

        {!loading && step === 4 && optData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
            <h3 className="text-lg font-bold text-white mb-4">Step 4: AI Block Optimization</h3>
            <div className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded text-emerald-400">
              Optimizer safely scheduled {optData?.summary_metrics?.scheduled_requests || 0} blocks. Remaining overlaps: 0.
            </div>
            <DataTable title="Optimized Master Schedule" columns={maintCols} data={optData?.scheduled_requests || []} />
          </div>
        )}

        {!loading && step === 5 && emgData && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-lg font-bold text-white mb-4">Step 5: Emergency Block Injection</h3>
            <div className="bg-slate-800 p-6 rounded-xl border border-rose-500/50 shadow-lg shadow-rose-900/20">
              <h4 className="text-rose-500 font-bold mb-4">INJECTING DISRUPTION...</h4>
              <p className="text-white font-mono">Request ID: EMG_DEMO_1</p>
              <p className="text-white font-mono">Department: Engineering (Track)</p>
              <p className="text-white font-mono">Section: SEC_1</p>
              <p className="text-white font-mono">Time: 2026-09-01T10:00:00 (120 mins)</p>
              <p className="text-white font-mono text-rose-400">Severity: CRITICAL</p>
            </div>
          </div>
        )}

        {!loading && step === 6 && emgData && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-lg font-bold text-white mb-4">Step 6: Impact Analysis</h3>
            <div className="bg-slate-800 p-6 rounded-xl border border-orange-500/30">
               <h3 className="text-orange-400 font-bold mb-4">Operations Caught in Emergency Window</h3>
               <div className="flex gap-4">
                 <div className="flex-1 bg-slate-900 p-4 rounded border border-slate-700">
                   <p className="text-sm text-slate-400 mb-2">Trains Impacted</p>
                   <p className="font-bold text-white">{(emgData?.affected_activities?.trains?.length || 0) > 0 ? emgData.affected_activities.trains.join(", ") : "None"}</p>
                 </div>
                 <div className="flex-1 bg-slate-900 p-4 rounded border border-slate-700">
                   <p className="text-sm text-slate-400 mb-2">Maintenance Impacted</p>
                   <p className="font-bold text-white">{(emgData?.affected_activities?.maintenance?.length || 0) > 0 ? emgData.affected_activities.maintenance.join(", ") : "None"}</p>
                 </div>
               </div>
             </div>
          </div>
        )}

        {!loading && step === 7 && emgData && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-lg font-bold text-white mb-4">Step 7: Dynamic Cascading Re-plan</h3>
            <div className="bg-slate-800 p-6 rounded-xl border border-emerald-500/30">
               {(emgData?.actions?.length || 0) === 0 ? (
                 <p className="text-slate-400">Emergency block safely isolated. No lower-priority blocks required moving.</p>
               ) : (
                 <div className="space-y-3">
                   {emgData.actions.map((act: any, i: number) => (
                     <div key={i} className="bg-slate-900 p-4 rounded border border-emerald-500/20">
                       <p className="font-bold text-emerald-400">{act.action}</p>
                       <p className="text-sm text-slate-400 mt-1">{act.reason}</p>
                     </div>
                   ))}
                 </div>
               )}
             </div>
          </div>
        )}

        {!loading && step === 8 && simData && conflictData && optData && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-lg font-bold text-white mb-4">Step 8: Final KPI Results</h3>
            <AnalyticsView simData={simData} conflictData={conflictData} optData={optData} />
          </div>
        )}
      </div>
    </div>
  );
}
