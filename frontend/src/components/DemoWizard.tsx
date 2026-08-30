"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRight, ArrowLeft, RotateCcw, AlertTriangle, AlertCircle, CheckCircle, Activity, Zap, LayoutDashboard, X, ChevronRight } from 'lucide-react';
import { getApiUrl } from '../lib/api';
import OperationalTimeline from './OperationalTimeline';
import DataTable from './DataTable';
import DecisionCard from './DecisionCard';

export default function DemoWizard({ onExit }: { onExit?: () => void }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [simData, setSimData] = useState<any>(null);
  const [conflictData, setConflictData] = useState<any>(null);
  const [priorityData, setPriorityData] = useState<any>(null);
  const [optData, setOptData] = useState<any>(null);
  const [emgData, setEmgData] = useState<any>(null);

  const steps = [
    { label: "Network Baseline", short: "Baseline" },
    { label: "Conflict Detection", short: "Conflicts" },
    { label: "Priority Analysis", short: "Priorities" },
    { label: "AI Optimization", short: "Optimize" },
    { label: "Decision Explanations", short: "Explain" },
    { label: "Emergency Disruption", short: "Emergency" },
    { label: "Automatic Replanning", short: "Replan" },
    { label: "Final Summary", short: "Summary" },
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
      setError(err.message || "An unexpected error occurred.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStepData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNext = useCallback(() => { if (step < 8) fetchStepData(step + 1); }, [step]);
  const handlePrev = useCallback(() => { if (step > 1) fetchStepData(step - 1); }, [step]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); handleNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); handlePrev(); }
      if (e.key === 'Escape' && onExit) { onExit(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleNext, handlePrev, onExit]);

  const resetDemo = () => {
    setSimData(null);
    setConflictData(null);
    setPriorityData(null);
    setOptData(null);
    setEmgData(null);
    fetchStepData(1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-deep)] flex flex-col">
      {/* ── PRESENTATION HEADER ── */}
      <header className="shrink-0 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg"
               style={{ boxShadow: '0 0 15px rgba(34,211,238,0.25)' }}>
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-[var(--text-primary)] tracking-tight">
              RAIL<span className="text-gradient-cyan">OPTIMA</span> AI
            </h1>
            <p className="text-xs text-[var(--text-muted)] tracking-wider uppercase">Smart India Hackathon 2026</p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="hidden md:flex items-center gap-1">
          {steps.map((s, i) => (
            <React.Fragment key={i}>
              <button
                onClick={() => fetchStepData(i + 1)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  i + 1 === step
                    ? 'bg-[var(--accent-primary-dim)] text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.1)]'
                    : i + 1 < step
                      ? 'text-emerald-400'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {i + 1 < step ? <CheckCircle size={12} /> : <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[8px]">{i + 1}</span>}
                <span className="hidden lg:inline">{s.short}</span>
              </button>
              {i < steps.length - 1 && <ChevronRight size={14} className="text-[var(--text-muted)]" />}
            </React.Fragment>
          ))}
        </div>
        <div className="md:hidden text-xs font-bold text-cyan-400">
          STEP {step} OF 8
        </div>

        <div className="flex items-center gap-2">
          <button onClick={resetDemo} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-secondary)] text-xs font-medium transition-colors">
            <RotateCcw size={12} /> Reset
          </button>
          {onExit && (
            <button onClick={onExit} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-secondary)] text-xs font-medium transition-colors">
              <X size={12} /> Exit
            </button>
          )}
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="flex-1 overflow-y-auto p-6 lg:px-12 flex flex-col">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center animate-dot-pulse">
              <Zap size={24} className="text-white" />
            </div>
            <p className="text-cyan-400 font-bold animate-pulse text-sm">Processing Live Backend Algorithms...</p>
          </div>
        )}

        {/* Error */}
        {error && (
            <div className="flex flex-col items-center justify-center h-full text-center p-12">
                <div className="glass-panel-elevated glow-border-rose p-10 max-w-md">
                  <AlertTriangle className="mx-auto text-rose-400 mb-4" size={40} />
                  <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">API Error (Step {step})</h2>
                  <p className="text-rose-400 text-sm mb-6">{error}</p>
                  <button onClick={() => fetchStepData(step)} className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-lg font-bold transition-all">
                      Retry
                  </button>
                </div>
            </div>
        )}

        {/* ── STEP 1: Network Baseline ── */}
        {!loading && !error && step === 1 && simData && (
          <div className="animate-slide-in-up max-w-6xl mx-auto my-auto w-full py-6">
            <h3 className="text-2xl font-extrabold text-[var(--text-primary)] mb-2">Network Baseline</h3>
            <p className="text-[var(--text-secondary)] text-sm mb-6">Current snapshot of the railway network with active trains and pending maintenance requests.</p>

            {/* Architecture Flow */}
            <div className="glass-panel p-5 mb-6 flex items-center justify-between text-center">
                {[
                  { icon: Activity, label: "Data Source", color: "text-amber-400", bg: "bg-amber-400/10" },
                  { icon: Zap, label: "Normalization", color: "text-cyan-400", bg: "bg-cyan-400/10" },
                  { icon: CheckCircle, label: "Optimizer", color: "text-emerald-400", bg: "bg-emerald-400/10" },
                  { icon: AlertTriangle, label: "Emergency AI", color: "text-rose-400", bg: "bg-rose-400/10" },
                ].map((item, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <ArrowRight className="text-[var(--text-muted)] shrink-0" size={14} />}
                    <div className="flex flex-col items-center gap-2 px-4">
                      <div className={`p-3 rounded-xl ${item.bg} border border-[var(--border-subtle)]`}>
                        <item.icon size={20} className={item.color} />
                      </div>
                      <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">{item.label}</span>
                    </div>
                  </React.Fragment>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="glass-panel p-4 accent-left-info">
                    <p className="text-xs text-[var(--text-muted)] mb-1">Active Trains</p>
                    <p className="text-3xl font-bold text-cyan-400 font-mono">{simData.trains?.length || 0}</p>
                </div>
                <div className="glass-panel p-4 accent-left-amber">
                    <p className="text-xs text-[var(--text-muted)] mb-1">Pending Maintenance</p>
                    <p className="text-3xl font-bold text-amber-400 font-mono">{simData.maintenance?.length || 0}</p>
                </div>
            </div>

            <OperationalTimeline trains={simData.trains} maintenance={simData.maintenance} sections={simData.sections} />
          </div>
        )}

        {/* ── STEP 2: Conflict Detection ── */}
        {!loading && !error && step === 2 && conflictData && (
          <div className="animate-slide-in-up max-w-6xl mx-auto my-auto w-full py-6">
            <h3 className="text-2xl font-extrabold text-[var(--text-primary)] mb-2">Conflict Detection</h3>
            <p className="text-[var(--text-secondary)] text-sm mb-6">The uncoordinated schedule contains significant overlaps. The engine has detected critical conflicts.</p>

            <div className="glass-panel glow-border-rose p-5 mb-6 flex items-center gap-3">
              <AlertTriangle size={22} className="text-rose-400 shrink-0" />
              <span className="font-bold text-lg text-rose-400">{conflictData.summary_counts?.total || 0}</span>
              <span className="text-[var(--text-secondary)] text-sm">Total Conflicts Detected</span>
            </div>

            <DataTable title="Detected Overlaps (Before Optimization)" columns={[
                { header: "Conflict", accessor: "activity_1", render: (v: any, row: any) => (
                  <div>
                    <p className="font-bold text-sm text-[var(--text-primary)]">{row.activity_1} vs {row.activity_2}</p>
                    {row.activity_1_type && <p className="text-[10px] text-[var(--text-muted)]">{row.activity_1_type} vs {row.activity_2_type}</p>}
                  </div>
                )},
                { header: "Location", accessor: "section", render: (v: any, row: any) => (
                  <div>
                    <p className="text-[var(--text-secondary)] font-mono text-xs">{row.section}</p>
                    {row.track && row.track !== "Unknown" && <p className="text-[10px] text-[var(--text-muted)] font-mono">{row.track}</p>}
                  </div>
                )},
                { header: "Overlap", accessor: "overlap_start", render: (v: any, row: any) => {
                  if (!row.overlap_start) return <span className="text-[var(--text-muted)]">N/A</span>;
                  return (
                  <div>
                    <p className="text-[var(--text-secondary)] text-xs font-mono">
                      {new Date(row.overlap_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → {new Date(row.overlap_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[10px] text-amber-400 font-bold">{row.overlap_duration_minutes}m</p>
                  </div>
                )}},
                { header: "Severity", accessor: "severity", render: (v: string) => <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${v === 'CRITICAL' ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'}`}>{v}</span> },
                { header: "Reason", accessor: "reason", render: (v: string) => <span className="text-[10px] text-[var(--text-muted)]">{v}</span> }
            ]} data={conflictData.conflicts || []} emptyMessage="Network is currently conflict-free." />

            <div className="mt-6">
              <OperationalTimeline trains={simData.trains} maintenance={simData.maintenance} sections={simData.sections} conflicts={conflictData.conflicts || []} />
            </div>
          </div>
        )}

        {/* ── STEP 3: Priority Analysis ── */}
        {!loading && !error && step === 3 && priorityData && (
          <div className="animate-slide-in-up max-w-6xl mx-auto my-auto w-full py-6">
            <h3 className="text-2xl font-extrabold text-[var(--text-primary)] mb-2">Priority Analysis</h3>
            <p className="text-[var(--text-secondary)] text-sm mb-6">Maintenance blocks are objectively scored and ranked. Critical blocks are protected during conflict resolution.</p>
            <DataTable title="Scored Maintenance Queue" columns={[
                { header: "ID", accessor: "request_id" },
                { header: "Dept", accessor: "department" },
                { header: "Section", accessor: "section" },
                { header: "Priority", accessor: "priority_level", render: (val: string) => <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${val === 'CRITICAL' ? 'bg-rose-500/15 text-rose-400' : val === 'HIGH' ? 'bg-amber-500/15 text-amber-400' : 'bg-cyan-500/15 text-cyan-400'}`}>{val}</span> },
                { header: "Score", accessor: "priority_score" },
                { header: "Duration", accessor: "duration", render: (val: number) => <span className="font-mono">{val}m</span> }
            ]} data={priorityData || []} emptyMessage="No maintenance requests." />
          </div>
        )}

        {/* ── STEP 4: AI Optimization ── */}
        {!loading && !error && step === 4 && optData && (
          <div className="animate-slide-in-up space-y-6 max-w-6xl mx-auto my-auto w-full py-6">
            <h3 className="text-2xl font-extrabold text-[var(--text-primary)] mb-2">AI Optimization</h3>
            <p className="text-[var(--text-secondary)] text-sm mb-2">The constraint-based optimizer resolves overlaps by shifting or rejecting blocks based on priorities.</p>

            <div className="glass-panel glow-border-emerald p-5 flex items-center gap-3">
              <CheckCircle size={22} className="text-emerald-400 shrink-0" />
              <span className="font-bold text-lg text-emerald-400">{optData.summary_metrics?.scheduled_requests || 0} blocks</span>
              <span className="text-[var(--text-secondary)] text-sm">scheduled in optimized master plan</span>
            </div>

            <DataTable title="Optimized Master Schedule" columns={[
                { header: "ID", accessor: "request_id" },
                { header: "Dept", accessor: "department" },
                { header: "Status", accessor: "status", render: (val: string) => <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${val === 'Scheduled' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>{val}</span> },
                { header: "Optimized Start", accessor: "start_time", render: (val: string) => <span className="text-emerald-400 font-mono text-xs">{val ? new Date(val).toLocaleString() : "Unscheduled"}</span> },
                { header: "Reason", accessor: "reason", render: (val: string) => val ? <span className="text-[10px] text-[var(--text-muted)]">{val}</span> : <span className="text-[var(--text-muted)] text-xs">N/A</span> }
            ]} data={optData.scheduled_requests || []} emptyMessage="No scheduled activities." />

            <OperationalTimeline trains={simData.trains} maintenance={simData.maintenance} sections={simData.sections} conflicts={optData.conflicts_after?.conflicts || []} optData={optData} />
          </div>
        )}

        {/* ── STEP 5: Decision Explanations ── */}
        {!loading && !error && step === 5 && optData && (
          <div className="animate-slide-in-up space-y-6 max-w-6xl mx-auto my-auto w-full py-6">
            <h3 className="text-2xl font-extrabold text-[var(--text-primary)] mb-2">Why Did RailOptima Move These Blocks?</h3>
            <p className="text-[var(--text-secondary)] text-sm mb-4">Each decision is traceable — from the conflict that caused it to the final operational impact.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {(optData?.scheduled_requests || []).filter((r: any) => r.decision_explanation).map((req: any, i: number) => (
                    <DecisionCard key={`demo-sched-${i}`} req={req} />
                ))}
                {(optData?.unscheduled_requests || []).filter((r: any) => r.decision_explanation).map((req: any, i: number) => (
                    <DecisionCard key={`demo-unsched-${i}`} req={req} />
                ))}
            </div>
          </div>
        )}

        {/* ── STEP 6: Emergency Disruption ── */}
        {!loading && !error && step === 6 && emgData && (
          <div className="animate-slide-in-up max-w-6xl mx-auto my-auto w-full py-6">
            <h3 className="text-2xl font-extrabold text-[var(--text-primary)] mb-2">Emergency Disruption</h3>
            <p className="text-[var(--text-secondary)] text-sm mb-6">A critical track defect requires an immediate emergency block, disrupting the optimized schedule.</p>

            <div className="glass-panel-elevated glow-border-rose p-6 mb-6">
              <h4 className="text-rose-400 font-bold text-sm mb-4 flex items-center gap-2 uppercase tracking-wider"><AlertCircle size={16} /> Injecting Critical Emergency</h4>
              <div className="grid grid-cols-3 gap-4 text-sm font-mono text-[var(--text-primary)]">
                <div><span className="text-[var(--text-muted)] text-xs block mb-1">Request ID</span>EMG_DEMO_1</div>
                <div><span className="text-[var(--text-muted)] text-xs block mb-1">Section</span>SEC_1</div>
                <div><span className="text-[var(--text-muted)] text-xs block mb-1">Duration</span>2026-09-01T10:00 (120m)</div>
              </div>
            </div>

            <div className="glass-panel p-5 mb-6 accent-left-amber">
               <h4 className="text-amber-400 font-bold text-xs uppercase tracking-wider mb-3">Operations in Emergency Window</h4>
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-[var(--bg-deep)] p-3 rounded-lg border border-[var(--border-subtle)]">
                   <p className="text-[10px] text-[var(--text-muted)] mb-1">Trains Impacted</p>
                   <p className="font-bold text-sm text-[var(--text-primary)]">{(emgData.affected_activities?.trains?.length || 0) > 0 ? emgData.affected_activities.trains.join(", ") : "None"}</p>
                 </div>
                 <div className="bg-[var(--bg-deep)] p-3 rounded-lg border border-[var(--border-subtle)]">
                   <p className="text-[10px] text-[var(--text-muted)] mb-1">Maintenance Impacted</p>
                   <p className="font-bold text-sm text-[var(--text-primary)]">{(emgData.affected_activities?.maintenance?.length || 0) > 0 ? emgData.affected_activities.maintenance.join(", ") : "None"}</p>
                 </div>
               </div>
            </div>

            <OperationalTimeline trains={simData.trains} maintenance={simData.maintenance} sections={simData.sections} optData={optData} highlightSectionId="SEC_1" />
          </div>
        )}

        {/* ── STEP 7: Automatic Replanning ── */}
        {!loading && !error && step === 7 && emgData && (
          <div className="animate-slide-in-up max-w-6xl mx-auto my-auto w-full py-6">
            <h3 className="text-2xl font-extrabold text-[var(--text-primary)] mb-2">Automatic Surgical Replanning</h3>
            <p className="text-[var(--text-secondary)] text-sm mb-6">RailOptima isolates the emergency and performs cascading replanning only on affected operations.</p>

            <div className="glass-panel-elevated glow-border-rose p-6 mb-6">
                <h4 className="text-sm font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <AlertTriangle className="text-rose-400" size={16}/> Impact Report
                </h4>
                <div className="grid grid-cols-5 gap-3 text-center">
                    {[
                      { label: "Direct", value: emgData.summary_metrics?.directly_affected || 0, color: "text-rose-400" },
                      { label: "Cascade", value: emgData.summary_metrics?.cascade_affected || 0, color: "text-amber-400" },
                      { label: "Unchanged", value: emgData.summary_metrics?.unchanged || 0, color: "text-emerald-400" },
                      { label: "Shifted", value: emgData.summary_metrics?.shifted || 0, color: "text-cyan-400" },
                      { label: "Unscheduled", value: emgData.summary_metrics?.unscheduled || 0, color: "text-[var(--text-muted)]" },
                    ].map((item, i) => (
                      <div key={i} className="bg-[var(--bg-deep)] p-3 rounded-lg border border-[var(--border-subtle)]">
                          <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider font-bold">{item.label}</p>
                          <p className={`text-2xl font-bold ${item.color} font-mono`}>{item.value}</p>
                      </div>
                    ))}
                </div>

                {emgData.summary_metrics?.cascade_affected > 0 ? (
                    <div className="mt-5 bg-[var(--bg-deep)] p-4 rounded-lg border border-amber-500/15">
                        <p className="text-[10px] font-bold text-amber-400 mb-2 uppercase tracking-wider">Cascade Flow</p>
                        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] flex-wrap">
                            <span className="bg-rose-500 text-white px-2.5 py-1 rounded-full text-[10px] font-bold">Emergency</span>
                            {emgData.summary_metrics.cascade_activities.map((act: string, i: number) => (
                                <React.Fragment key={i}>
                                    <span className="text-[var(--text-muted)]">→</span>
                                    <span className="bg-amber-500/15 text-amber-400 px-2.5 py-1 rounded-full text-[10px] font-bold">{act} shifted</span>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="mt-5 bg-[var(--bg-deep)] p-4 rounded-lg border border-emerald-500/15 text-center">
                        <p className="text-xs font-bold text-emerald-400">No cascading movement detected.</p>
                    </div>
                )}
            </div>

            <OperationalTimeline trains={simData.trains} maintenance={simData.maintenance} sections={simData.sections} optData={optData} emgData={emgData} highlightSectionId="SEC_1" />
          </div>
        )}

        {/* ── STEP 8: Final Summary ── */}
        {!loading && !error && step === 8 && optData && emgData && conflictData && (
          <div className="animate-slide-in-up space-y-6 max-w-4xl mx-auto my-auto w-full py-6">
            <h3 className="text-2xl font-extrabold text-[var(--text-primary)] mb-2 text-center">Final Executive Summary</h3>
            <p className="text-[var(--text-secondary)] text-sm text-center mb-6">The system successfully resolved conflicts, optimized the schedule, and recovered from an emergency disruption.</p>

            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Blocks Shifted", value: emgData.summary_metrics?.shifted || 0, color: "text-cyan-400" },
                  { label: "Operations Saved", value: emgData.summary_metrics?.unchanged || 0, color: "text-emerald-400" },
                  { label: "Remaining Conflicts", value: 0, color: "text-cyan-400" },
                ].map((item, i) => (
                  <div key={i} className="glass-panel-elevated p-5 text-center interactive-card">
                      <p className="text-xs text-[var(--text-muted)] mb-2">{item.label}</p>
                      <p className={`text-4xl font-bold ${item.color} font-mono`}>{item.value}</p>
                  </div>
                ))}
            </div>

            {(emgData.actions?.length > 0) && (
                <div className="mb-6">
                    <h4 className="text-sm font-bold text-[var(--text-primary)] mb-4 uppercase tracking-wider">Emergency Decision Intelligence</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {emgData.after_schedule.filter((r: any) => r.decision_explanation && r.status != 'Emergency Scheduled').map((req: any, i: number) => (
                            <DecisionCard key={`demo-emg-sched-${i}`} req={req} />
                        ))}
                        {emgData.unscheduled_requests?.map((req: any, i: number) => (
                            <DecisionCard key={`demo-emg-unsched-${i}`} req={req} />
                        ))}
                    </div>
                </div>
            )}

            <div className="glass-panel-elevated glow-border-emerald p-8 text-center">
                <CheckCircle className="mx-auto text-emerald-400 mb-4" size={48} />
                <h2 className="text-2xl font-extrabold text-gradient-emerald mb-2">Ready for Operation</h2>
                <p className="text-[var(--text-secondary)] text-sm">RailOptima AI has dynamically recovered the railway network schedule.</p>
            </div>
          </div>
        )}
      </div>

      {/* ── FOOTER CONTROLS ── */}
      <footer className="shrink-0 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--text-muted)] font-mono">Step {step}/8</span>
            <div className="flex gap-1">
                {[1,2,3,4,5,6,7,8].map(i => (
                    <div key={i} className={`w-8 h-1.5 rounded-full transition-all duration-300 ${
                      i <= step ? 'bg-gradient-to-r from-cyan-400 to-emerald-400' : 'bg-[var(--bg-elevated)]'
                    }`} />
                ))}
            </div>
          </div>
          <div className="flex gap-3">
              <button onClick={handlePrev} disabled={step === 1 || loading} className="flex items-center gap-2 px-5 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] disabled:opacity-30 border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] font-bold transition-all text-sm">
                  <ArrowLeft size={14} /> Back
              </button>
              <button onClick={handleNext} disabled={step === 8 || loading} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-30 rounded-lg text-white font-bold transition-all text-sm shadow-lg shadow-cyan-900/20">
                  Next <ArrowRight size={14} />
              </button>
          </div>
      </footer>
    </div>
  );
}
