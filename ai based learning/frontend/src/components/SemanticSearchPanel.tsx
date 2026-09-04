import React, { useState } from 'react';
import {
  Search, Loader2, AlertCircle, BookOpen, ChevronDown, ChevronUp, SlidersHorizontal
} from 'lucide-react';
import { semanticSearch } from '../api/ai';
import { SearchResultItem, DocumentItem } from '../types';

interface SemanticSearchPanelProps {
  documents: DocumentItem[];
}

export const SemanticSearchPanel: React.FC<SemanticSearchPanelProps> = ({ documents }) => {
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(5);
  const [filterDocId, setFilterDocId] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [searchedQuery, setSearchedQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Only show documents that are indexed as filter options
  const indexedDocs = documents.filter((d) => d.status === 'INDEXED');

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setIsSearching(true);
    setError(null);
    setResults([]);
    setHasSearched(true);
    try {
      const res = await semanticSearch(q, topK, filterDocId || undefined);
      setResults(res.results);
      setSearchedQuery(q);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
        err?.message ||
        'Search failed. Make sure at least one document is indexed.'
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const scoreColor = (score: number) => {
    if (score >= 0.75) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 0.50) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-slate-600 bg-slate-50 border-slate-200';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Search className="w-4 h-4 text-gov-blue" />
            Semantic Search
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Retrieve the most relevant learning material chunks for any concept or question.
          </p>
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1.5 transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
        </button>
      </div>

      {/* Filters (collapsible) */}
      {showFilters && (
        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-600">Document</label>
            <select
              value={filterDocId}
              onChange={(e) => setFilterDocId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 bg-white"
            >
              <option value="">All indexed documents</option>
              {indexedDocs.map((d) => (
                <option key={d.document_id} value={d.document_id}>
                  {d.filename}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-slate-600">
              Results (top_k = {topK})
            </label>
            <input
              type="range"
              min={1}
              max={20}
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="w-full accent-gov-blue"
            />
          </div>
        </div>
      )}

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="semantic-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. What is stratified sampling?"
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gov-blue/20 focus:border-gov-blue text-slate-800 placeholder-slate-400"
          />
        </div>
        <button
          id="semantic-search-btn"
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-gov-blue hover:bg-blue-800 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      {!error && hasSearched && !isSearching && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-700">
              {results.length > 0
                ? `${results.length} result${results.length > 1 ? 's' : ''} for "${searchedQuery}"`
                : `No results for "${searchedQuery}"`}
            </p>
            {results.length > 0 && (
              <span className="text-[10px] text-slate-400 font-mono">
                Ranked by cosine similarity ↓
              </span>
            )}
          </div>

          {results.length === 0 && (
            <div className="py-8 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-1">
              <BookOpen className="w-7 h-7 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">
                No matching chunks found. Try a broader query.
              </p>
            </div>
          )}

          {results.map((r, i) => {
            const isExpanded = expandedIds.has(r.chunk_id);
            const locationLabel = r.locations?.length
              ? r.locations.join(', ')
              : r.location || '—';
            const truncated = r.text.length > 220 && !isExpanded;
            return (
              <div
                key={r.chunk_id}
                className="border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-colors"
              >
                {/* Result header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] font-bold text-slate-400">#{i + 1}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border font-mono ${scoreColor(r.score)}`}>
                      {r.score.toFixed(3)}
                    </span>
                    <span className="text-xs text-slate-700 font-semibold truncate">
                      {r.source}
                    </span>
                    <span className="text-[11px] text-slate-400 shrink-0">— {locationLabel}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                    {r.chunk_id}
                  </span>
                </div>

                {/* Chunk text */}
                <div className="px-4 py-3">
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {truncated ? r.text.slice(0, 220) + '…' : r.text}
                  </p>
                  {r.text.length > 220 && (
                    <button
                      onClick={() => toggleExpand(r.chunk_id)}
                      className="mt-1.5 flex items-center gap-1 text-[11px] text-gov-blue hover:underline font-semibold"
                    >
                      {isExpanded ? (
                        <><ChevronUp className="w-3 h-3" /> Show less</>
                      ) : (
                        <><ChevronDown className="w-3 h-3" /> Show more</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Idle state */}
      {!hasSearched && !isSearching && (
        <div className="py-8 border-2 border-dashed border-slate-100 rounded-xl text-center space-y-1">
          <Search className="w-7 h-7 text-slate-200 mx-auto" />
          <p className="text-xs text-slate-400">
            Enter a question or concept above to search the indexed materials.
          </p>
        </div>
      )}
    </div>
  );
};
