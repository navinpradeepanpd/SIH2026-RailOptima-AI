import React, { useState } from 'react';

export default function EmergencyForm({ onReplan, sections }: { onReplan: (data: any) => void, sections: any[] }) {
  const [formData, setFormData] = useState({
    section: "SEC_1",
    department: "Engineering",
    asset_type: "Track",
    start_time: "2026-09-01T10:00:00",
    duration: 120,
    severity: "Critical",
    urgency: "Emergency",
    safety_critical: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      emergency_request: {
        request_id: "EMG_" + Math.floor(Math.random() * 1000),
        ...formData
      }
    };
    
    try {
      const res = await fetch("http://127.0.0.1:8000/api/emergency/replan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      onReplan(data);
    } catch (err) {
      console.error(err);
      alert("Failed to reach backend.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-xl border border-rose-500/50 shadow-lg shadow-rose-900/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></div>
        <h2 className="text-xl font-bold text-rose-500">Inject Emergency Disruption</h2>
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
      
      <button type="submit" className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded transition-colors">
        INJECT EMERGENCY BLOCK & REPLAN
      </button>
    </form>
  );
}
