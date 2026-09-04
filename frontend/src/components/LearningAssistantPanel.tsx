import React, { useState } from 'react';
import {
  MessageCircleQuestion,
  Send,
  Loader2,
  AlertCircle,
  FileText,
  CheckCircle2,
  MinusCircle,
  XCircle,
  BookOpen,
} from 'lucide-react';
import { askLearningAssistant } from '../api/ai';
import { LearningAssistantResponse, DocumentItem } from '../types';

interface Props {
  documents: DocumentItem[];
}

const CONFIDENCE_STYLES: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
  HIGH: {
    cls: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
    label: 'High Confidence',
  },
  MEDIUM: {
    cls: 'bg-amber-50 border-amber-200 text-amber-800',
    icon: <MinusCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
    label: 'Medium Confidence',
  },
  LOW: {
    cls: 'bg-rose-50 border-rose-200 text-rose-800',
    icon: <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />,
    label: 'Low Confidence',
  },
};

export const LearningAssistantPanel: React.FC<Props> = ({ documents }) => {
  const [question, setQuestion] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [topK, setTopK] = useState<number>(5);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<LearningAssistantResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const indexedDocs = documents.filter((d) => d.status === 'INDEXED');

  const handleAsk = async () => {
    const q = question.trim();
    if (!q) return;
    setIsLoading(true);
    setError(null);
    setResponse(null);
    try {
      const result = await askLearningAssistant({
        question: q,
        document_id: selectedDocId || undefined,
        top_k: topK,
      });
      setResponse(result);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to get an answer from the learning assistant.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const confidence = response ? CONFIDENCE_STYLES[response.confidence] ?? CONFIDENCE_STYLES.MEDIUM : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gov-blue text-white flex items-center justify-center">
            <MessageCircleQuestion className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Ask Your Learning Material</h3>
            <p className="text-[11px] text-slate-500">
              Grounded answers sourced strictly from your indexed documents.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono bg-blue-50 text-gov-blue px-2 py-0.5 rounded border border-blue-200">
          POST /api/learning-assistant/ask
        </span>
      </div>

      {/* No indexed material warning */}
      {indexedDocs.length === 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            No indexed learning material found. Upload a document, generate embeddings, and build the
            search index before asking questions.
          </span>
        </div>
      )}

      {/* Controls */}
      <div className="space-y-3">
        {/* Document Filter */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <label className="text-[11px] font-medium text-slate-600 block mb-1">
              Learning Material (optional — leave blank to search all)
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-gov-blue focus:outline-none bg-white"
            >
              <option value="">All indexed materials</option>
              {indexedDocs.map((doc) => (
                <option key={doc.document_id} value={doc.document_id}>
                  {doc.filename}
                </option>
              ))}
            </select>
          </div>
          <div className="w-24 shrink-0">
            <label className="text-[11px] font-medium text-slate-600 block mb-1">
              Chunks (1–10)
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={topK}
              onChange={(e) => setTopK(Math.max(1, Math.min(10, Number(e.target.value))))}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-gov-blue focus:outline-none"
            />
          </div>
        </div>

        {/* Question Input */}
        <div>
          <label className="text-[11px] font-medium text-slate-600 block mb-1">
            Your Question
          </label>
          <div className="flex gap-2">
            <textarea
              rows={2}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. What is the difference between stratified sampling and cluster sampling?"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-gov-blue focus:outline-none resize-none"
              disabled={isLoading}
            />
            <button
              id="learning-assistant-ask-btn"
              onClick={handleAsk}
              disabled={isLoading || !question.trim() || indexedDocs.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-gov-blue hover:bg-gov-navy text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 shrink-0 self-end cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Ask</span>
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Press Enter to ask · Shift+Enter for new line</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="py-8 flex flex-col items-center gap-2 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin text-gov-blue" />
          <p className="text-xs">Retrieving relevant content and generating a grounded answer…</p>
        </div>
      )}

      {/* Response */}
      {response && !isLoading && (
        <div className="space-y-3 border-t border-slate-100 pt-4">
          {/* Question echo */}
          <div className="text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700">Question: </span>
            {response.question}
          </div>

          {/* Confidence badge */}
          {confidence && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium w-fit ${confidence.cls}`}>
              {confidence.icon}
              <span>{confidence.label}</span>
            </div>
          )}

          {/* Answer */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-gov-blue" />
              Answer
            </h4>
            <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
              {response.answer}
            </p>
          </div>

          {/* Sources */}
          {response.sources.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Sources ({response.sources.length})
              </h4>
              <div className="space-y-1">
                {response.sources.map((src, i) => (
                  <div
                    key={`${src.chunk_id}-${i}`}
                    className="flex items-center gap-2 text-[11px] text-slate-600 bg-blue-50/60 border border-blue-100 rounded-lg px-3 py-1.5"
                  >
                    <FileText className="w-3 h-3 text-gov-blue shrink-0" />
                    <span className="font-medium text-slate-800 truncate">{src.document}</span>
                    {src.location && (
                      <>
                        <span className="text-slate-400">—</span>
                        <span className="text-slate-500">{src.location}</span>
                      </>
                    )}
                    <span className="ml-auto font-mono text-[10px] text-slate-400 shrink-0">{src.chunk_id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No sources message for insufficient context */}
          {response.status === 'INSUFFICIENT_CONTEXT' || response.status === 'NO_INDEX' ? (
            <div className="text-[11px] text-slate-500 italic">
              No source citations available — the answer could not be grounded in the learning material.
            </div>
          ) : null}
        </div>
      )}

      {/* Empty state */}
      {!response && !isLoading && !error && indexedDocs.length > 0 && (
        <div className="py-6 border-2 border-dashed border-slate-100 rounded-xl text-center space-y-1">
          <MessageCircleQuestion className="w-7 h-7 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Ask a question to get a grounded answer</p>
          <p className="text-[11px] text-slate-400">
            Answers are generated only from your indexed learning material.
          </p>
        </div>
      )}
    </div>
  );
};
