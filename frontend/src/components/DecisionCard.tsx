import React from 'react';
import { ArrowRight, AlertCircle, ShieldAlert, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';

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

    const steps = [
        {
            label: "REQUESTED",
            icon: Clock,
            color: "text-[var(--text-secondary)]",
            dotColor: "bg-[var(--text-muted)]",
            content: (
                <span className="font-mono text-sm">
                    {formatTime(exp.original_start)} <ArrowRight size={12} className="inline mx-1 text-[var(--text-muted)]" /> {formatTime(exp.original_end)}
                </span>
            )
        },
        {
            label: "WHY",
            icon: AlertCircle,
            color: "text-amber-400",
            dotColor: "bg-amber-400",
            content: (
                <span className="text-sm text-[var(--text-secondary)]">
                    {exp.conflict_ids.length > 0
                        ? `Conflicts with: ${exp.conflict_ids.join(", ")} on ${exp.affected_section}${exp.track ? ` (${exp.track})` : ''}`
                        : exp.reason || "No feasible window found within the planning horizon."}
                </span>
            )
        },
        {
            label: "CONSTRAINT",
            icon: ShieldAlert,
            color: "text-indigo-400",
            dotColor: "bg-indigo-400",
            content: (
                <span className="text-sm text-[var(--text-secondary)]">{exp.constraint}</span>
            )
        },
        {
            label: "DECISION",
            icon: Zap,
            color: isUnscheduled ? "text-rose-400" : "text-cyan-400",
            dotColor: isUnscheduled ? "bg-rose-400" : "bg-cyan-400",
            content: isUnscheduled ? (
                <span className="text-sm font-bold text-rose-400">Rejected — No feasible slot</span>
            ) : (
                <span className="font-mono text-sm font-bold text-cyan-400">
                    {formatTime(exp.optimized_start)} <ArrowRight size={12} className="inline mx-1 text-[var(--text-muted)]" /> {formatTime(exp.optimized_end)}
                    {exp.shift_duration != null && exp.shift_duration > 0 && (
                        <span className="ml-2 text-xs text-[var(--text-muted)] font-sans">
                            (+{exp.shift_duration}m shift)
                        </span>
                    )}
                </span>
            )
        },
        {
            label: "IMPACT",
            icon: isUnscheduled ? XCircle : CheckCircle,
            color: isUnscheduled ? "text-rose-400" : "text-emerald-400",
            dotColor: isUnscheduled ? "bg-rose-400" : "bg-emerald-400",
            content: (
                <span className={`text-sm ${isUnscheduled ? 'text-rose-300' : 'text-emerald-300'}`}>{exp.impact}</span>
            )
        },
    ];

    return (
        <div className={`glass-panel interactive-card p-5 ${isUnscheduled ? 'glow-border-rose' : 'accent-left-cyan'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    {isUnscheduled
                        ? <XCircle size={16} className="text-rose-400" />
                        : <CheckCircle size={16} className="text-cyan-400" />
                    }
                    <span className={`text-xs font-bold uppercase tracking-wider ${isUnscheduled ? 'text-rose-400' : 'text-cyan-400'}`}>
                        {isUnscheduled ? 'Rejected' : 'Scheduled'}
                    </span>
                </div>
                <span className="text-xs font-mono bg-[var(--bg-deep)] px-2.5 py-1 rounded text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                    {req.request_id}
                </span>
            </div>

            {/* Vertical Stepper */}
            <div className="relative pl-6">
                {/* Connecting line */}
                <div className={`absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-[var(--text-muted)] via-[var(--border-active)] ${isUnscheduled ? 'to-rose-400/50' : 'to-emerald-400/50'}`} />

                {steps.map((step, i) => (
                    <div key={i} className="relative flex items-start gap-3 mb-4 last:mb-0 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                        {/* Dot */}
                        <div className={`absolute -left-6 top-0.5 w-[15px] h-[15px] rounded-full border-2 border-[var(--bg-surface)] ${step.dotColor} shrink-0 z-10`} />

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <p className={`text-[10px] font-bold uppercase tracking-[0.12em] mb-0.5 ${step.color}`}>
                                {step.label}
                            </p>
                            <div className="leading-relaxed">{step.content}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
