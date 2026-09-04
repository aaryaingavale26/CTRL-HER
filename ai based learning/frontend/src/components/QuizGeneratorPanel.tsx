import React, { useState } from 'react';
import {
  Sparkles,
  Loader2,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  FileText,
  Bookmark,
  Layers,
  Award,
  ChevronDown,
  ChevronUp,
  Tag,
  Library
} from 'lucide-react';
import { generateMCQs, saveToQuestionBank } from '../api/ai';
import { DocumentItem, MCQItem } from '../types';

interface QuizGeneratorPanelProps {
  documents: DocumentItem[];
  onQuestionSavedToBank?: () => void;
}

export const QuizGeneratorPanel: React.FC<QuizGeneratorPanelProps> = ({ documents, onQuestionSavedToBank }) => {
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [count, setCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [questions, setQuestions] = useState<MCQItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [expandedExplanations, setExpandedExplanations] = useState<Set<string>>(new Set());

  // Question Bank saving state
  const [bankStatus, setBankStatus] = useState<
    Record<string, { status: 'SAVING' | 'SAVED' | 'DUPLICATE' | 'ERROR'; message?: string }>
  >({});
  const [isSavingAll, setIsSavingAll] = useState<boolean>(false);

  // Prioritize indexed documents or documents with chunks
  const usableDocs = documents.filter(
    (d) => d.status === 'INDEXED' || d.status === 'EMBEDDED' || d.chunks > 0
  );

  const handleGenerate = async () => {
    if (!selectedDocId) {
      setError('Please select a learning material to generate questions from.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setNotice(null);
    setQuestions([]);

    try {
      const res = await generateMCQs({
        document_id: selectedDocId,
        topic: topic.trim() || undefined,
        count: count,
        difficulty: difficulty
      });

      if (res.status === 'INSUFFICIENT_CONTENT') {
        setNotice(res.message || 'Not enough relevant content was found in the document to generate grounded questions.');
      } else if (res.status === 'FAILED') {
        setError(res.message || 'Failed to generate assessment questions.');
      } else {
        setQuestions(res.questions || []);
        // Expand all explanations by default for ease of trainer review
        setExpandedExplanations(new Set((res.questions || []).map((q) => q.question_id)));
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to communicate with assessment engine.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleExplanation = (qid: string) => {
    setExpandedExplanations((prev) => {
      const next = new Set(prev);
      if (next.has(qid)) {
        next.delete(qid);
      } else {
        next.add(qid);
      }
      return next;
    });
  };

  const handleSaveToBank = async (q: MCQItem) => {
    setBankStatus((prev) => ({
      ...prev,
      [q.question_id]: { status: 'SAVING' }
    }));

    try {
      await saveToQuestionBank({
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        topic: q.topic,
        source: q.source,
        origin: 'GENERATED'
      });
      setBankStatus((prev) => ({
        ...prev,
        [q.question_id]: { status: 'SAVED', message: 'Saved as Draft' }
      }));
      if (onQuestionSavedToBank) {
        onQuestionSavedToBank();
      }
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setBankStatus((prev) => ({
          ...prev,
          [q.question_id]: { status: 'DUPLICATE', message: 'Already in Question Bank' }
        }));
      } else {
        setBankStatus((prev) => ({
          ...prev,
          [q.question_id]: {
            status: 'ERROR',
            message: err?.response?.data?.detail || 'Failed to save to bank'
          }
        }));
      }
    }
  };

  const handleSaveAllToBank = async () => {
    setIsSavingAll(true);
    for (const q of questions) {
      const current = bankStatus[q.question_id]?.status;
      if (current !== 'SAVED' && current !== 'DUPLICATE') {
        await handleSaveToBank(q);
      }
    }
    setIsSavingAll(false);
  };

  const difficultyBadgeColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'easy':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'hard':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-gov-blue" />
            AI Quiz & Assessment Generator
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate grounded multiple-choice questions with verified source attribution for official training.
          </p>
        </div>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-gov-blue border border-blue-200 w-fit">
          <Sparkles className="w-3.5 h-3.5 mr-1" />
          Phase 3A Assessment
        </span>
      </div>

      {/* Configuration Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
        {/* Document Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Learning Material
          </label>
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 bg-white focus:ring-2 focus:ring-gov-blue/20 focus:border-gov-blue"
          >
            <option value="">-- Select Material --</option>
            {usableDocs.map((doc) => (
              <option key={doc.document_id} value={doc.document_id}>
                {doc.filename} {doc.status === 'INDEXED' ? '(Indexed)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Topic Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            <Bookmark className="w-3.5 h-3.5 text-slate-400" />
            Specific Topic (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Sampling, Formula, Indicators"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 bg-white focus:ring-2 focus:ring-gov-blue/20 focus:border-gov-blue"
          />
        </div>

        {/* Question Count */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              Question Count: {count}
            </span>
          </label>
          <input
            type="range"
            min={1}
            max={20}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full mt-2 accent-gov-blue"
          />
        </div>

        {/* Difficulty */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">Difficulty Level</label>
          <div className="grid grid-cols-3 gap-1">
            {(['easy', 'medium', 'hard'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setDifficulty(level)}
                className={`py-1.5 text-xs font-semibold rounded-lg capitalize border transition-colors ${
                  difficulty === level
                    ? 'bg-gov-blue text-white border-gov-blue shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !selectedDocId}
          className="flex items-center gap-2 px-5 py-2.5 bg-gov-blue hover:bg-blue-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating Grounded Questions...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate Grounded MCQs</span>
            </>
          )}
        </button>
      </div>

      {/* Notice / Insufficient Content */}
      {notice && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Insufficient Grounded Content</p>
            <p className="mt-0.5 text-amber-700">{notice}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Generation Error</p>
            <p className="mt-0.5 text-rose-700">{error}</p>
          </div>
        </div>
      )}

      {/* Generated Questions View */}
      {questions.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800">
                Generated Assessment
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-gov-blue border border-blue-200">
                {questions.length} Questions
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                Target: {difficulty.toUpperCase()}
              </span>
              <button
                type="button"
                onClick={handleSaveAllToBank}
                disabled={isSavingAll}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-gov-blue hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
              >
                {isSavingAll ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Library className="w-3.5 h-3.5" />
                )}
                <span>Save All to Question Bank</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {questions.map((q, idx) => {
              const isExpOpen = expandedExplanations.has(q.question_id);
              const locationStr = q.source?.locations?.length
                ? q.source.locations.join(', ')
                : 'General';

              return (
                <div
                  key={q.question_id || idx}
                  className="border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:border-slate-300 transition-colors bg-white"
                >
                  {/* Question Header Card */}
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-gov-blue text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${difficultyBadgeColor(
                          q.difficulty
                        )}`}
                      >
                        {q.difficulty}
                      </span>
                      {q.topic && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          <Tag className="w-2.5 h-2.5 text-slate-400" />
                          {q.topic}
                        </span>
                      )}
                    </div>

                    {/* Source Citation Badge */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                      <FileText className="w-3 h-3 text-slate-400" />
                      <span className="font-semibold text-slate-700 truncate max-w-xs">
                        {q.source.document}
                      </span>
                      <span>•</span>
                      <span className="text-gov-teal font-medium">{locationStr}</span>
                    </div>
                  </div>

                  {/* Question Body */}
                  <div className="p-4 space-y-3">
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
                      {q.question}
                    </p>

                    {/* Options List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt) => {
                        const isCorrect = opt.id === q.correct_answer;
                        return (
                          <div
                            key={opt.id}
                            className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 transition-colors ${
                              isCorrect
                                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium'
                                : 'bg-slate-50/50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] shrink-0 ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-white text-slate-600 border border-slate-300'
                              }`}
                            >
                              {opt.id}
                            </span>
                            <div className="flex-1 leading-snug">
                              <span>{opt.text}</span>
                              {isCorrect && (
                                <span className="ml-2 inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.2 rounded border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 mr-0.5 text-emerald-600" />
                                  Correct Answer
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Grounded Explanation Accordion & Actions */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => toggleExplanation(q.question_id)}
                        className="flex items-center gap-1.5 text-xs text-gov-blue hover:text-blue-800 font-semibold"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Explanation & Grounding</span>
                        {isExpOpen ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Question Bank Save State */}
                      <div className="flex items-center gap-2">
                        {bankStatus[q.question_id]?.status === 'SAVED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Saved to Bank (Draft)
                          </span>
                        ) : bankStatus[q.question_id]?.status === 'DUPLICATE' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            <Library className="w-3.5 h-3.5 text-amber-600" />
                            Already in Bank
                          </span>
                        ) : bankStatus[q.question_id]?.status === 'ERROR' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            {bankStatus[q.question_id]?.message || 'Failed to save'}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSaveToBank(q)}
                            disabled={bankStatus[q.question_id]?.status === 'SAVING'}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-gov-blue hover:text-white text-slate-700 transition-colors disabled:opacity-50"
                          >
                            {bankStatus[q.question_id]?.status === 'SAVING' ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-gov-blue" />
                            ) : (
                              <Library className="w-3.5 h-3.5 text-slate-500" />
                            )}
                            <span>Save to Question Bank</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {isExpOpen && (
                      <div className="mt-2 p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-xs space-y-1.5">
                        <p className="text-slate-700 leading-relaxed font-normal">
                          <span className="font-semibold text-gov-blue">Explanation: </span>
                          {q.explanation}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] text-slate-500 font-mono">
                          <span>Chunk citation: {q.source.chunk_ids.join(', ')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
