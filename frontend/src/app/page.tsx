"use client";

import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, BarChart3, Calendar, Clock, Map, Play, Settings, ShieldAlert, Zap, Radio, Menu } from 'lucide-react';
import { getApiUrl } from '../lib/api';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import OperationalTimeline from '../components/OperationalTimeline';
import DataTable from '../components/DataTable';
import EmergencyForm from '../components/EmergencyForm';
import AnalyticsView from '../components/AnalyticsView';
import DemoWizard from '../components/DemoWizard';
import DecisionCard from '../components/DecisionCard';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [simData, setSimData] = useState<any>(null);
  const [conflictData, setConflictData] = useState<any>(null);
  const [priorityData, setPriorityData] = useState<any>(null);

  const [optHorizon, setOptHorizon] = useState("weekly");
  const [optData, setOptData] = useState<any>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optError, setOptError] = useState<string | null>(null);

  const [emgData, setEmgData] = useState<any>(null);
  const [dataMode, setDataMode] = useState<any>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(getApiUrl("/api/simulation")).then(r => { if (!r.ok) throw new Error("Failed to load simulation"); return r.json(); }),
      fetch(getApiUrl("/api/conflicts")).then(r => { if (!r.ok) throw new Error("Failed to load conflicts"); return r.json(); }),
      fetch(getApiUrl("/api/maintenance/priorities")).then(r => { if (!r.ok) throw new Error("Failed to load priorities"); return r.json(); }),
      fetch(getApiUrl("/api/planning/weekly"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }).then(r => { if (!r.ok) throw new Error("Failed to run weekly plan"); return r.json(); }),
      fetch(getApiUrl("/api/data-status")).then(r => { if (!r.ok) throw new Error("Failed to load data status"); return r.json(); })
    ]).then(([sim, conf, prio, opt, mode]) => {
      setSimData(sim);
      setConflictData(conf);
      setPriorityData(prio);
      setOptData(opt);
      setDataMode(mode);
      setConnectionError(null);
    }).catch(err => {
      console.error(err);
      setConnectionError("Failed to connect to the RailOptima backend API. Please ensure the backend server is running.");
    });
  }, []);

  const runOptimizer = async (horizon: string) => {
    setIsOptimizing(true);
    setOptError(null);
    setOptHorizon(horizon);
    try {
      const res = await fetch(getApiUrl(`/api/planning/${horizon}`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      const data = await res.json();
      setOptData(data);
    } catch (e: any) {
      console.error(e);
      setOptError(e.message || "Optimization could not be completed.");
    }
    setIsOptimizing(false);
  };

  // ── Connection Error Screen ──
  if (connectionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-deep)] text-white p-6">
        <div className="glass-panel-elevated glow-border-rose p-10 max-w-lg text-center">
          <ShieldAlert className="mx-auto mb-4 text-rose-400" size={48} />
          <h2 className="text-xl font-bold text-white mb-3">Connection Error</h2>
          <p className="text-[var(--text-secondary)] text-sm mb-2">{connectionError}</p>
          <p className="text-[var(--text-muted)] text-xs mb-6">API: {getApiUrl("")}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-lg font-bold transition-all">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // ── Loading Screen ──
  if (!simData || !conflictData || !priorityData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-deep)] gap-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center animate-dot-pulse">
          <Zap size={20} className="text-white" />
        </div>
        <p className="text-cyan-400 font-bold animate-pulse text-sm">Initializing RailOptima AI Systems...</p>
        <div className="flex gap-1">
          {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-cyan-400/50 animate-dot-pulse" style={{ animationDelay: `${i * 200}ms` }} />)}
        </div>
      </div>
    );
  }

  // ── Demo Mode (full screen) ──
  if (activeTab === "demo") {
    return <DemoWizard onExit={() => setActiveTab("overview")} />;
  }

  const maintCols = [
    { header: "ID", accessor: "request_id" },
    { header: "Dept", accessor: "department" },
    { header: "Section", accessor: "section" },
    { header: "Priority", accessor: "priority_level", render: (v: string) => (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${v === 'CRITICAL' ? 'bg-rose-500/15 text-rose-400' : v === 'HIGH' ? 'bg-amber-500/15 text-amber-400' : 'bg-cyan-500/15 text-cyan-400'}`}>{v}</span>
    )},
    { header: "Score", accessor: "priority_score" },
    { header: "Duration", accessor: "duration", render: (v: number) => <span className="font-mono">{v}m</span> }
  ];

  const conflictCols = [
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
    { header: "Severity", accessor: "severity", render: (v: string) => (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${v === 'CRITICAL' ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'}`}>{v}</span>
    )},
    { header: "Reason", accessor: "reason", render: (v: string) => <span className="text-[10px] text-[var(--text-muted)]">{v}</span> }
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-deep)] flex">
      {/* ── SIDEBAR ── */}
      <Sidebar activeTab={activeTab} onTabChange={(t) => { setActiveTab(t); setMobileOpen(false); }} dataMode={dataMode} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">

        {/* ── TOP BAR ── */}
        <header className="h-[52px] bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)]" onClick={() => setMobileOpen(true)}>
              <Menu size={20} />
            </button>
            <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
              {activeTab === "overview" && "Operations Overview"}
              {activeTab === "analytics" && "Analytics & KPIs"}
              {activeTab === "maintenance" && "Maintenance & Conflicts"}
              {activeTab === "optimizer" && "AI Optimizer"}
              {activeTab === "emergency" && "Emergency Control"}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {dataMode?.mode === "simulation" && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                <Radio size={12} className="animate-dot-pulse" /> Simulation Data
              </div>
            )}
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </header>

        {/* ── CONTENT AREA ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ════════ OVERVIEW ════════ */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-slide-in-up">
              {/* Hero */}
              <div className="glass-panel-elevated p-6 flex items-center justify-between overflow-hidden relative">
                <div>
                  <h1 className="text-2xl font-extrabold text-[var(--text-primary)] mb-1">Railway Operations Command Center</h1>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Real-time network monitoring, conflict detection, and AI-powered schedule optimization.
                  </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-primary-dim)] border border-cyan-400/20">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-dot-pulse" />
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    {dataMode?.mode === "simulation" ? "Simulation Active" : "Monitoring"}
                  </span>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Active Trains" value={simData?.trains?.length || 0} icon={Map} accentColor="info" />
                <StatCard title="Pending Maintenance" value={simData?.maintenance?.length || 0} icon={Settings} accentColor="amber" />
                <StatCard title="Total Conflicts" value={conflictData?.summary_counts?.total || 0} icon={ShieldAlert} accentColor="rose" trend={`${conflictData?.summary_counts?.CRITICAL || 0} Critical`} />
                <StatCard title="Block Utilization" value={optData?.summary_metrics?.utilized_block_hours ? `${optData.summary_metrics.utilized_block_hours}h` : '0h'} icon={Clock} accentColor="emerald" />
              </div>

              {/* Timeline */}
              <OperationalTimeline trains={simData?.trains || []} maintenance={simData?.maintenance || []} sections={simData?.sections || []} conflicts={conflictData?.conflicts || []} />
            </div>
          )}

          {/* ════════ ANALYTICS ════════ */}
          {activeTab === "analytics" && (
            <div className="animate-slide-in-up">
              <AnalyticsView simData={simData} conflictData={conflictData} optData={optData} />
            </div>
          )}

          {/* ════════ MAINTENANCE & CONFLICTS ════════ */}
          {activeTab === "maintenance" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-in-up">
              <DataTable title="Scored Maintenance Queue" columns={maintCols} data={priorityData || []} emptyMessage="No maintenance requests." />
              <DataTable title="Detected Schedule Conflicts" columns={conflictCols} data={conflictData?.conflicts || []} emptyMessage="Network is currently conflict-free." />
            </div>
          )}

          {/* ════════ AI OPTIMIZER ════════ */}
          {activeTab === "optimizer" && (
            <div className="space-y-6 animate-slide-in-up">
              {/* Controls */}
              <div className="glass-panel-elevated p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)] mb-1">Multi-Horizon Block Optimizer</h2>
                  <p className="text-[var(--text-secondary)] text-xs">Constraint-based engine resolves overlaps and maximizes block utilization.</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => runOptimizer("weekly")}
                    disabled={isOptimizing}
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-800 text-white font-bold py-2.5 px-5 rounded-lg transition-all text-sm shadow-lg shadow-cyan-900/20"
                  >
                    Weekly Plan
                  </button>
                  <button
                    onClick={() => runOptimizer("monthly")}
                    disabled={isOptimizing}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-800 text-white font-bold py-2.5 px-5 rounded-lg transition-all text-sm shadow-lg shadow-indigo-900/20"
                  >
                    Monthly Plan
                  </button>
                </div>
              </div>

              {/* Loading */}
              {isOptimizing && (
                <div className="glass-panel text-center p-12">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center mx-auto mb-4 animate-dot-pulse">
                    <Zap size={20} className="text-white" />
                  </div>
                  <p className="text-cyan-400 font-bold animate-pulse">Optimizer Engine Running...</p>
                </div>
              )}

              {/* Error */}
              {optError && (
                <div className="glass-panel glow-border-rose p-6 text-center">
                  <AlertTriangle className="mx-auto mb-3 text-rose-400" size={28} />
                  <p className="font-bold text-[var(--text-primary)] mb-2">Optimization Failed</p>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">{optError}</p>
                  <button onClick={() => runOptimizer(optHorizon)} className="px-5 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-lg font-bold transition-all text-sm">
                    Retry
                  </button>
                </div>
              )}

              {/* Results */}
              {optData && !isOptimizing && !optError && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Scheduled" value={optData?.summary_metrics?.scheduled_requests || 0} icon={Settings} accentColor="emerald" trend={`${optData?.summary_metrics?.unscheduled_requests || 0} Unscheduled`} trendUp />
                    <StatCard title="Block Hours" value={optData?.summary_metrics?.utilized_block_hours || 0} icon={Clock} accentColor="cyan" trend={`Requested: ${optData?.summary_metrics?.block_hours || 0}h`} trendUp />
                    <StatCard title="Critical Done" value={optData?.summary_metrics?.critical_maintenance_completed || 0} icon={Activity} accentColor="info" />
                    <StatCard title="Conflicts Left" value={optData?.conflicts_after?.total || 0} icon={ShieldAlert} accentColor="emerald" trend={`Resolved ${optData?.summary_metrics?.conflicts_resolved || 0}`} trendUp />
                  </div>

                  <DataTable
                    title={`Recommended ${optHorizon.charAt(0).toUpperCase() + optHorizon.slice(1)} Schedule`}
                    columns={[...maintCols, { header: "Optimized Start", accessor: "start_time", render: (v: string) => <span className="text-emerald-400 font-mono text-xs">{v ? new Date(v).toLocaleString() : 'N/A'}</span> }]}
                    data={optData?.scheduled_requests || []}
                    emptyMessage="No scheduled activities."
                  />

                  {/* Decision Cards */}
                  {((optData?.scheduled_requests || []).some((r: any) => r.decision_explanation) || (optData?.unscheduled_requests || []).some((r: any) => r.decision_explanation)) && (
                      <div>
                          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4 uppercase tracking-wider">Decision Intelligence — Why Each Block Was Moved</h3>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {(optData?.scheduled_requests || []).filter((r: any) => r.decision_explanation).map((req: any, i: number) => (
                                  <DecisionCard key={`sched-${i}`} req={req} />
                              ))}
                              {(optData?.unscheduled_requests || []).filter((r: any) => r.decision_explanation).map((req: any, i: number) => (
                                  <DecisionCard key={`unsched-${i}`} req={req} />
                              ))}
                          </div>
                      </div>
                  )}

                  <div className="glass-panel p-4 text-center">
                      <p className="text-[var(--text-secondary)] text-xs">
                          RailOptima evaluated <span className="text-[var(--text-primary)] font-bold">{optData?.summary_metrics?.total_maintenance_requests || 0}</span> maintenance requests and resolved <span className="text-emerald-400 font-bold">{optData?.summary_metrics?.conflicts_resolved || 0}</span> conflicts while preserving <span className="text-cyan-400 font-bold">{optData?.summary_metrics?.critical_maintenance_completed || 0}</span> critical tasks.
                      </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ════════ EMERGENCY CONTROL ════════ */}
          {activeTab === "emergency" && (
            <div className="space-y-6 animate-slide-in-up">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4">
                  <EmergencyForm onReplan={setEmgData} sections={simData.sections} />
                </div>
                <div className="lg:col-span-8">
                  {emgData ? (
                    <div className="glass-panel-elevated p-6 glow-border-rose animate-slide-in-up">
                      <h2 className="text-sm font-bold text-[var(--text-primary)] mb-5 flex items-center gap-2 uppercase tracking-wider">
                        <AlertTriangle className="text-rose-400" size={16}/> Emergency Impact Report
                      </h2>
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
                  ) : (
                    <div className="glass-panel border-dashed p-12 flex items-center justify-center h-full">
                      <div className="text-center">
                        <AlertTriangle className="mx-auto mb-3 text-[var(--text-muted)]" size={32} />
                        <p className="text-[var(--text-muted)] text-sm">Submit an emergency block to visualize cascading schedule impacts.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {emgData && (
                  <div className="space-y-6">
                      <div className="glass-panel-elevated p-6">
                          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-5 uppercase tracking-wider">Emergency Replanning Timeline</h3>
                          <OperationalTimeline
                              trains={simData.trains}
                              maintenance={simData.maintenance}
                              sections={simData.sections}
                              emgData={emgData}
                          />
                      </div>

                      {(emgData.actions?.length > 0) && (
                          <div>
                              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4 uppercase tracking-wider">Replanning Decision Intelligence</h3>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                  {emgData.after_schedule.filter((r: any) => r.decision_explanation).map((req: any, i: number) => (
                                      <DecisionCard key={`emg-sched-${i}`} req={req} />
                                  ))}
                                  {emgData.unscheduled_requests?.map((req: any, i: number) => (
                                      <DecisionCard key={`emg-unsched-${i}`} req={req} />
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
