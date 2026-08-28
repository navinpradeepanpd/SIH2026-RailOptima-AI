import React from 'react';

interface TimelineViewProps {
  trains: any[];
  maintenance: any[];
  sections: any[];
}

export default function TimelineView({ trains, maintenance, sections }: TimelineViewProps) {
  // Simple CSS grid timeline. 
  // For the prototype, we just list out the items grouped by section.
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col gap-6">
      <h2 className="text-xl font-semibold text-white">Live Train & Block View (Next 24 Hours)</h2>
      
      <div className="flex flex-col gap-4 overflow-y-auto max-h-[600px] pr-2">
        {sections.map(sec => {
          const secTrains = trains.filter(t => t.section === sec.section_id).slice(0, 5);
          const secMaint = maintenance.filter(m => m.section === sec.section_id).slice(0, 5);
          
          if (secTrains.length === 0 && secMaint.length === 0) return null;
          
          return (
            <div key={sec.section_id} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
              <h3 className="text-emerald-400 font-bold mb-3">{sec.name} ({sec.section_id})</h3>
              
              <div className="space-y-2">
                {secTrains.map(t => (
                  <div key={t.train_id} className="flex justify-between items-center bg-blue-900/20 border border-blue-500/30 px-4 py-2 rounded">
                    <div className="flex items-center gap-3">
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded font-bold">TRAIN</span>
                      <span className="text-slate-200">{t.train_id} ({t.train_type})</span>
                    </div>
                    <span className="text-slate-400 text-sm">
                      {new Date(t.planned_start).toLocaleTimeString()} - {new Date(t.planned_end).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
                
                {secMaint.map(m => (
                  <div key={m.request_id} className={`flex justify-between items-center border px-4 py-2 rounded ${m.status === 'Scheduled' ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-orange-900/20 border-orange-500/30'}`}>
                    <div className="flex items-center gap-3">
                      <span className={`${m.status === 'Scheduled' ? 'bg-emerald-600' : 'bg-orange-600'} text-white text-xs px-2 py-1 rounded font-bold`}>BLOCK</span>
                      <span className="text-slate-200">{m.request_id} ({m.department})</span>
                    </div>
                    <span className="text-slate-400 text-sm">
                      {m.start_time ? new Date(m.start_time).toLocaleTimeString() : 'Unscheduled'} 
                      {m.end_time && ` - ${new Date(m.end_time).toLocaleTimeString()}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
