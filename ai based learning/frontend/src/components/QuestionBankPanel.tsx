import React, { useState, useEffect } from 'react';
import {
  Library,
  CheckCircle2,
  XCircle,
  Clock,
  Edit3,
  Search,
  RefreshCw,
  PlayCircle,
  FileText,
  Tag,
  AlertCircle,
  Check
} from 'lucide-react';
import {
  listQuestionBank,
  updateQuestionBankItem,
  approveQuestionBankItem,
  rejectQuestionBankItem,
  createQuizFromQuestionBank
} from '../api/ai';
import {
  QuestionBankItem,
  QuestionBankStatus,
  QuizResponse
} from '../types';

interface QuestionBankPanelProps {
  onLaunchQuiz?: (quiz: QuizResponse) => void;
}

export const QuestionBankPanel: React.FC<QuestionBankPanelProps> = ({ onLaunchQuiz }) => {
  const [items, setItems] = useState<QuestionBankItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<QuestionBankItem | null>(null);
  const [editQuestion, setEditQuestion] = useState<string>('');
  const [editOptions, setEditOptions] = useState<{ id: 'A' | 'B' | 'C' | 'D'; text: string }[]>([]);
  const [editCorrectAnswer, setEditCorrectAnswer] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [editExplanation, setEditExplanation] = useState<string>('');
  const [editDifficulty, setEditDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [editTopic, setEditTopic] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Assemble Quiz from Bank State
  const [quizCount, setQuizCount] = useState<number>(5);
  const [quizTopic, setQuizTopic] = useState<string>('');
  const [isCreatingQuiz, setIsCreatingQuiz] = useState<boolean>(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  const fetchItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await listQuestionBank({
        status: statusFilter || undefined,
        difficulty: difficultyFilter || undefined,
        search: searchQuery.trim() || undefined,
      });
      setItems(res.items || []);
      setTotalCount(res.total || 0);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to load question bank.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [statusFilter, difficultyFilter]);

  // Handle Search on Enter or debounce
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems();
  };

  // Status Actions
  const handleApprove = async (id: string) => {
    try {
      const updated = await approveQuestionBankItem(id);
      setItems((prev) => prev.map((item) => (item.question_id === id ? updated : item)));
      setSuccessMessage(`Question ${id} approved successfully.`);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to approve question.');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const updated = await rejectQuestionBankItem(id);
      setItems((prev) => prev.map((item) => (item.question_id === id ? updated : item)));
      setSuccessMessage(`Question ${id} rejected.`);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to reject question.');
    }
  };

  // Open Edit Modal
  const openEditModal = (item: QuestionBankItem) => {
    setEditingItem(item);
    setEditQuestion(item.question);
    setEditOptions(item.options.map((o) => ({ id: o.id, text: o.text })));
    setEditCorrectAnswer(item.correct_answer);
    setEditExplanation(item.explanation);
    setEditDifficulty(item.difficulty);
    setEditTopic(item.topic);
    setEditError(null);
  };

  // Save Edit
  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setIsSavingEdit(true);
    setEditError(null);
    try {
      const updated = await updateQuestionBankItem(editingItem.question_id, {
        question: editQuestion.trim(),
        options: editOptions,
        correct_answer: editCorrectAnswer,
        explanation: editExplanation.trim(),
        difficulty: editDifficulty,
        topic: editTopic.trim(),
      });
      setItems((prev) => prev.map((i) => (i.question_id === updated.question_id ? updated : i)));
      setEditingItem(null);
      setSuccessMessage('Question updated successfully.');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setEditError(err?.response?.data?.detail || err?.message || 'Failed to update question.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Assemble Quiz from Bank
  const handleAssembleQuiz = async () => {
    setIsCreatingQuiz(true);
    setQuizError(null);
    try {
      const res = await createQuizFromQuestionBank({
        count: quizCount,
        topic: quizTopic.trim() || undefined,
        learner_id: 'trainer_review_candidate',
      });
      setSuccessMessage(`Official assessment created with ${res.total_questions} approved questions!`);
      setTimeout(() => setSuccessMessage(null), 3500);
      if (onLaunchQuiz) {
        onLaunchQuiz(res);
      }
    } catch (err: any) {
      setQuizError(err?.response?.data?.detail || err?.message || 'Failed to assemble quiz from question bank.');
    } finally {
      setIsCreatingQuiz(false);
    }
  };

  // Summary counts
  const approvedCount = items.filter((i) => i.status === 'APPROVED').length;
  const draftCount = items.filter((i) => i.status === 'DRAFT').length;
  const rejectedCount = items.filter((i) => i.status === 'REJECTED').length;

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

  const statusBadge = (status: QuestionBankStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Rejected
          </span>
        );
      case 'DRAFT':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Draft Review
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Library className="w-5 h-5 text-gov-blue" />
            <h3 className="text-base font-semibold text-slate-900">
              Trainer Question Bank & Review
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Phase 3G Quality Gate
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review, edit, approve, and curate grounded MCQs before they become reusable for learner quizzes.
          </p>
        </div>

        {/* Action Counters */}
        <div className="flex items-center gap-2">
          <button
            onClick={fetchItems}
            disabled={isLoading}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 hover:text-slate-900 text-xs flex items-center gap-1.5 transition-colors"
            title="Refresh Question Bank"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-gov-blue' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Metric Counters Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-gov-blue flex items-center justify-center font-bold text-xs">
            {totalCount}
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Total Bank Items</div>
            <div className="text-sm font-bold text-slate-900">{totalCount} Questions</div>
          </div>
        </div>

        <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
            {draftCount}
          </div>
          <div>
            <div className="text-[11px] text-amber-700 font-medium">Drafts Pending Review</div>
            <div className="text-sm font-bold text-amber-950">{draftCount} Pending</div>
          </div>
        </div>

        <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
            {approvedCount}
          </div>
          <div>
            <div className="text-[11px] text-emerald-700 font-medium">Approved for Quizzes</div>
            <div className="text-sm font-bold text-emerald-950">{approvedCount} Ready</div>
          </div>
        </div>

        <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs">
            {rejectedCount}
          </div>
          <div>
            <div className="text-[11px] text-rose-700 font-medium">Rejected Questions</div>
            <div className="text-sm font-bold text-rose-950">{rejectedCount} Rejected</div>
          </div>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-800 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Assemble Quiz from Bank Banner */}
      <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-xl border border-blue-200 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PlayCircle className="w-4 h-4 text-gov-blue" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              Assemble Official Learner Assessment from Bank
            </h4>
          </div>
          <span className="text-[11px] text-slate-600 font-medium">
            Uses <strong className="text-emerald-700">{approvedCount} Approved</strong> questions only
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-center">
          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">Question Count</label>
            <input
              type="number"
              min={1}
              max={20}
              value={quizCount}
              onChange={(e) => setQuizCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-gov-blue focus:outline-none bg-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">Optional Topic Filter</label>
            <input
              type="text"
              placeholder="e.g. Sampling Methodology, CPI..."
              value={quizTopic}
              onChange={(e) => setQuizTopic(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-gov-blue focus:outline-none bg-white"
            />
          </div>

          <div className="pt-4 sm:pt-4">
            <button
              onClick={handleAssembleQuiz}
              disabled={isCreatingQuiz || approvedCount < quizCount}
              className="w-full py-1.5 px-3 bg-gov-blue hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
            >
              {isCreatingQuiz ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Assembling...</span>
                </>
              ) : (
                <>
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Launch Bank Quiz ({quizCount})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {approvedCount < quizCount && (
          <p className="text-[11px] text-amber-700 flex items-center gap-1 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            Requires at least {quizCount} approved questions in the bank. Currently {approvedCount} approved. Review and approve draft questions below.
          </p>
        )}

        {quizError && (
          <div className="p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800">
            {quizError}
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              statusFilter === ''
                ? 'bg-gov-blue text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Items ({items.length})
          </button>
          <button
            onClick={() => setStatusFilter('DRAFT')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center gap-1 ${
              statusFilter === 'DRAFT'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3 h-3" />
            Drafts ({draftCount})
          </button>
          <button
            onClick={() => setStatusFilter('APPROVED')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center gap-1 ${
              statusFilter === 'APPROVED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setStatusFilter('REJECTED')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center gap-1 ${
              statusFilter === 'REJECTED'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <XCircle className="w-3 h-3" />
            Rejected ({rejectedCount})
          </button>
        </div>

        {/* Search & Difficulty */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-gov-blue"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <div className="relative flex-1 sm:w-56">
            <input
              type="text"
              placeholder="Search question / topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-gov-blue focus:outline-none bg-white"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>

          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Questions List */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin text-gov-blue" />
          <p className="text-xs">Loading Question Bank items...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
          <Library className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-sm font-semibold text-slate-700">No questions found in this view</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Generate questions using the AI Quiz Generator above and click <strong>"Save to Question Bank"</strong> to start curating questions.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, idx) => {
            const locationStr = item.source?.locations?.length
              ? item.source.locations.join(', ')
              : 'General';

            return (
              <div
                key={item.question_id}
                className="border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:border-slate-300 transition-colors bg-white"
              >
                {/* Header bar */}
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    {statusBadge(item.status)}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${difficultyBadgeColor(
                        item.difficulty
                      )}`}
                    >
                      {item.difficulty}
                    </span>
                    {item.topic && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        <Tag className="w-2.5 h-2.5 text-slate-400" />
                        {item.topic}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-slate-400">
                      {item.question_id}
                    </span>
                  </div>

                  {/* Provenance Badge */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                    <FileText className="w-3 h-3 text-slate-400" />
                    <span className="font-semibold text-slate-700 truncate max-w-xs">
                      {item.source?.document || 'Document'}
                    </span>
                    <span>•</span>
                    <span className="text-gov-teal font-medium">{locationStr}</span>
                    <span className="px-1.5 py-0.2 bg-slate-100 rounded text-[9px] font-mono text-slate-600">
                      {item.origin}
                    </span>
                  </div>
                </div>

                {/* Question Body */}
                <div className="p-4 space-y-3">
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
                    {item.question}
                  </p>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {item.options.map((opt) => {
                      const isCorrect = opt.id === item.correct_answer;
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

                  {/* Grounded Explanation */}
                  <div className="p-3 bg-blue-50/40 border border-blue-100 rounded-lg text-xs space-y-1">
                    <p className="text-slate-700 leading-relaxed">
                      <span className="font-semibold text-gov-blue">Grounded Explanation: </span>
                      {item.explanation}
                    </p>
                    <div className="flex items-center gap-2 pt-0.5 text-[10px] text-slate-500 font-mono">
                      <span>Chunk citation: {item.source?.chunk_ids?.join(', ') || 'chunk_00'}</span>
                    </div>
                  </div>

                  {/* Trainer Review Action Bar */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-400 font-mono">
                      Last updated: {new Date(item.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Edit Question</span>
                      </button>

                      {item.status !== 'APPROVED' && (
                        <button
                          onClick={() => handleApprove(item.question_id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                      )}

                      {item.status !== 'REJECTED' && (
                        <button
                          onClick={() => handleReject(item.question_id)}
                          className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Reject</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Trainer Edit Question Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-gov-blue" />
                  Edit Question Item
                </h3>
                <p className="text-xs text-slate-500">
                  Refine wording, options, or explanation. Source document provenance is permanently preserved.
                </p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            {/* Question Text */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Question Prompt</label>
              <textarea
                rows={2}
                value={editQuestion}
                onChange={(e) => setEditQuestion(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-gov-blue focus:outline-none"
              />
            </div>

            {/* Topic & Difficulty */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Topic</label>
                <input
                  type="text"
                  value={editTopic}
                  onChange={(e) => setEditTopic(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-gov-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Difficulty</label>
                <select
                  value={editDifficulty}
                  onChange={(e) => setEditDifficulty(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-gov-blue focus:outline-none"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            {/* Options Editing */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Options & Correct Answer</label>
              {editOptions.map((opt, idx) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                    {opt.id}
                  </span>
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => {
                      const newOpts = [...editOptions];
                      newOpts[idx].text = e.target.value;
                      setEditOptions(newOpts);
                    }}
                    className="flex-1 p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-gov-blue focus:outline-none"
                  />
                  <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 shrink-0 cursor-pointer bg-slate-50 px-2 py-1.5 rounded border border-slate-200 hover:bg-slate-100">
                    <input
                      type="radio"
                      name="correct_answer"
                      checked={editCorrectAnswer === opt.id}
                      onChange={() => setEditCorrectAnswer(opt.id)}
                      className="accent-gov-blue"
                    />
                    Correct
                  </label>
                </div>
              ))}
            </div>

            {/* Explanation */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Explanation</label>
              <textarea
                rows={2}
                value={editExplanation}
                onChange={(e) => setEditExplanation(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-gov-blue focus:outline-none"
              />
            </div>

            {/* Immutable Provenance Display */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 flex items-center justify-between">
              <div>
                <strong>Immutable Source:</strong> {editingItem.source?.document} (ID: {editingItem.source?.document_id})
              </div>
              <span className="font-mono text-slate-500">Chunk {editingItem.source?.chunk_ids?.join(', ') || 'chunk_00'}</span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="px-4 py-2 bg-gov-blue hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSavingEdit && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>Save Question Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
