import React, { useState } from 'react';
import { getApiUrl } from '../lib/api';

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

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-xl border border-rose-500/50 shadow-lg shadow-rose-900/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></div>
        <h2 className="text-xl font-bold text-rose-500">Inject Emergency Disruption</h2>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setFormData({ ...formData, section: "SEC_1", track: "Up", department: "Engineering", start_time: "2026-09-01T10:00:00", duration: 240 })}
          className="text-xs bg-slate-900 border border-slate-700 hover:border-emerald-500 hover:text-emerald-400 text-slate-400 px-3 py-1 rounded transition-colors"
        >
          Preset: Track Washout (4h)
        </button>
        <button
          type="button"
          onClick={() => setFormData({ ...formData, section: "SEC_2", track: "", department: "Traction", start_time: "2026-09-02T14:00:00", duration: 120 })}
          className="text-xs bg-slate-900 border border-slate-700 hover:border-emerald-500 hover:text-emerald-400 text-slate-400 px-3 py-1 rounded transition-colors"
        >
          Preset: Power Failure (2h)
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-slate-400 text-sm mb-1">Section</label>
          <select
            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white outline-none focus:border-rose-500"
            value={formData.section}
            onChange={e => setFormData({...formData, section: e.target.value})}
          >
            {sections.map(s => <option key={s.section_id} value={s.section_id}>{s.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-slate-400 text-sm mb-1">Track</label>
          <select
            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white outline-none focus:border-rose-500"
            value={formData.track}
            onChange={e => setFormData({...formData, track: e.target.value})}
          >
            <option value="">Any / Unknown</option>
            {sections.find(s => s.section_id === formData.section)?.tracks?.map((t: string) => (
                <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-400 text-sm mb-1">Department</label>
          <select
            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white outline-none focus:border-rose-500"
            value={formData.department}
            onChange={e => setFormData({...formData, department: e.target.value})}
          >
            <option>Engineering</option>
            <option>Traction</option>
            <option>S&T</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-400 text-sm mb-1">Start Time (ISO)</label>
          <input
            type="text"
            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white outline-none focus:border-rose-500"
            value={formData.start_time}
            onChange={e => setFormData({...formData, start_time: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-slate-400 text-sm mb-1">Duration (mins)</label>
          <input
            type="number"
            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white outline-none focus:border-rose-500"
            value={formData.duration}
            onChange={e => setFormData({...formData, duration: parseInt(e.target.value)})}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-rose-950/50 border border-rose-500/50 p-3 rounded text-rose-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="font-bold underline hover:text-rose-300">Dismiss</button>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-rose-600 hover:bg-rose-500 disabled:bg-rose-900 disabled:text-rose-400 text-white font-bold py-3 rounded transition-colors flex justify-center items-center gap-2"
      >
        {isSubmitting ? "REPLANNING IN PROGRESS..." : "INJECT EMERGENCY BLOCK & REPLAN"}
      </button>
    </form>
  );
}
