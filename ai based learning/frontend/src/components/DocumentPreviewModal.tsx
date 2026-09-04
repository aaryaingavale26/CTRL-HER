import React, { useState, useEffect } from 'react';
import { X, Search, FileText, Loader2, Copy, Check, Hash, Layers } from 'lucide-react';
import { fetchDocumentPreview } from '../api/ai';
import { DocumentPreviewResponse } from '../types';

interface DocumentPreviewModalProps {
  documentId: string | null;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({ documentId, onClose }) => {
  const [data, setData] = useState<DocumentPreviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!documentId) return;

    const loadPreview = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetchDocumentPreview(documentId);
        setData(res);
      } catch (err: any) {
        setError(err.response?.data?.detail || err.message || 'Failed to load document preview.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPreview();
  }, [documentId]);

  if (!documentId) return null;

  const handleCopyText = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const filteredContent = data?.content.filter(
    (block) =>
      block.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.location?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-gov-blue flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-semibold truncate max-w-md">{data?.filename || 'Document Content Preview'}</h3>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-blue-500/30 text-blue-200 rounded border border-blue-400/30">
                  {data?.file_type || 'doc'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                ID: {documentId} • Structured Extracted Text Viewer
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-4 text-xs text-slate-600">
            <div className="flex items-center space-x-1 font-medium">
              <Layers className="w-4 h-4 text-gov-blue" />
              <span>{data?.pages || 0} Pages/Slides</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center space-x-1 font-medium">
              <Hash className="w-4 h-4 text-gov-teal" />
              <span>{data?.text_blocks || 0} Text Blocks</span>
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search in extracted text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gov-blue"
            />
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-100/50">
          {isLoading && (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-gov-blue" />
              <p className="text-xs font-medium">Loading extracted document text blocks...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              <p className="font-semibold">Error Loading Preview</p>
              <p className="mt-1">{error}</p>
            </div>
          )}

          {!isLoading && !error && filteredContent.length === 0 && (
            <div className="py-16 text-center text-slate-400 space-y-2 bg-white rounded-xl border border-slate-200">
              <FileText className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-semibold text-slate-700">No matching text blocks found</p>
              {searchQuery && (
                <p className="text-[11px] text-slate-400">
                  Try adjusting your search query "{searchQuery}".
                </p>
              )}
            </div>
          )}

          {!isLoading && !error && filteredContent.map((block, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-slate-300 transition-colors space-y-2"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-50 text-gov-blue border border-blue-200 font-mono">
                    {block.location || `Block ${idx + 1}`}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{block.source}</span>
                </div>

                <button
                  onClick={() => handleCopyText(block.text, idx)}
                  className="flex items-center space-x-1 px-2 py-1 text-[10px] text-slate-600 hover:text-gov-blue hover:bg-slate-50 rounded transition-colors"
                  title="Copy block text"
                >
                  {copiedIdx === idx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-xs text-slate-800 font-sans leading-relaxed whitespace-pre-line font-normal selection:bg-blue-100">
                {block.text}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>StatSaksham AI Document Intelligence Viewer</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs transition-colors"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
};
