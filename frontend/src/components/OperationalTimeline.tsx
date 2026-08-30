import React, { useState, useMemo } from 'react';
import { AlertCircle, ArrowRight, ShieldAlert, XCircle, Info, Clock, CheckCircle } from 'lucide-react';
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
  // If we have optData, the active maintenance is scheduled_requests
  const activeMaint = optData ? optData.scheduled_requests : maintenance;
  const unscheduledMaint = optData ? optData.unscheduled_requests : [];

  // 2. Compute min and max times to define the bounds of the timeline
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
      // Default fallback
      const now = Date.now();
      return { minTime: now, maxTime: now + 3600000, totalDurationMs: 3600000 };
    }

    // Add a 30 min buffer on each side for visualization padding
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

    // Constrain to 0-100 for safety
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

  // 3. Generate Time Axis Ticks (every hour)
  const timeTicks = useMemo(() => {
    const ticks = [];
    const startHour = new Date(minTime);
    startHour.setMinutes(0, 0, 0);
    let current = startHour.getTime();
    
    while (current <= maxTime) {
      if (current >= minTime) {
        ticks.push(current);
      }
      current += 3600000; // +1 hour
    }
    return ticks;
  }, [minTime, maxTime]);

  // 4. Group data by Section -> Track
  const groupedData = useMemo(() => {
    const map = new Map<string, Map<string, { trains: any[], maint: any[], conflicts: any[] }>>();
    
    // Ensure all sections are in the map
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

    // If emgData has after_schedule, we should render THAT as active maintenance and mock train
    let displayTrains = trains;
    let displayMaint = activeMaint;

    if (emgData && emgData.after_schedule) {
        // Find emergency block
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

  // Helper to format time
  const formatTime = (iso: string) => iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="flex flex-col gap-6 w-full">
      
      {/* NETWORK OVERVIEW SUMMARY */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
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
            <div key={secId} className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border ${isHighlighted ? 'bg-indigo-900/40 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : hasEmergency ? 'bg-rose-900/20 border-rose-500/50' : hasConflict ? 'bg-orange-900/20 border-orange-500/50' : 'bg-slate-800 border-slate-700'}`}>
              {hasEmergency ? <AlertCircle size={14} className="text-rose-500 animate-pulse"/> : hasConflict ? <AlertCircle size={14} className="text-orange-500"/> : <CheckCircle size={14} className="text-emerald-500"/>}
              <div className="flex flex-col">
                <span className={`text-xs font-bold ${hasEmergency ? 'text-rose-400' : hasConflict ? 'text-orange-400' : 'text-slate-300'}`}>{secId}</span>
                <span className="text-[10px] text-slate-500 uppercase">{secName}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* TIMELINE CONTAINER */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl relative flex flex-col">
        
        {/* TIME AXIS HEADER */}
        <div className="h-10 bg-slate-800 border-b border-slate-700 relative w-full flex items-end pb-1 overflow-hidden">
          {/* Label spacer */}
          <div className="w-48 shrink-0 border-r border-slate-700 h-full flex items-center px-4 bg-slate-800/80 z-10 backdrop-blur">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest"><Clock size={12} className="inline mr-1 mb-0.5" /> Time Axis</span>
          </div>
          {/* Axis Track */}
          <div className="flex-1 relative h-full">
            {timeTicks.map(tick => {
              const left = ((tick - minTime) / totalDurationMs) * 100;
              return (
                <div key={tick} className="absolute h-full border-l border-slate-600/50" style={{ left: `${left}%` }}>
                  <span className="text-[10px] font-bold text-slate-400 ml-1 absolute bottom-1">{new Date(tick).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* SCROLLABLE TRACKS */}
        <div className="overflow-y-auto max-h-[600px] flex flex-col relative w-full">
          {Array.from(groupedData.entries()).map(([secId, trackMap]) => {
            const secInfo = sections.find(s => s.section_id === secId);
            const isHighlighted = highlightSectionId === secId;

            // Only render tracks that have activities OR are part of the highlighted section
            const tracksToRender = Array.from(trackMap.entries()).filter(([trk, data]) => {
                return data.trains.length > 0 || data.maint.length > 0 || data.conflicts.length > 0 || isHighlighted;
            });

            if (tracksToRender.length === 0) return null;

            return (
              <div key={secId} className={`flex flex-col border-b border-slate-800 transition-colors ${isHighlighted ? 'bg-indigo-900/10' : ''}`}>
                {/* SECTION HEADER BAR */}
                <div className="bg-slate-800/50 px-4 py-1 border-y border-slate-800 flex justify-between items-center sticky left-0 z-10">
                   <span className="text-xs font-bold text-emerald-400">{secInfo?.name || secId}</span>
                </div>

                {tracksToRender.map(([trk, data], idx) => (
                  <div key={`${secId}-${trk}`} className="flex relative min-h-[60px] border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                    
                    {/* LEFT LABEL */}
                    <div className="w-48 shrink-0 bg-slate-900 border-r border-slate-700 p-3 flex flex-col justify-center relative z-10">
                       <span className="text-sm font-bold text-slate-200">{secId}</span>
                       <span className="text-xs font-mono text-slate-500">{trk !== "Unknown" ? trk : "Any Track"}</span>
                    </div>

                    {/* ACTIVITY LANE */}
                    <div className="flex-1 relative overflow-hidden bg-[url('/grid-pattern.svg')]">
                       {/* Background grid lines matching ticks */}
                       {timeTicks.map(tick => {
                         const left = ((tick - minTime) / totalDurationMs) * 100;
                         return <div key={tick} className="absolute h-full border-l border-slate-700/30" style={{ left: `${left}%` }} />
                       })}

                       {/* TRAINS */}
                       {data.trains.map(t => {
                         const { left, width } = getPosition(t.planned_start, t.planned_end);
                         const isEmg = t.isEmergency;
                         return (
                           <div 
                             key={t.train_id} 
                             onClick={() => setSelectedItem({ type: 'train', data: t })}
                             className={`absolute top-2 h-6 rounded-sm border cursor-pointer hover:brightness-125 transition-all overflow-hidden flex items-center px-2 ${isEmg ? 'bg-rose-600/80 border-rose-400 z-20 shadow-[0_0_10px_rgba(225,29,72,0.6)]' : 'bg-blue-600/80 border-blue-400'}`}
                             style={{ left, width }}
                             title={`Train ${t.train_id} (${t.train_type})\n${formatTime(t.planned_start)} - ${formatTime(t.planned_end)}`}
                           >
                             <span className="text-[10px] font-bold text-white truncate drop-shadow-md">{t.train_id} {isEmg && " (EMG)"}</span>
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
                             {/* Ghost / Shift Line */}
                             {isShifted && m.original_start && (
                                <div 
                                    className="absolute top-9 h-6 border-2 border-dashed border-slate-600/50 rounded-sm flex items-center justify-center opacity-50"
                                    style={getPosition(m.original_start, m.original_end)}
                                >
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">Original</span>
                                </div>
                             )}

                             {/* Actual Block */}
                             <div 
                               onClick={() => setSelectedItem({ type: 'maintenance', data: m })}
                               className={`absolute ${isShifted ? 'top-9' : 'top-9'} h-6 rounded-sm border cursor-pointer hover:brightness-125 transition-all overflow-hidden flex items-center px-2 ${m.status === 'Scheduled' ? 'bg-emerald-600/80 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-orange-600/80 border-orange-400'}`}
                               style={{ left, width }}
                               title={`Maint ${m.request_id} (${m.department})\n${formatTime(actualStart)} - ${formatTime(actualEnd)}`}
                             >
                               <span className="text-[10px] font-bold text-white truncate drop-shadow-md">{m.request_id}</span>
                             </div>

                             {/* Shift Arrow */}
                             {isShifted && m.original_start && m.start_time && new Date(m.original_start) < new Date(m.start_time) && (
                                <div 
                                    className="absolute top-[42px] h-0.5 bg-emerald-500/50 flex items-center z-0"
                                    style={{ 
                                        left: getPosition(m.original_end, m.start_time).left, 
                                        width: getPosition(m.original_end, m.start_time).width 
                                    }}
                                >
                                    <div className="w-2 h-2 border-t-2 border-r-2 border-emerald-500/80 rotate-45 absolute right-0 -translate-y-1/2 mt-[1px]"></div>
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
                             className="absolute top-0 bottom-0 bg-rose-500/30 border-l-2 border-r-2 border-rose-500 z-30 cursor-pointer hover:bg-rose-500/50 transition-colors flex flex-col items-center justify-center"
                             style={{ left, width }}
                           >
                             {parseFloat(width) > 5 && (
                               <div className="bg-rose-600 text-white text-[10px] font-bold px-1 py-0.5 rounded shadow-lg flex items-center gap-1">
                                 <AlertCircle size={10} /> {c.overlap_duration_minutes}m
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

      {/* UNSCHEDULED BLOCKS & SELECTED ITEM DETAILS */}
      <div className="grid grid-cols-12 gap-6">
          
          {/* UNSCHEDULED LIST */}
          {unscheduledMaint.length > 0 && (
            <div className="col-span-4 bg-rose-950/20 border border-rose-500/30 p-4 rounded-xl flex flex-col gap-3">
              <h3 className="text-rose-400 font-bold flex items-center gap-2">
                <XCircle size={16} /> Unscheduled / Rejected Blocks
              </h3>
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                  {unscheduledMaint.map((m: any) => (
                      <div 
                        key={m.request_id} 
                        onClick={() => setSelectedItem({ type: 'maintenance', data: m })}
                        className="bg-slate-900 border border-slate-700 p-3 rounded cursor-pointer hover:border-rose-500/50 transition-colors"
                      >
                          <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-slate-200">{m.request_id}</span>
                              <span className="text-xs bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-bold">Unscheduled</span>
                          </div>
                          <span className="text-xs text-slate-400 font-mono block">{m.section} {m.track ? `(${m.track})` : ''}</span>
                          <span className="text-xs text-slate-500">Requested: {formatTime(m.original_start)} → {formatTime(m.original_end)}</span>
                      </div>
                  ))}
              </div>
            </div>
          )}

          {/* ITEM DETAILS PANEL */}
          <div className={`${unscheduledMaint.length > 0 ? 'col-span-8' : 'col-span-12'}`}>
            {selectedItem ? (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                    {selectedItem.type === 'maintenance' && selectedItem.data.decision_explanation ? (
                        <DecisionCard req={selectedItem.data} />
                    ) : selectedItem.type === 'conflict' ? (
                        <div className="bg-slate-800 p-5 rounded-xl border border-rose-500/50 flex flex-col gap-4 shadow-lg shadow-rose-900/10">
                            <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
                                <ShieldAlert className="text-rose-500" size={20} />
                                <h4 className="font-bold text-rose-400">DETECTED CONFLICT OVERLAP</h4>
                                <span className="ml-auto text-sm font-mono bg-slate-900 px-2 py-1 rounded text-slate-300">
                                    {selectedItem.data.conflict_id}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-900 p-4 rounded border border-slate-700">
                                    <p className="text-slate-400 text-xs font-bold mb-2">ACTIVITIES INVOLVED</p>
                                    <p className="font-bold text-slate-200">{selectedItem.data.activity_1}</p>
                                    <p className="text-xs text-slate-500 mb-2">{selectedItem.data.activity_1_type}</p>
                                    <p className="font-bold text-slate-200">{selectedItem.data.activity_2}</p>
                                    <p className="text-xs text-slate-500">{selectedItem.data.activity_2_type}</p>
                                </div>
                                <div className="bg-slate-900 p-4 rounded border border-slate-700 flex flex-col justify-between">
                                    <div>
                                        <p className="text-slate-400 text-xs font-bold mb-2">OVERLAP TIMEFRAME</p>
                                        <p className="text-emerald-400 font-bold">{formatTime(selectedItem.data.overlap_start)} → {formatTime(selectedItem.data.overlap_end)}</p>
                                        <p className="text-sm text-slate-300 mt-1">{selectedItem.data.overlap_duration_minutes} minutes duration</p>
                                    </div>
                                    <div className="mt-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${selectedItem.data.severity === 'CRITICAL' ? 'bg-rose-500 text-white' : 'bg-orange-500 text-white'}`}>
                                            {selectedItem.data.severity} SEVERITY
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                                <p className="text-slate-400 text-xs font-bold mb-1">REASON</p>
                                <p className="text-slate-300 text-sm">{selectedItem.data.reason}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg flex items-center gap-4">
                            <Info size={24} className="text-blue-400" />
                            <div>
                                <h4 className="font-bold text-white uppercase">{selectedItem.type} Details</h4>
                                <p className="text-slate-400 text-sm text-wrap break-all">{JSON.stringify(selectedItem.data)}</p>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 border-dashed flex items-center justify-center h-full min-h-[150px]">
                    <p className="text-slate-500">Click on any train, maintenance block, or conflict in the timeline to view exact details and AI decisions.</p>
                </div>
            )}
          </div>
      </div>
    </div>
  );
}
