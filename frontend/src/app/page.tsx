"use client";

import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, BarChart3, Calendar, Clock, Map, Play, Settings, ShieldAlert, Zap } from 'lucide-react';
import { getApiUrl } from '../lib/api';
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
  
  const [emgData, setEmgData] = useState<any>(null);
  const [dataMode, setDataMode] = useState<any>(null);

  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch
    Promise.all([
      fetch(getApiUrl("/api/simulation")).then(r => { if (!r.ok) throw new Error("Failed to load simulation"); return r.json(); }),
      fetch(getApiUrl("/api/conflicts")).then(r => { if (!r.ok) throw new Error("Failed to load conflicts"); return r.json(); }),
      fetch(getApiUrl("/api/maintenance/priorities")).then(r => { if (!r.ok) throw new Error("Failed to load priorities"); return r.json(); }),
      fetch(getApiUrl("/api/planning/weekly"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }).then(r => { if (!r.ok) throw new Error("Failed to run weekly plan"); return r.json(); }),
      fetch(getApiUrl("/api/data-mode")).then(r => { if (!r.ok) throw new Error("Failed to load data mode"); return r.json(); })
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
    } catch (e) {
      console.error(e);
      alert("Failed to run optimizer. Check backend connection.");
    }
    setIsOptimizing(false);
  };

  if (connectionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
        <div className="bg-rose-950/30 border border-rose-500/50 p-8 rounded-xl max-w-lg text-center shadow-[0_0_30px_rgba(225,29,72,0.15)]">
          <ShieldAlert className="mx-auto mb-4 text-rose-500" size={48} />
          <h2 className="text-2xl font-bold text-white mb-2">Connection Error</h2>
          <p className="text-slate-400">{connectionError}</p>
          <p className="text-slate-500 text-sm mt-4">API URL configured as: {getApiUrl("")}</p>
        </div>
      </div>
    );
  }

  if (!simData || !conflictData || !priorityData) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-emerald-400 font-bold animate-pulse">Initializing RailOptima AI Systems...</div>;
  }

  const maintCols = [
    { header: "ID", accessor: "request_id" },
    { header: "Dept", accessor: "department" },
    { header: "Section", accessor: "section" },
    { header: "Priority", accessor: "priority_level", render: (v: string) => (
      <span className={`px-2 py-1 rounded text-xs font-bold ${v === 'CRITICAL' ? 'bg-rose-500/20 text-rose-500' : v === 'HIGH' ? 'bg-orange-500/20 text-orange-500' : 'bg-blue-500/20 text-blue-500'}`}>{v}</span>
    )},
    { header: "Score", accessor: "priority_score" },
    { header: "Duration", accessor: "duration", render: (v: number) => `${v}m` }
  ];

  const conflictCols = [
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
    { header: "Severity", accessor: "severity", render: (v: string) => (
      <span className={`px-2 py-1 rounded text-xs font-bold ${v === 'CRITICAL' ? 'bg-rose-500 text-white' : 'bg-orange-500 text-white'}`}>{v}</span>
    )},
    { header: "Reason", accessor: "reason", render: (v: string) => <span className="text-xs text-slate-300">{v}</span> }
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-300">
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-10 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-lg text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]">
              <Zap size={24} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black text-white tracking-tight leading-none">RAIL<span className="text-emerald-400">OPTIMA</span> AI</h1>
              {dataMode?.mode === "simulation" && (
                <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider mt-1 flex items-center gap-1">
                  <Activity size={10} /> SIMULATION MODE — Synthetic Railway Operations Data
                </span>
              )}
            </div>
          </div>
          
          <nav className="flex gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
            {[
              { id: "overview", label: "Overview", icon: Activity },
              { id: "analytics", label: "Analytics & KPIs", icon: BarChart3 },
              { id: "maintenance", label: "Maintenance & Conflicts", icon: ShieldAlert },
              { id: "optimizer", label: "AI Optimizer", icon: Calendar },
              { id: "emergency", label: "Emergency Control", icon: AlertTriangle },
              { id: "demo", label: "SIH Demo Mode", icon: Play }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all ${activeTab === tab.id ? 'bg-emerald-500 text-white shadow-lg' : 'hover:bg-slate-700 text-slate-400'}`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-6">
        
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-4 gap-4">
              <StatCard title="Active Trains" value={simData?.trains?.length || 0} icon={Map} colorClass="text-blue-400" />
              <StatCard title="Pending Maintenance" value={simData?.maintenance?.length || 0} icon={Settings} colorClass="text-orange-400" />
              <StatCard title="Total Conflicts" value={conflictData?.summary_counts?.total || 0} icon={ShieldAlert} colorClass="text-rose-400" trend={`${conflictData?.summary_counts?.CRITICAL || 0} Critical`} />
              <StatCard title="Block Utilization" value={optData?.summary_metrics?.utilized_block_hours ? `${optData.summary_metrics.utilized_block_hours}h` : '0h'} icon={Clock} colorClass="text-emerald-400" />
            </div>
            <OperationalTimeline trains={simData?.trains || []} maintenance={simData?.maintenance || []} sections={simData?.sections || []} conflicts={conflictData?.conflicts || []} />
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <AnalyticsView simData={simData} conflictData={conflictData} optData={optData} />
          </div>
        )}

        {activeTab === "maintenance" && (
          <div className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <DataTable title="Scored Maintenance Queue" columns={maintCols} data={priorityData || []} />
            <DataTable title="Detected Schedule Conflicts" columns={conflictCols} data={conflictData?.conflicts || []} />
          </div>
        )}

        {activeTab === "optimizer" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Multi-Horizon Block Optimizer</h2>
                <p className="text-slate-400 text-sm">Our AI constraint engine will mathematically resolve overlaps and maximize block utilization.</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => runOptimizer("weekly")}
                  disabled={isOptimizing}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded transition-colors"
                >
                  Generate Weekly Plan
                </button>
                <button 
                  onClick={() => runOptimizer("monthly")}
                  disabled={isOptimizing}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded transition-colors"
                >
                  Generate Monthly Plan
                </button>
              </div>
            </div>

            {isOptimizing && <div className="text-center p-12 text-emerald-400 animate-pulse font-bold text-xl">Optimizer Engine Running...</div>}

            {optData && !isOptimizing && (
              <>
                <div className="grid grid-cols-4 gap-4">
                  <StatCard title="Scheduled Requests" value={optData?.summary_metrics?.scheduled_requests || 0} icon={Settings} colorClass="text-emerald-400" trend={`${optData?.summary_metrics?.unscheduled_requests || 0} Unscheduled`} trendUp />
                  <StatCard title="Block Hours Utilized" value={optData?.summary_metrics?.utilized_block_hours || 0} icon={Clock} colorClass="text-emerald-400" trend={`Requested: ${optData?.summary_metrics?.block_hours || 0}h`} trendUp />
                  <StatCard title="Critical Tasks Completed" value={optData?.summary_metrics?.critical_maintenance_completed || 0} icon={Activity} colorClass="text-blue-400" />
                  <StatCard title="Conflicts Remaining" value={optData?.conflicts_after?.total || 0} icon={ShieldAlert} colorClass="text-emerald-400" trend={`Resolved ${optData?.summary_metrics?.conflicts_resolved || 0} overlaps`} trendUp />
                </div>
                <DataTable 
                  title={`Optimized ${optHorizon.charAt(0).toUpperCase() + optHorizon.slice(1)} Schedule`} 
                  columns={[...maintCols, { header: "Optimized Start", accessor: "start_time", render: (v: string) => <span className="text-emerald-400 font-mono">{v ? new Date(v).toLocaleString() : 'N/A'}</span> }]} 
                  data={optData?.scheduled_requests || []} 
                />
                
                {((optData?.scheduled_requests || []).some((r: any) => r.decision_explanation) || (optData?.unscheduled_requests || []).some((r: any) => r.decision_explanation)) && (
                    <div className="mt-8">
                        <h3 className="text-xl font-bold text-white mb-4">AI Decision Traces</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {(optData?.scheduled_requests || []).filter((r: any) => r.decision_explanation).map((req: any, i: number) => (
                                <DecisionCard key={`sched-${i}`} req={req} />
                            ))}
                            {(optData?.unscheduled_requests || []).filter((r: any) => r.decision_explanation).map((req: any, i: number) => (
                                <DecisionCard key={`unsched-${i}`} req={req} />
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="bg-slate-800 p-4 rounded text-center border border-slate-700 mt-6">
                    <p className="text-slate-400">
                        RailOptima evaluated <span className="text-white font-bold">{optData?.summary_metrics?.total_maintenance_requests || 0}</span> maintenance requests and resolved <span className="text-emerald-400 font-bold">{optData?.summary_metrics?.conflicts_resolved || 0}</span> scheduling conflicts while preserving <span className="text-blue-400 font-bold">{optData?.summary_metrics?.critical_maintenance_completed || 0}</span> critical maintenance tasks.
                    </p>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "emergency" && (
          <div className="grid grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="col-span-4">
              <EmergencyForm onReplan={setEmgData} sections={simData.sections} />
            </div>
            <div className="col-span-8">
              {emgData ? (
                <div className="space-y-6">
                  <div className="bg-slate-800 p-6 rounded-xl border border-rose-500/30">
                    <h3 className="text-rose-400 font-bold mb-4">Affected Operations</h3>
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
                  
                  <div className="bg-slate-800 p-6 rounded-xl border border-emerald-500/30">
                    <h3 className="text-emerald-400 font-bold mb-4">Cascading Re-allocations (Delta)</h3>
                    {(emgData?.actions?.length || 0) === 0 ? (
                      <p className="text-slate-400">No lower-priority blocks required moving.</p>
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
              ) : (
                <div className="bg-slate-800/50 p-12 rounded-xl border border-slate-700 border-dashed flex items-center justify-center h-full">
                  <p className="text-slate-500">Submit an emergency block to visualize cascading schedule impacts.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "demo" && (
          <div className="h-[800px] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <DemoWizard />
          </div>
        )}
        
      </main>
    </div>
  );
}
