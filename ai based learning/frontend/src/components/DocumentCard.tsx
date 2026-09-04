import React from 'react';
import { FileText, Calendar, HardDrive, CheckCircle2, Eye, Layers, AlertTriangle, Cpu, Loader2, Search } from 'lucide-react';
import { DocumentItem } from '../types';

interface DocumentCardProps {
  document: DocumentItem;
  onPreviewClick: (documentId: string) => void;
  onChunksClick: (documentId: string) => void;
  onEmbedClick: (documentId: string) => void;
  onIndexClick: (documentId: string) => void;
  isEmbedding?: boolean;
  isIndexing?: boolean;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onPreviewClick,
  onChunksClick,
  onEmbedClick,
  onIndexClick,
  isEmbedding = false,
  isIndexing = false,
}) => {
  const getFormatBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'ppt':
      case 'pptx':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'doc':
      case 'docx':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const formattedDate = new Date(document.uploaded_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const isIndexed = document.status === 'INDEXED';
  const isEmbedded = document.status === 'EMBEDDED' || isIndexed;
  const isChunked = document.status === 'CHUNKED' || isEmbedded;
  const isExtracted = document.status === 'TEXT_EXTRACTED' || isChunked;
  const isFailed = document.status === 'FAILED';

  const StatusBadge = () => {
    if (isIndexed) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
          <Search className="w-3 h-3 mr-1" />
          Search Indexed
        </span>
      );
    }
    if (isEmbedded) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-50 text-violet-700 border border-violet-200 shrink-0">
          <Cpu className="w-3 h-3 mr-1" />
          Vectors Ready
        </span>
      );
    }
    if (isChunked) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Chunked
        </span>
      );
    }
    if (isExtracted) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-gov-blue border border-blue-200 shrink-0">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Extracted
        </span>
      );
    }
    if (isFailed) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200 shrink-0">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
        <AlertTriangle className="w-3 h-3 mr-1" />
        {document.status}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow flex flex-col justify-between space-y-3">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
              <FileText className="w-5 h-5 text-gov-blue" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-slate-900 truncate" title={document.filename}>
                {document.filename}
              </h4>
              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase mt-0.5 ${getFormatBadgeColor(document.file_type)}`}>
                {document.file_type}
              </span>
            </div>
          </div>
          <StatusBadge />
        </div>

        {document.description && (
          <p className="text-xs text-slate-600 line-clamp-2 mt-2.5 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
            {document.description}
          </p>
        )}
      </div>

      <div className="space-y-2 pt-2 border-t border-slate-100">
        {/* Metrics row */}
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1">
              <HardDrive className="w-3 h-3 text-slate-400" />
              <span>{document.file_size_formatted}</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1 font-semibold text-gov-teal">
              <Layers className="w-3 h-3" />
              <span>{document.chunks || 0} Chunks</span>
            </span>
            {isEmbedded && (document.embeddings ?? 0) > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center space-x-1 font-semibold text-violet-600">
                  <Cpu className="w-3 h-3" />
                  <span>{document.embeddings} Vecs</span>
                </span>
              </>
            )}
          </div>

          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {isExtracted && (
            <button
              onClick={() => onPreviewClick(document.document_id)}
              className="flex items-center justify-center space-x-1.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-semibold border border-slate-200 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>View Text</span>
            </button>
          )}

          {isChunked && (
            <button
              onClick={() => onChunksClick(document.document_id)}
              className="flex items-center justify-center space-x-1.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-semibold border border-teal-200 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-gov-teal" />
              <span>Explore Chunks</span>
            </button>
          )}

          {isChunked && !isEmbedded && (
            <button
              onClick={() => onEmbedClick(document.document_id)}
              disabled={isEmbedding}
              className="col-span-2 flex items-center justify-center space-x-1.5 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-800 rounded-lg text-xs font-semibold border border-violet-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isEmbedding ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating Vectors…</span>
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Generate Embeddings</span>
                </>
              )}
            </button>
          )}

          {isEmbedded && !isIndexed && (
            <button
              onClick={() => onIndexClick(document.document_id)}
              disabled={isIndexing}
              className="col-span-2 flex items-center justify-center space-x-1.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-lg text-xs font-semibold border border-indigo-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isIndexing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Building Index…</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Build Search Index</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
