"use client";

import React, { useState } from 'react';
import {
  Activity, BarChart3, ShieldAlert, Calendar, AlertTriangle, Play,
  Zap, ChevronLeft, ChevronRight, Radio
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  dataMode?: any;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const navSections = [
  {
    label: "MONITOR",
    items: [
      { id: "overview", label: "Overview", icon: Activity },
      { id: "analytics", label: "Analytics & KPIs", icon: BarChart3 },
    ]
  },
  {
    label: "OPERATE",
    items: [
      { id: "maintenance", label: "Maintenance", icon: ShieldAlert },
      { id: "optimizer", label: "AI Optimizer", icon: Calendar },
    ]
  },
  {
    label: "RESPOND",
    items: [
      { id: "emergency", label: "Emergency", icon: AlertTriangle },
    ]
  },
  {
    label: "PRESENT",
    items: [
      { id: "demo", label: "SIH Demo", icon: Play },
    ]
  }
];

export default function Sidebar({ activeTab, onTabChange, dataMode, mobileOpen, setMobileOpen }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* ── Mobile Overlay ── */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity" 
          onClick={() => setMobileOpen(false)}
        />
      )}
      
      <aside
        className={`glass-sidebar flex flex-col h-screen fixed md:sticky top-0 left-0 z-50 transition-all duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${collapsed ? 'md:w-[72px] w-[240px]' : 'w-[240px]'}`}
      >
      {/* ── Logo ── */}
      <div className={`flex items-center gap-3 p-4 border-b border-[var(--border-subtle)] min-h-[68px] ${collapsed ? 'justify-center' : ''}`}>
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg"
               style={{ boxShadow: '0 0 20px rgba(34, 211, 238, 0.3)' }}>
            <Zap size={18} className="text-white" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[var(--bg-deep)] animate-dot-pulse" />
        </div>
        {!collapsed && (
          <div className="flex flex-col animate-fade-in">
            <span className="text-base font-extrabold text-white tracking-tight leading-none">
              RAIL<span className="text-gradient-cyan">OPTIMA</span>
            </span>
            <span className="text-xs font-semibold text-[var(--text-muted)] tracking-widest uppercase">
              AI Command Center
            </span>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {navSections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="text-xs font-bold text-[var(--text-muted)] tracking-[0.15em] uppercase px-3 mb-2">
                {section.label}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`
                      w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 group relative
                      ${collapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5'}
                      ${isActive
                        ? 'bg-[var(--accent-primary-dim)] text-[var(--accent-primary)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                      }
                    `}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--accent-primary)] shadow-[0_0_8px_var(--accent-primary)]" />
                    )}
                    <item.icon size={18} className={`shrink-0 ${isActive ? 'drop-shadow-[0_0_6px_var(--accent-primary)]' : ''}`} />
                    {(!collapsed || mobileOpen) && <span>{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Data Source Indicator ── */}
      <div className={`border-t border-[var(--border-subtle)] p-3 ${collapsed ? 'flex justify-center' : ''}`}>
        {dataMode?.mode === "simulation" && (
          <div className={`flex items-center gap-2 ${collapsed ? '' : 'px-2'}`} title="Simulation Mode">
            <Radio size={14} className="text-amber-400 shrink-0 animate-dot-pulse" />
            {!collapsed && (
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Simulation
              </span>
            )}
          </div>
        )}
        {dataMode?.mode === "live" && dataMode?.live_configured && (
          <div className={`flex items-center gap-2 ${collapsed ? '' : 'px-2'}`} title="Live Mode">
            <Radio size={14} className="text-emerald-400 shrink-0 animate-dot-pulse" />
            {!collapsed && (
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Live Connected
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Collapse Toggle (Desktop Only) ── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden md:flex border-t border-[var(--border-subtle)] p-3 items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
    </>
  );
}
