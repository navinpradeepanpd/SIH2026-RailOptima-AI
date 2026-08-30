import React from 'react';
import { ArrowRight, AlertCircle, Info, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';

interface DecisionExplanation {
    decision: string;
    reason: string;
    constraint: string;
    conflict_ids: string[];
    affected_section: string;
    original_start: string | null;
    original_end: string | null;
    optimized_start: string | null;
    optimized_end: string | null;
    shift_duration: number | null;
    impact: string;
    track?: string;
}

export default function DecisionCard({ req }: { req: any }) {
    const exp: DecisionExplanation = req.decision_explanation;
    if (!exp) return null;

    const isUnscheduled = req.status === "Unscheduled";

    const formatTime = (iso: string | null) => {
        if (!iso) return "N/A";
        const d = new Date(iso);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className={`bg-slate-800 p-5 rounded-xl border ${isUnscheduled ? 'border-rose-500/30' : 'border-blue-500/30'} flex flex-col gap-4 shadow-lg`}>
            <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
                {isUnscheduled ? <XCircle className="text-rose-400" size={20} /> : <Info className="text-blue-400" size={20} />}
                <h4 className={`font-bold ${isUnscheduled ? 'text-rose-400' : 'text-blue-400'}`}>
                    {isUnscheduled ? 'WHY NOT SCHEDULED' : 'WHY THIS BLOCK MOVED'}
                </h4>
                <span className="ml-auto text-sm font-mono bg-slate-900 px-2 py-1 rounded text-slate-300">
                    {req.request_id}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                    <p className="text-slate-400 font-bold mb-1 text-xs">REQUESTED SLOT</p>
                    <div className="flex items-center gap-2 text-slate-200">
                        {formatTime(exp.original_start)} <ArrowRight size={14} className="text-slate-500" /> {formatTime(exp.original_end)}
                    </div>
                </div>
                
                <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                    <p className="text-slate-400 font-bold mb-1 text-xs">{isUnscheduled ? 'RESULT' : 'AI DECISION'}</p>
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                        {isUnscheduled ? (
                           <span className="text-rose-400">Rejected</span>
                        ) : (
                           <>{formatTime(exp.optimized_start)} <ArrowRight size={14} className="text-slate-500" /> {formatTime(exp.optimized_end)}</>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-3 mt-2">
                <div>
                    <p className="text-slate-400 text-xs font-bold mb-1">BLOCKING CONFLICT</p>
                    <p className="text-slate-300 text-sm flex items-center gap-2">
                        <AlertCircle size={14} className="text-orange-400" />
                        {exp.conflict_ids.length > 0 ? `Conflicts with: ${exp.conflict_ids.join(", ")} on ${exp.affected_section}${exp.track ? ` (${exp.track})` : ''}` : exp.reason}
                    </p>
                </div>

                <div>
                    <p className="text-slate-400 text-xs font-bold mb-1">CONSTRAINT ENFORCED</p>
                    <p className="text-slate-300 text-sm flex items-center gap-2">
                        <ShieldAlert size={14} className="text-slate-400" />
                        {exp.constraint}
                    </p>
                </div>
                
                <div>
                    <p className="text-slate-400 text-xs font-bold mb-1">OPERATIONAL IMPACT</p>
                    <p className="text-emerald-400 text-sm flex items-center gap-2">
                        <CheckCircle size={14} className={isUnscheduled ? "text-rose-400" : "text-emerald-400"} />
                        <span className={isUnscheduled ? "text-rose-300" : "text-emerald-300"}>{exp.impact}</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
