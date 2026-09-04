import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info,
  BookOpen,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api';
import type { SkillGapAnalysisResponse, CompetencyGapItem } from '../types/competency';

interface SkillGapMatrixProps {
  officialId: string;
}

export const SkillGapMatrix: React.FC<SkillGapMatrixProps> = ({ officialId }) => {
  const [data, setData] = useState<SkillGapAnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'gap' | 'current_score' | 'required_score' | 'competency_name'>('gap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Expanded row details for AI diagnostic
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchGaps = async () => {
    if (!officialId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.getSkillGaps(officialId);
      setData(res);
    } catch (err: any) {
      console.error('Failed to fetch skill gaps:', err);
      setError(err.response?.data?.detail || 'Failed to compute skill gap matrix.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGaps();
  }, [officialId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-900/60 animate-pulse border border-slate-800" />
          ))}
        </div>
        <div className="h-96 rounded-2xl bg-slate-900/60 animate-pulse border border-slate-800" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-panel p-8 rounded-2xl border border-red-500/30 text-center space-y-4 max-w-xl mx-auto">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Skill Gap Matrix Unavailable</h2>
        <p className="text-slate-400 text-sm">{error || 'Please complete onboarding or select an existing official profile.'}</p>
        <button
          onClick={fetchGaps}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold inline-flex items-center gap-2 transition"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  // Filter & Sort
  const filteredGaps = data.gaps.filter((item: CompetencyGapItem) => {
    const matchesSearch =
      item.competency_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'ALL' || item.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
    return matchesSearch && matchesPriority && matchesCategory;
  });

  filteredGaps.sort((a, b) => {
    let comparison = 0;
    if (sortField === 'competency_name') {
      comparison = a.competency_name.localeCompare(b.competency_name);
    } else {
      comparison = (a[sortField] as number) - (b[sortField] as number);
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  const handleSortToggle = (field: 'gap' | 'current_score' | 'required_score' | 'competency_name') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const categories = Array.from(new Set(data.gaps.map((g) => g.category)));

  return (
    <div className="space-y-6">
      {/* Top Banner & AI Rationale Highlight */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              MoSPI Competency Gap Intelligence
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Skill Gap Matrix: {data.full_name}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Evaluated against <span className="text-slate-200 font-semibold">{data.benchmark_source}</span> (
              {data.job_role}). Critical priorities sorted first.
            </p>
          </div>

          <button
            onClick={fetchGaps}
            className="self-start lg:self-center px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Recalculate Gaps
          </button>
        </div>

        {/* AI Explanatory Diagnosis for Top 3 Critical Gaps */}
        {data.critical_gaps_rationale && data.critical_gaps_rationale.length > 0 && (
          <div className="mt-5 p-4 rounded-xl bg-orange-600/10 border border-orange-500/20 text-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              AI Diagnostic Rationales & Actionable Interventions:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {data.critical_gaps_rationale.map((rat: string, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs leading-relaxed text-slate-300"
                >
                  {rat}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assessed */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Competencies</span>
            <BookOpen className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white mt-2">{data.total_competencies}</div>
          <div className="text-[11px] text-slate-500 mt-1">All 4 MoSPI core domains</div>
        </div>

        {/* High Priority Gaps */}
        <div className="glass-card p-5 rounded-2xl border border-red-500/20 bg-red-950/10">
          <div className="flex items-center justify-between text-red-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Critical Priority</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-3xl font-bold text-red-400 mt-2">{data.high_priority_count}</div>
          <div className="text-[11px] text-red-300/70 mt-1">Gap &ge; 1.5 (Immediate Workshop)</div>
        </div>

        {/* Medium Priority Gaps */}
        <div className="glass-card p-5 rounded-2xl border border-amber-500/20 bg-amber-950/10">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Moderate Priority</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-400 mt-2">{data.medium_priority_count}</div>
          <div className="text-[11px] text-amber-300/70 mt-1">0.5 &le; Gap &lt; 1.5 (Mentorship)</div>
        </div>

        {/* Low Priority / Maintained */}
        <div className="glass-card p-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/10">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Satisfactory</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-400 mt-2">{data.low_priority_count}</div>
          <div className="text-[11px] text-emerald-300/70 mt-1">Gap &lt; 0.5 (Benchmark Met)</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search competency or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Priority & Category Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Priority Filter */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setPriorityFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                priorityFilter === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setPriorityFilter('HIGH')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                priorityFilter === 'HIGH' ? 'bg-red-600 text-white' : 'text-red-400 hover:text-white'
              }`}
            >
              High ({data.high_priority_count})
            </button>
            <button
              onClick={() => setPriorityFilter('MEDIUM')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                priorityFilter === 'MEDIUM' ? 'bg-amber-600 text-white' : 'text-amber-400 hover:text-white'
              }`}
            >
              Med ({data.medium_priority_count})
            </button>
            <button
              onClick={() => setPriorityFilter('LOW')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                priorityFilter === 'LOW' ? 'bg-emerald-600 text-white' : 'text-emerald-400 hover:text-white'
              }`}
            >
              Low ({data.low_priority_count})
            </button>
          </div>

          {/* Category Selector */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Skill Gaps Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">#</th>
                <th
                  onClick={() => handleSortToggle('competency_name')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center gap-1.5">
                    Competency
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Domain Category</th>
                <th
                  onClick={() => handleSortToggle('current_score')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition text-center"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    Current Level
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSortToggle('required_score')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition text-center"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    Role Benchmark
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSortToggle('gap')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition text-center"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    Calculated Gap
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Priority</th>
                <th className="py-3 px-4 text-center">Diagnostic</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredGaps.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                    No competencies match the selected filter or search keyword.
                  </td>
                </tr>
              ) : (
                filteredGaps.map((item) => {
                  const isExpanded = expandedId === item.competency_id;
                  const isHigh = item.priority === 'HIGH';
                  const isMed = item.priority === 'MEDIUM';

                  return (
                    <React.Fragment key={item.competency_id}>
                      <tr
                        className={`hover:bg-slate-800/40 transition ${
                          isHigh ? 'bg-red-500/5' : isMed ? 'bg-amber-500/5' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{item.competency_id}</td>
                        <td className="py-3 px-4 font-semibold text-white">{item.competency_name}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium text-[11px]">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-200">
                          {item.current_score.toFixed(1)}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-400">
                          {item.required_score.toFixed(1)}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold">
                          <span
                            className={
                              item.gap >= 1.5
                                ? 'text-red-400'
                                : item.gap >= 0.5
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }
                          >
                            {item.gap > 0 ? `+${item.gap.toFixed(1)}` : item.gap.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.priority === 'HIGH' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 font-bold text-[10px]">
                              🔴 HIGH
                            </span>
                          )}
                          {item.priority === 'MEDIUM' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-[10px]">
                              🟡 MEDIUM
                            </span>
                          )}
                          {item.priority === 'LOW' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[10px]">
                              🟢 LOW
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : item.competency_id)}
                            className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition"
                            title="Toggle AI Intervention Insight"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Diagnostic Row */}
                      {isExpanded && (
                        <tr className="bg-slate-900/90 border-b border-slate-800">
                          <td colSpan={8} className="p-4">
                            <div className="flex items-start gap-3 text-xs bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-slate-300">
                              <Info className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <div className="font-semibold text-white">
                                  MoSPI Competency Diagnostic & Intervention Plan for {item.competency_name}:
                                </div>
                                <p className="text-slate-400 leading-relaxed">
                                  Official is currently at level <span className="text-white font-mono">{item.current_score.toFixed(1)}</span> against role benchmark <span className="text-white font-mono">{item.required_score.toFixed(1)}</span> (Delta Gap: <span className="text-orange-400 font-bold">{item.gap.toFixed(1)}</span>).
                                  {item.priority === 'HIGH' &&
                                    ' High-priority deficit impacting core statutory deliverables. Nominate official for immediate 2-week immersive workshop with NSSO/CSO paired deployment.'}
                                  {item.priority === 'MEDIUM' &&
                                    ' Moderate developmental area. Recommended self-paced iGOT Karmayogi / MoSPI e-learning modules accompanied by divisional peer code/data reviews.'}
                                  {item.priority === 'LOW' &&
                                    ' Satisfactory capability. Competency meets or exceeds role benchmark requirements. Maintain through ongoing periodic reviews.'}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
