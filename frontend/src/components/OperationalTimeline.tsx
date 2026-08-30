import React, { useState, useMemo } from 'react';
import { AlertCircle, ShieldAlert, XCircle, Info, Clock, CheckCircle, Train, Wrench } from 'lucide-react';
import DecisionCard from './DecisionCard';

interface TimelineProps {
  trains?: any[];
  maintenance?: any[];
  conflicts?: any[];
  optData?: any;
  emgData?: any;
  sections?: any[];
  highlightSectionId?: string | null;
}

export default function OperationalTimeline({ trains = [], maintenance = [], conflicts = [], optData, emgData, sections = [], highlightSectionId }: TimelineProps) {
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // 1. Determine active maintenance set
  const activeMaint = optData ? optData.scheduled_requests : maintenance;
  const unscheduledMaint = optData ? optData.unscheduled_requests : [];

  // 2. Compute min and max times
  const { minTime, maxTime, totalDurationMs } = useMemo(() => {
    let minT = Infinity;
    let maxT = -Infinity;

    const processTime = (iso: string) => {
      if (!iso) return;
      const t = new Date(iso).getTime();
      if (t < minT) minT = t;
      if (t > maxT) maxT = t;
    };

    trains.forEach(t => {
      processTime(t.planned_start);
      processTime(t.planned_end);
    });

    activeMaint.forEach((m: any) => {
      processTime(m.start_time || m.original_start);
      processTime(m.end_time || m.original_end);
    });

    conflicts.forEach(c => {
      processTime(c.overlap_start);
      processTime(c.overlap_end);
    });

    if (emgData && emgData.after_schedule) {
        emgData.after_schedule.forEach((m: any) => {
            processTime(m.start_time || m.original_start);
            processTime(m.end_time || m.original_end);
        });
    }

    if (minT === Infinity) {
      const now = Date.now();
      return { minTime: now, maxTime: now + 3600000, totalDurationMs: 3600000 };
    }

    minT -= 30 * 60000;
    maxT += 30 * 60000;
    const duration = maxT - minT;

    return { minTime: minT, maxTime: maxT, totalDurationMs: duration };
  }, [trains, activeMaint, conflicts, emgData]);

  const getPosition = (startIso: string, endIso: string) => {
    if (!startIso || !endIso) return { left: '0%', width: '0%' };
    const st = new Date(startIso).getTime();
    const et = new Date(endIso).getTime();

    let leftPct = ((st - minTime) / totalDurationMs) * 100;
    let widthPct = ((et - st) / totalDurationMs) * 100;

    if (leftPct < 0) {
      widthPct += leftPct;
      leftPct = 0;
    }
    if (leftPct + widthPct > 100) {
      widthPct = 100 - leftPct;
    }

    return {
      left: `${Math.max(0, leftPct)}%`,
      width: `${Math.max(0.5, widthPct)}%`
    };
  };

  // 3. Time Axis Ticks
  const timeTicks = useMemo(() => {
    const ticks = [];
    const startHour = new Date(minTime);
    startHour.setMinutes(0, 0, 0);
    let current = startHour.getTime();

    while (current <= maxTime) {
      if (current >= minTime) {
        ticks.push(current);
      }
      current += 3600000;
    }
    return ticks;
  }, [minTime, maxTime]);

  // 4. Group data by Section -> Track
  const groupedData = useMemo(() => {
    const map = new Map<string, Map<string, { trains: any[], maint: any[], conflicts: any[] }>>();

    sections.forEach(s => {
      const trackMap = new Map();
      trackMap.set("Unknown", { trains: [], maint: [], conflicts: [] });
      if (s.tracks) {
        s.tracks.forEach((t: string) => trackMap.set(t, { trains: [], maint: [], conflicts: [] }));
      }
      map.set(s.section_id, trackMap);
    });

    const getGroup = (sec: string, trk: string | undefined | null) => {
      if (!map.has(sec)) {
        map.set(sec, new Map());
      }
      const trackMap = map.get(sec)!;
      const trackKey = trk && trk !== "Unknown" ? trk : "Unknown";
      if (!trackMap.has(trackKey)) {
        trackMap.set(trackKey, { trains: [], maint: [], conflicts: [] });
      }
      return trackMap.get(trackKey)!;
    };

    let displayTrains = trains;
    let displayMaint = activeMaint;

    if (emgData && emgData.after_schedule) {
        const emgBlock = emgData.after_schedule.find((r: any) => r.status === "Emergency Scheduled");
        displayTrains = [...trains, {
            train_id: emgBlock?.request_id || "EMG",
            train_type: "Emergency Block",
            section: emgBlock?.section,
            track: emgBlock?.track,
            planned_start: emgBlock?.start_time,
            planned_end: emgBlock?.end_time,
            isEmergency: true
        }];
        displayMaint = emgData.after_schedule.filter((r: any) => r.status !== "Emergency Scheduled");
    }

    displayTrains.forEach(t => getGroup(t.section, t.track).trains.push(t));
    displayMaint.forEach((m: any) => getGroup(m.section, m.track).maint.push(m));
    conflicts.forEach(c => getGroup(c.section, c.track).conflicts.push(c));

    return map;
  }, [trains, activeMaint, conflicts, sections, emgData]);

  const formatTime = (iso: string) => iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="flex flex-col gap-5 w-full">

      {/* ── LEGEND ── */}
      <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-2.5 rounded-sm bg-gradient-to-r from-blue-500 to-blue-600 border border-blue-400/50" />
          <span>Train</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-2.5 rounded-sm bg-gradient-to-r from-emerald-500 to-emerald-600 border border-emerald-400/50" />
          <span>Maintenance (Scheduled)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-2.5 rounded-sm bg-gradient-to-r from-amber-500 to-orange-600 border border-orange-400/50" />
          <span>Maintenance (Pending)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-2.5 rounded-sm border-2 border-dashed border-[var(--text-muted)]" />
          <span>Original Position</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-2.5 rounded-sm bg-rose-500/40 border border-rose-400/60 conflict-hatch" />
          <span>Conflict Zone</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-2.5 rounded-sm bg-rose-600 border border-rose-400 animate-dot-pulse" />
          <span>Emergency</span>
        </div>
      </div>

      {/* ── SECTION STATUS CHIPS ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
        {Array.from(groupedData.entries()).map(([secId, trackMap]) => {
          let hasConflict = false;
          let hasEmergency = false;
          trackMap.forEach(v => {
            if (v.conflicts.length > 0) hasConflict = true;
            if (v.trains.some(t => t.isEmergency)) hasEmergency = true;
          });
          const secName = sections.find(s => s.section_id === secId)?.name || secId;
          const isHighlighted = highlightSectionId === secId;

          return (
            <div key={secId} className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
              isHighlighted ? 'bg-indigo-900/30 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]' :
              hasEmergency ? 'bg-rose-950/30 border-rose-500/30 animate-border-pulse' :
              hasConflict ? 'bg-amber-950/20 border-amber-500/30' :
              'bg-[var(--bg-surface)] border-[var(--border-subtle)]'
            }`}>
              {hasEmergency ? <AlertCircle size={13} className="text-rose-400 animate-dot-pulse"/> :
               hasConflict ? <AlertCircle size={13} className="text-amber-400"/> :
               <CheckCircle size={13} className="text-emerald-400"/>}
              <div className="flex flex-col">
                <span className={`text-xs font-bold ${hasEmergency ? 'text-rose-400' : hasConflict ? 'text-amber-400' : 'text-[var(--text-secondary)]'}`}>{secId}</span>
                <span className="text-[10px] text-[var(--text-muted)] uppercase">{secName}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── TIMELINE CONTAINER ── */}
      <div className="glass-panel-elevated overflow-hidden relative flex flex-col">

        {/* TIME AXIS HEADER */}
        <div className="h-10 bg-[var(--bg-deep)] border-b border-[var(--border-subtle)] relative w-full flex items-end pb-1 overflow-hidden">
          <div className="w-44 shrink-0 border-r border-[var(--border-subtle)] h-full flex items-center px-4 bg-[var(--bg-deep)] z-10 sticky left-0">
             <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-[0.12em] flex items-center gap-1.5">
               <Clock size={14} /> Time Axis
             </span>
          </div>
          <div className="flex-1 relative h-full min-w-[800px]">
            {timeTicks.map(tick => {
              const left = ((tick - minTime) / totalDurationMs) * 100;
              return (
                <div key={tick} className="absolute h-full border-l border-[var(--border-subtle)]" style={{ left: `${left}%` }}>
                  <span className="text-xs font-bold text-[var(--text-muted)] ml-1.5 absolute bottom-1 font-mono">{new Date(tick).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* SCROLLABLE TRACKS */}
        <div className="overflow-x-auto">
          <div className="overflow-y-auto max-h-[550px] flex flex-col relative w-full min-w-[800px]">
          {Array.from(groupedData.entries()).map(([secId, trackMap]) => {
            const secInfo = sections.find(s => s.section_id === secId);
            const isHighlighted = highlightSectionId === secId;

            const tracksToRender = Array.from(trackMap.entries()).filter(([trk, data]) => {
                return data.trains.length > 0 || data.maint.length > 0 || data.conflicts.length > 0 || isHighlighted;
            });

            if (tracksToRender.length === 0) return null;

            return (
              <div key={secId} className={`flex flex-col border-b border-[var(--border-subtle)] transition-colors ${isHighlighted ? 'bg-indigo-950/10' : ''}`}>
                {/* SECTION HEADER */}
                <div className="bg-[var(--bg-elevated)] px-4 py-1.5 border-y border-[var(--border-subtle)] flex justify-between items-center sticky left-0 z-10 w-full min-w-max">
                   <span className="text-xs font-bold text-cyan-400 tracking-wide">{secInfo?.name || secId}</span>
                </div>

                {tracksToRender.map(([trk, data]) => (
                  <div key={`${secId}-${trk}`} className="flex relative min-h-[56px] border-b border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] transition-colors group">

                    {/* LEFT LABEL */}
                    <div className="w-44 shrink-0 bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] p-3 flex flex-col justify-center relative z-10 sticky left-0">
                       <span className="text-sm font-bold text-[var(--text-primary)]">{secId}</span>
                       <span className="text-xs font-mono text-[var(--text-muted)]">{trk !== "Unknown" ? trk : "Any Track"}</span>
                    </div>

                    {/* ACTIVITY LANE */}
                    <div className="flex-1 relative overflow-hidden">
                       {/* Grid lines */}
                       {timeTicks.map(tick => {
                         const left = ((tick - minTime) / totalDurationMs) * 100;
                         return <div key={tick} className="absolute h-full border-l border-[var(--border-subtle)]" style={{ left: `${left}%`, opacity: 0.4 }} />;
                       })}

                       {/* TRAINS */}
                       {data.trains.map(t => {
                         const { left, width } = getPosition(t.planned_start, t.planned_end);
                         const isEmg = t.isEmergency;
                         return (
                           <div
                             key={t.train_id}
                             onClick={() => setSelectedItem({ type: 'train', data: t })}
                             className={`absolute top-1.5 h-[22px] rounded cursor-pointer hover:brightness-125 transition-all overflow-hidden flex items-center px-2 gap-1 ${
                               isEmg
                                 ? 'bg-gradient-to-r from-rose-600 to-rose-700 border border-rose-400/80 z-20 shadow-[0_0_12px_rgba(244,63,94,0.5)] animate-border-pulse'
                                 : 'bg-gradient-to-r from-blue-500/90 to-blue-600/90 border border-blue-400/40'
                             }`}
                             style={{ left, width }}
                             title={`Train ${t.train_id} (${t.train_type})\n${formatTime(t.planned_start)} - ${formatTime(t.planned_end)}`}
                           >
                             <Train size={12} className="text-white/80 shrink-0" />
                             <span className="text-xs font-bold text-white truncate drop-shadow">{t.train_id}{isEmg && " (EMG)"}</span>
                           </div>
                         );
                       })}

                       {/* MAINTENANCE */}
                       {data.maint.map(m => {
                         const actualStart = m.start_time || m.original_start;
                         const actualEnd = m.end_time || m.original_end;
                         const { left, width } = getPosition(actualStart, actualEnd);
                         const isShifted = m.shifted;

                         return (
                           <React.Fragment key={m.request_id}>
                             {/* Ghost */}
                             {isShifted && m.original_start && (
                                <div
                                    className="absolute top-8 h-[22px] border-2 border-dashed border-rose-400/50 rounded flex items-center justify-center opacity-60"
                                    style={getPosition(m.original_start, m.original_end)}
                                >
                                    <span className="text-xs text-rose-300 font-bold uppercase px-1 truncate">Original</span>
                                </div>
                             )}

                             {/* Actual Block */}
                             <div
                               onClick={() => setSelectedItem({ type: 'maintenance', data: m })}
                               className={`absolute top-8 h-[22px] rounded cursor-pointer hover:brightness-125 transition-all overflow-hidden flex items-center px-2 gap-1 ${
                                 m.status === 'Scheduled'
                                   ? 'bg-gradient-to-r from-emerald-500/90 to-emerald-600/90 border border-emerald-400/40 shadow-[0_0_8px_rgba(52,211,153,0.15)]'
                                   : 'bg-gradient-to-r from-amber-500/80 to-orange-600/80 border border-orange-400/40'
                               }`}
                               style={{ left, width }}
                               title={`Maint ${m.request_id} (${m.department})\n${formatTime(actualStart)} - ${formatTime(actualEnd)}`}
                             >
                               <Wrench size={11} className="text-white/80 shrink-0" />
                               <span className="text-xs font-bold text-white truncate drop-shadow">{m.request_id}</span>
                             </div>

                             {/* Shift Arrow */}
                             {isShifted && m.original_start && m.start_time && new Date(m.original_start) < new Date(m.start_time) && (
                                <div
                                    className="absolute top-[38px] h-0.5 bg-gradient-to-r from-cyan-400/30 to-cyan-400/60 flex items-center z-0"
                                    style={{
                                        left: getPosition(m.original_end, m.start_time).left,
                                        width: getPosition(m.original_end, m.start_time).width
                                    }}
                                >
                                    <div className="w-2 h-2 border-t-2 border-r-2 border-cyan-400/70 rotate-45 absolute right-0 -translate-y-1/2 mt-[1px]"></div>
                                </div>
                             )}
                           </React.Fragment>
                         );
                       })}

                       {/* CONFLICT HIGHLIGHTS */}
                       {data.conflicts.map(c => {
                         const { left, width } = getPosition(c.overlap_start, c.overlap_end);
                         return (
                           <div
                             key={c.conflict_id}
                             onClick={() => setSelectedItem({ type: 'conflict', data: c })}
                             className="absolute top-0 bottom-0 conflict-hatch border-l-2 border-r-2 border-rose-500/60 z-30 cursor-pointer hover:bg-rose-500/20 transition-colors flex flex-col items-center justify-center"
                             style={{ left, width }}
                           >
                             {parseFloat(width) > 5 && (
                               <div className="bg-rose-600 text-white text-xs font-bold px-1.5 py-0.5 rounded shadow-lg flex items-center gap-1">
                                 <AlertCircle size={11} /> {c.overlap_duration_minutes}m
                               </div>
                             )}
                           </div>
                         );
                       })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
          </div>
        </div>
      </div>

      {/* ── DETAILS PANEL ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* UNSCHEDULED LIST */}
          {unscheduledMaint.length > 0 && (
            <div className="lg:col-span-4 glass-panel p-4 glow-border-rose flex flex-col gap-3">
              <h3 className="text-rose-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <XCircle size={14} /> Unscheduled / Rejected
              </h3>
              <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
                  {unscheduledMaint.map((m: any) => (
                      <div
                        key={m.request_id}
                        onClick={() => setSelectedItem({ type: 'maintenance', data: m })}
                        className="bg-[var(--bg-deep)] border border-[var(--border-subtle)] p-3 rounded-lg cursor-pointer hover:border-rose-500/40 transition-colors"
                      >
                          <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-sm text-[var(--text-primary)]">{m.request_id}</span>
                              <span className="text-xs bg-rose-500/15 text-rose-400 px-2 py-0.5 rounded-full font-bold">Rejected</span>
                          </div>
                          <span className="text-xs text-[var(--text-muted)] font-mono block">{m.section} {m.track ? `(${m.track})` : ''}</span>
                          <span className="text-xs text-[var(--text-muted)]">Requested: {formatTime(m.original_start)} → {formatTime(m.original_end)}</span>
                      </div>
                  ))}
              </div>
            </div>
          )}

          {/* ITEM DETAILS PANEL */}
          <div className={`${unscheduledMaint.length > 0 ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
            {selectedItem ? (
                <div className="animate-slide-in-up">
                    {selectedItem.type === 'maintenance' && selectedItem.data.decision_explanation ? (
                        <DecisionCard req={selectedItem.data} />
                    ) : selectedItem.type === 'conflict' ? (
                        <div className="glass-panel-elevated p-5 glow-border-rose flex flex-col gap-4">
                            <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
                                <ShieldAlert className="text-rose-400" size={18} />
                                <h4 className="font-bold text-rose-400 text-sm uppercase tracking-wider">Detected Conflict</h4>
                                <span className="ml-auto text-xs font-mono bg-[var(--bg-deep)] px-2 py-1 rounded text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                                    {selectedItem.data.conflict_id}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-[var(--bg-deep)] p-4 rounded-lg border border-[var(--border-subtle)]">
                                    <p className="text-[var(--text-muted)] text-xs font-bold mb-2 uppercase tracking-wider">Activities Involved</p>
                                    <p className="font-bold text-sm text-[var(--text-primary)]">{selectedItem.data.activity_1}</p>
                                    <p className="text-xs text-[var(--text-muted)] mb-2">{selectedItem.data.activity_1_type}</p>
                                    <p className="font-bold text-sm text-[var(--text-primary)]">{selectedItem.data.activity_2}</p>
                                    <p className="text-xs text-[var(--text-muted)]">{selectedItem.data.activity_2_type}</p>
                                </div>
                                <div className="bg-[var(--bg-deep)] p-4 rounded-lg border border-[var(--border-subtle)] flex flex-col justify-between">
                                    <div>
                                        <p className="text-[var(--text-muted)] text-xs font-bold mb-2 uppercase tracking-wider">Overlap Window</p>
                                        <p className="text-cyan-400 font-bold font-mono text-sm">{formatTime(selectedItem.data.overlap_start)} → {formatTime(selectedItem.data.overlap_end)}</p>
                                        <p className="text-sm text-[var(--text-secondary)] mt-1">{selectedItem.data.overlap_duration_minutes} minutes</p>
                                    </div>
                                    <div className="mt-3">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${selectedItem.data.severity === 'CRITICAL' ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'}`}>
                                            {selectedItem.data.severity}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-[var(--bg-deep)] p-3 rounded-lg border border-[var(--border-subtle)]">
                                <p className="text-[var(--text-muted)] text-xs font-bold mb-1 uppercase tracking-wider">Reason</p>
                                <p className="text-sm text-[var(--text-secondary)]">{selectedItem.data.reason}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="glass-panel p-5 flex items-center gap-4">
                            <Info size={20} className="text-cyan-400 shrink-0" />
                            <div>
                                <h4 className="font-bold text-[var(--text-primary)] uppercase text-sm">{selectedItem.type} Details</h4>
                                <p className="text-[var(--text-muted)] text-xs text-wrap break-all mt-1">{JSON.stringify(selectedItem.data)}</p>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="glass-panel border-dashed p-8 flex items-center justify-center h-full min-h-[120px]">
                    <p className="text-[var(--text-muted)] text-sm">Click on any train, maintenance block, or conflict in the timeline to view details and AI decisions.</p>
                </div>
            )}
          </div>
      </div>
    </div>
  );
}
