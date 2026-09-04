import React, { useState, useEffect } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Radar as RadarIcon,
  Layers,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import api from '../services/api';
import type { RadarResponse } from '../types/competency';

interface CompetencyRadarProps {
  officialId: string;
}

export const CompetencyRadar: React.FC<CompetencyRadarProps> = ({ officialId }) => {
  const [data, setData] = useState<RadarResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // View Mode: 'category' (4 domains) or 'detailed' (individual competencies)
  const [viewMode, setViewMode] = useState<'category' | 'detailed'>('category');
  const [selectedCategory, setSelectedCategory] = useState<string>('Statistical');

  const fetchRadar = async () => {
    if (!officialId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.getRadarData(officialId);
      setData(res);
    } catch (err: any) {
      console.error('Failed to load radar data:', err);
      setError(err.response?.data?.detail || 'Failed to load competency radar analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRadar();
  }, [officialId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 rounded-2xl bg-slate-900/60 animate-pulse border border-slate-800" />
        <div className="h-[480px] rounded-2xl bg-slate-900/60 animate-pulse border border-slate-800" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-panel p-8 rounded-2xl border border-red-500/30 text-center space-y-4 max-w-xl mx-auto">
        <RadarIcon className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Radar Analytics Unavailable</h2>
        <p className="text-slate-400 text-sm">{error || 'Please register an official or check backend connectivity.'}</p>
        <button
          onClick={fetchRadar}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold inline-flex items-center gap-2 transition"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  // Filter detailed data based on category filter
  const detailedData =
    selectedCategory === 'ALL'
      ? data.competency_radar
      : data.competency_radar.filter((pt) => pt.category === selectedCategory);

  // Custom Tooltip for Recharts
  const CustomRadarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const pData = payload[0].payload;
      const label = pData.competency || pData.category;
      const current = pData.current !== undefined ? pData.current : pData.current_avg;
      const required = pData.required !== undefined ? pData.required : pData.required_avg;
      const gap = pData.gap !== undefined ? pData.gap : pData.gap_avg;

      return (
        <div className="p-3 rounded-xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[190px]">
          <div className="font-bold text-white border-b border-slate-800 pb-1 flex items-center justify-between">
            <span>{label}</span>
            {pData.category && pData.competency && (
              <span className="text-[10px] text-slate-400 font-normal">{pData.category}</span>
            )}
          </div>
          <div className="flex justify-between items-center text-blue-400">
            <span>Current Capability:</span>
            <span className="font-mono font-bold text-sm">{current.toFixed(1)} / 5.0</span>
          </div>
          <div className="flex justify-between items-center text-orange-400">
            <span>Role Benchmark:</span>
            <span className="font-mono font-bold text-sm">{required.toFixed(1)} / 5.0</span>
          </div>
          <div className="flex justify-between items-center text-slate-300 border-t border-slate-800 pt-1">
            <span>Skill Delta Gap:</span>
            <span
              className={`font-mono font-bold ${
                gap >= 1.5 ? 'text-red-400' : gap >= 0.5 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {gap > 0 ? `+${gap.toFixed(1)}` : gap.toFixed(1)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 uppercase tracking-wider mb-1">
            <RadarIcon className="w-4 h-4" />
            Visual Competency Radar Analytics
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Capability vs. Benchmark Alignment
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Interactive multi-axis radar comparing calibrated scores against role requirements for{' '}
            <span className="text-slate-200 font-semibold">{data.job_role}</span>.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center text-xs">
            <button
              onClick={() => setViewMode('category')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'category'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Domain Overview (4)
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'detailed'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Detailed Competencies
            </button>
          </div>

          <button
            onClick={fetchRadar}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
            title="Refresh Radar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-Filter for Detailed View */}
      {viewMode === 'detailed' && (
        <div className="glass-panel p-3 rounded-xl border border-slate-800 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold pl-2">Filter Category:</span>
          {['Statistical', 'Technical', 'Digital Governance', 'Behavioural & Managerial', 'ALL'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
                selectedCategory === cat
                  ? 'bg-slate-700 text-white border border-slate-600'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat === 'ALL' ? 'All 33 Competencies' : cat}
            </button>
          ))}
        </div>
      )}

      {/* Main Radar Visual Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        {/* Radar Chart Container */}
        <div className="w-full h-[460px] relative">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'category' ? (
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data.category_radar}>
                <PolarGrid stroke="#334155" strokeDasharray="3 3" />
                <PolarAngleAxis
                  dataKey="category"
                  stroke="#94a3b8"
                  tick={{ fill: '#e2e8f0', fontSize: 12, fontWeight: 600 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 5]}
                  stroke="#475569"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                />
                <Radar
                  name="Current Capability Average"
                  dataKey="current_avg"
                  stroke="#0284c7"
                  fill="#0284c7"
                  fillOpacity={0.45}
                  strokeWidth={2}
                />
                <Radar
                  name="Role Benchmark Average"
                  dataKey="required_avg"
                  stroke="#ea580c"
                  fill="#ea580c"
                  fillOpacity={0.15}
                  strokeDasharray="4 4"
                  strokeWidth={2.5}
                />
                <Tooltip content={<CustomRadarTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  formatter={(val) => <span className="text-xs font-semibold text-slate-300">{val}</span>}
                />
              </RadarChart>
            ) : (
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={detailedData}>
                <PolarGrid stroke="#334155" strokeDasharray="2 2" />
                <PolarAngleAxis
                  dataKey="competency"
                  stroke="#94a3b8"
                  tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 500 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 5]}
                  stroke="#475569"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                />
                <Radar
                  name="Official Current Score"
                  dataKey="current"
                  stroke="#38bdf8"
                  fill="#0284c7"
                  fillOpacity={0.45}
                  strokeWidth={2}
                />
                <Radar
                  name="Required Benchmark"
                  dataKey="required"
                  stroke="#f97316"
                  fill="#ea580c"
                  fillOpacity={0.1}
                  strokeDasharray="3 3"
                  strokeWidth={2}
                />
                <Tooltip content={<CustomRadarTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  formatter={(val) => <span className="text-xs font-semibold text-slate-300">{val}</span>}
                />
              </RadarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Legend Explanations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-800 text-xs">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-950/20 border border-blue-500/20">
            <div className="w-4 h-4 rounded-full bg-blue-500/40 border border-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-blue-300">Blue Area (Current Proficiency):</span>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                Represents the official's AI-calibrated capability level across competencies based on verified tenure, attended MoSPI courses, and self-ratings.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-orange-950/20 border border-orange-500/20">
            <div className="w-4 h-4 rounded-full border-2 border-dashed border-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-orange-300">Orange Dashed Boundary (Benchmark):</span>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                Represents the mandated target benchmark for the official's job role. Any blue area falling short of the orange line represents a skill deficit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
