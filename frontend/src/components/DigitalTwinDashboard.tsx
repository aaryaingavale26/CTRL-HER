import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  ShieldCheck,
  Clock,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api';
import type { CompetencyDigitalTwinResponse, CategoryProgress, HistoryMilestone } from '../types/competency';

interface DigitalTwinDashboardProps {
  officialId: string;
}

export const DigitalTwinDashboard: React.FC<DigitalTwinDashboardProps> = ({ officialId }) => {
  const [data, setData] = useState<CompetencyDigitalTwinResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTwin = async () => {
    if (!officialId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDigitalTwin(officialId);
      setData(res);
    } catch (err: any) {
      console.error('Failed to load digital twin:', err);
      setError(err.response?.data?.detail || 'Failed to fetch Competency Digital Twin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTwin();
  }, [officialId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-64 rounded-2xl bg-slate-900/60 animate-pulse border border-slate-800" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 rounded-2xl bg-slate-900/60 animate-pulse border border-slate-800" />
          <div className="h-80 rounded-2xl bg-slate-900/60 animate-pulse border border-slate-800" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-panel p-8 rounded-2xl border border-red-500/30 text-center space-y-4 max-w-xl mx-auto">
        <Cpu className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Digital Twin Unavailable</h2>
        <p className="text-slate-400 text-sm">{error || 'Please ensure official profile exists.'}</p>
        <button
          onClick={fetchTwin}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold inline-flex items-center gap-2 transition"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  // Helper color for readiness percentage
  const getReadinessColor = (pct: number) => {
    if (pct >= 85) return 'text-emerald-400';
    if (pct >= 70) return 'text-sky-400';
    if (pct >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  const getReadinessBg = (pct: number) => {
    if (pct >= 85) return 'bg-emerald-500';
    if (pct >= 70) return 'bg-sky-500';
    if (pct >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Hero Section: Workforce Readiness Gauge & Official Status */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
          {/* Official Info */}
          <div className="space-y-3 flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5" />
              Real-Time Competency Digital Twin
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {data.full_name}
            </h1>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-xs text-slate-400">
              <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 font-medium">
                {data.designation}
              </span>
              <span>•</span>
              <span className="text-orange-400 font-medium">{data.job_role}</span>
              <span>•</span>
              <span className="text-slate-500">ID: {data.official_id.slice(0, 8)}...</span>
            </div>
            <p className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 max-w-2xl leading-relaxed">
              <span className="font-semibold text-white">Status Assessment: </span>
              {data.status_summary}
            </p>
          </div>

          {/* Semi-circular Readiness Gauge Display */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl min-w-[240px]">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Workforce Role Readiness
            </span>

            {/* Circular Visual Indicator */}
            <div className="relative flex items-center justify-center w-36 h-36">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  strokeWidth="9"
                  className="stroke-slate-800"
                  fill="transparent"
                />
                {/* Dynamic Progress Circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  strokeWidth="9"
                  strokeLinecap="round"
                  className="stroke-orange-500 transition-all duration-1000 ease-out"
                  fill="transparent"
                  strokeDasharray={264}
                  strokeDashoffset={264 - (264 * data.overall_readiness_pct) / 100}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className={`text-3xl font-extrabold tracking-tight ${getReadinessColor(data.overall_readiness_pct)}`}>
                  {data.overall_readiness_pct.toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                  Readiness
                </span>
              </div>
            </div>

            <div className="mt-3 text-center">
              <span
                className={`inline-block px-3 py-0.5 rounded-full text-xs font-bold ${
                  data.overall_readiness_pct >= 85
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : data.overall_readiness_pct >= 70
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}
              >
                {data.overall_readiness_pct >= 85
                  ? 'Deployment Ready'
                  : data.overall_readiness_pct >= 70
                  ? 'Operationally Proficient'
                  : 'Developing Capability'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Domain Progress Bars + Timeline Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Domain Breakdown Progress Bars (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-orange-500" />
                Domain Capability Breakdown
              </h2>
              <span className="text-xs text-slate-500 font-mono">4 Domains</span>
            </div>

            <div className="space-y-4">
              {data.category_breakdown.map((cat: CategoryProgress) => {
                const readiness = cat.readiness_pct;
                return (
                  <div
                    key={cat.category}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{cat.category}</span>
                      <span className={`text-xs font-mono font-bold ${getReadinessColor(readiness)}`}>
                        {readiness.toFixed(1)}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${getReadinessBg(readiness)}`}
                        style={{ width: `${Math.min(100, Math.max(5, readiness))}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>
                        Current Avg:{' '}
                        <strong className="text-slate-200">{cat.current_average.toFixed(1)}</strong> / 5.0
                      </span>
                      <span>
                        Required:{' '}
                        <strong className="text-slate-200">{cat.required_average.toFixed(1)}</strong> / 5.0
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Summary Insight */}
            <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-slate-300 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                The Competency Digital Twin continuously mirrors official capability across field surveys, automated scrutiny pipelines, and administrative certifications.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Historical Trajectory Milestones Timeline (7 cols) */}
        <div className="lg:col-span-7">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  Competency Milestone Audit Trajectory
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Logged entries from <span className="text-slate-300 font-mono">competency_history</span>
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-bold">
                {data.recent_updates_count} Events Logged
              </span>
            </div>

            {/* Scrollable Timeline */}
            <div className="max-h-[520px] overflow-y-auto pr-2 space-y-4">
              {data.timeline_milestones.length === 0 ? (
                <div className="py-12 text-center text-slate-500 italic text-xs">
                  No historical milestones logged for this official.
                </div>
              ) : (
                data.timeline_milestones.map((m: HistoryMilestone, idx: number) => (
                  <div key={m.id || idx} className="relative pl-6 pb-4 border-l border-slate-800 last:border-transparent">
                    {/* Dot on line */}
                    <div className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-orange-500 border-2 border-slate-950 shadow-md shadow-orange-500/50" />

                    <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition space-y-1.5 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{m.competency_name}</span>
                          <span className="px-2 py-0.2 rounded-md bg-slate-800 text-slate-400 text-[10px]">
                            {m.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{new Date(m.recorded_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-1">
                        <span className="text-slate-400">
                          Calibrated Score:{' '}
                          <strong className="text-orange-400 font-mono">{m.score.toFixed(1)} / 5.0</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 font-mono text-[10px]">
                          source: {m.source_type}
                        </span>
                      </div>

                      {m.reason && (
                        <p className="text-slate-400 text-[11px] bg-slate-950/60 p-2 rounded-lg border border-slate-800/60 mt-1 leading-relaxed">
                          {m.reason}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
