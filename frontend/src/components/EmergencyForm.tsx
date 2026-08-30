"use client";

import React, { useState } from 'react';
import { getApiUrl } from '../lib/api';
import { AlertTriangle, Zap, Clock, MapPin, Wrench } from 'lucide-react';

const presets = [
  {
    label: "Track Washout",
    duration: "4 hours",
    icon: Wrench,
    config: { section: "SEC_1", track: "Up", department: "Engineering", start_time: "2026-09-01T10:00:00", duration: 240 }
  },
  {
    label: "Power Failure",
    duration: "2 hours",
    icon: Zap,
    config: { section: "SEC_2", track: "", department: "Traction", start_time: "2026-09-02T14:00:00", duration: 120 }
  },
];

export default function EmergencyForm({ onReplan, sections }: { onReplan: (data: any) => void, sections: any[] }) {
  const [formData, setFormData] = useState({
    section: "SEC_1",
    department: "Engineering",
    asset_type: "Track",
    start_time: "2026-09-01T10:00:00",
    duration: 120,
    severity: "Critical",
    urgency: "Emergency",
    safety_critical: true,
    track: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      emergency_request: {
        request_id: "EMG_" + Math.floor(Math.random() * 1000),
        ...formData
      }
    };

    try {
      const res = await fetch(getApiUrl("/api/emergency/replan"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Emergency replanning could not be completed.");
      const data = await res.json();
      onReplan(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "RailOptima backend is temporarily unavailable.");
    }
    setIsSubmitting(false);
  };

  const applyPreset = (config: typeof presets[0]['config']) => {
    setFormData({ ...formData, ...config });
  };

  const selectedSection = sections.find(s => s.section_id === formData.section);

  return (
    <form onSubmit={handleSubmit} className="glass-panel-elevated p-5 glow-border-rose">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[var(--border-subtle)]">
        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-dot-pulse shadow-[0_0_8px_var(--accent-danger)]" />
        <h2 className="text-sm font-bold text-rose-400 uppercase tracking-wider">Inject Emergency Disruption</h2>
      </div>

      {/* Presets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
        {presets.map((preset, i) => (
          <button
            key={i}
            type="button"
            onClick={() => applyPreset(preset.config)}
            className="glass-panel interactive-card flex flex-col items-center gap-2 p-3 text-center hover:border-rose-500/30 transition-all group"
          >
            <preset.icon size={18} className="text-[var(--text-muted)] group-hover:text-rose-400 transition-colors" />
            <span className="text-[11px] font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">{preset.label}</span>
            <span className="text-[10px] text-[var(--text-muted)]">{preset.duration}</span>
          </button>
        ))}
      </div>

      {/* Form Fields */}
      <div className="space-y-3 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider mb-1.5">
              <MapPin size={10} className="inline mr-1" />Section
            </label>
            <select
              className="w-full bg-[var(--bg-deep)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-rose-500/50 transition-colors"
              value={formData.section}
              onChange={e => setFormData({...formData, section: e.target.value})}
            >
              {sections.map(s => <option key={s.section_id} value={s.section_id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider mb-1.5">Track</label>
            <select
              className="w-full bg-[var(--bg-deep)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-rose-500/50 transition-colors"
              value={formData.track}
              onChange={e => setFormData({...formData, track: e.target.value})}
            >
              <option value="">Any / Unknown</option>
              {selectedSection?.tracks?.map((t: string) => (
                  <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider mb-1.5">
            <Wrench size={10} className="inline mr-1" />Department
          </label>
          <select
            className="w-full bg-[var(--bg-deep)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-rose-500/50 transition-colors"
            value={formData.department}
            onChange={e => setFormData({...formData, department: e.target.value})}
          >
            <option>Engineering</option>
            <option>Traction</option>
            <option>S&T</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider mb-1.5">
              <Clock size={10} className="inline mr-1" />Start Time
            </label>
            <input
              type="text"
              className="w-full bg-[var(--bg-deep)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] font-mono outline-none focus:border-rose-500/50 transition-colors"
              value={formData.start_time}
              onChange={e => setFormData({...formData, start_time: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider mb-1.5">Duration (mins)</label>
            <input
              type="number"
              className="w-full bg-[var(--bg-deep)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] font-mono outline-none focus:border-rose-500/50 transition-colors"
              value={formData.duration}
              onChange={e => setFormData({...formData, duration: parseInt(e.target.value)})}
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 bg-rose-950/30 border border-rose-500/30 px-3 py-2.5 rounded-lg text-rose-400 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="font-bold underline hover:text-rose-300 text-[10px]">Dismiss</button>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 disabled:from-rose-900 disabled:to-rose-950 disabled:text-rose-400 text-white font-bold py-3 rounded-lg transition-all flex justify-center items-center gap-2 shadow-lg shadow-rose-900/30"
      >
        <AlertTriangle size={16} />
        {isSubmitting ? "REPLANNING IN PROGRESS..." : "INJECT EMERGENCY & REPLAN"}
      </button>
    </form>
  );
}
