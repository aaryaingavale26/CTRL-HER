import React, { useState, useEffect } from 'react';
import { X, Search, Layers, Loader2, Copy, Check, MapPin, AlignLeft } from 'lucide-react';
import { fetchDocumentChunks } from '../api/ai';
import { DocumentChunksResponse, DocumentChunk } from '../types';

interface ChunkExplorerModalProps {
  documentId: string | null;
  onClose: () => void;
}

export const ChunkExplorerModal: React.FC<ChunkExplorerModalProps> = ({ documentId, onClose }) => {
  const [data, setData] = useState<DocumentChunksResponse | null>(null);
  const [selectedChunk, setSelectedChunk] = useState<DocumentChunk | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) return;

    const loadChunks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetchDocumentChunks(documentId);
        setData(res);
        if (res.chunks && res.chunks.length > 0) {
          setSelectedChunk(res.chunks[0]);
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || err.message || 'Failed to load document chunks.');
      } finally {
        setIsLoading(false);
      }
    };

    loadChunks();
  }, [documentId]);

  if (!documentId) return null;

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredChunks = data?.chunks.filter(
    (chunk) =>
      chunk.chunk_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chunk.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chunk.location?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-gov-teal text-white flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-semibold truncate max-w-md">
                  {data?.filename || 'Document Chunk Explorer'}
                </h3>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-teal-500/30 text-teal-200 rounded border border-teal-400/30">
                  {data?.chunk_count || 0} Chunks
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                ID: {documentId} • Structure-Aware Contextual Chunks Viewer
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close explorer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading / Error States */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center py-16 text-slate-500 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-gov-blue" />
            <p className="text-xs font-medium">Loading document chunks...</p>
          </div>
        )}

        {error && (
          <div className="flex-1 p-6">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              <p className="font-semibold">Error Loading Chunks</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Explorer Layout */}
        {!isLoading && !error && (
          <div className="flex-1 flex overflow-hidden">
            
            {/* Left Sidebar: Chunks List */}
            <div className="w-80 border-r border-slate-200 bg-slate-50 flex flex-col shrink-0">
              <div className="p-3 border-b border-slate-200">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Filter chunks by text or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gov-teal"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {filteredChunks.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-8">No matching chunks</p>
                ) : (
                  filteredChunks.map((chunk) => {
                    const isSelected = selectedChunk?.chunk_id === chunk.chunk_id;
                    return (
                      <button
                        key={chunk.chunk_id}
                        onClick={() => setSelectedChunk(chunk)}
                        className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                          isSelected
                            ? 'bg-white border-gov-teal shadow-sm ring-1 ring-gov-teal'
                            : 'bg-white/60 border-slate-200 hover:bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono text-[10px] text-slate-500 mb-1">
                          <span className="font-semibold text-gov-blue">{chunk.chunk_id}</span>
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                            {chunk.word_count} words
                          </span>
                        </div>
                        <p className="text-slate-800 line-clamp-2 text-[11px] leading-relaxed font-sans">
                          {chunk.text}
                        </p>
                        {chunk.locations && chunk.locations.length > 0 && (
                          <div className="mt-1.5 flex items-center space-x-1 text-[10px] text-slate-500 truncate">
                            <MapPin className="w-3 h-3 text-gov-teal shrink-0" />
                            <span className="truncate">{chunk.locations.join(' • ')}</span>
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Main Inspector */}
            <div className="flex-1 bg-white flex flex-col overflow-hidden">
              {selectedChunk ? (
                <>
                  {/* Chunk Metadata Bar */}
                  <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-slate-900 font-mono">
                          {selectedChunk.chunk_id}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-gov-blue">
                          Chunk #{selectedChunk.chunk_index}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-gov-teal" />
                          <span>Locations: {selectedChunk.locations.join(', ') || 'N/A'}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
                          <span>{selectedChunk.word_count} words (~{Math.round(selectedChunk.word_count * 1.3)} tokens)</span>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCopyText(selectedChunk.text, selectedChunk.chunk_id)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-gov-teal text-slate-700 hover:text-gov-teal rounded-lg text-xs font-medium transition-colors shadow-sm"
                    >
                      {copiedId === selectedChunk.chunk_id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600 font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copy Chunk Text</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Chunk Text Viewer */}
                  <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-mono pb-3 border-b border-slate-100">
                        <span>Source: {selectedChunk.source}</span>
                        <span>RAG Ingestion Ready</span>
                      </div>
                      <div className="text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-line selection:bg-blue-100">
                        {selectedChunk.text}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                  Select a chunk from the list to inspect its content and metadata.
                </div>
              )}
            </div>

          </div>
        )}

        {/* Footer */}
        <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>StatSaksham AI Contextual Chunk Explorer</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs transition-colors"
          >
            Close Explorer
          </button>
        </div>

      </div>
    </div>
  );
};
