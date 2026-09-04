import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Send,
  RotateCcw,
  Target,
  BarChart3,
  Bookmark,
  Layers,
  Award,
  Clock,
  TrendingUp,
  Compass
} from 'lucide-react';
import {
  createQuiz,
  getQuiz,
  submitQuiz,
  getLearnerProgress,
  getLearnerRecommendation,
  startPersonalizedPractice
} from '../api/ai';
import {
  DocumentItem,
  QuizResponse,
  QuizResult,
  QuizSubmissionRequest,
  LearnerProgressProfile,
  PersonalizedRecommendation
} from '../types';

interface LearnerQuizPanelProps {
  documents: DocumentItem[];
  externalQuiz?: QuizResponse | null;
}

export const LearnerQuizPanel: React.FC<LearnerQuizPanelProps> = ({ documents, externalQuiz }) => {
  // Phase state
  const [phase, setPhase] = useState<'CONFIG' | 'TAKING' | 'RESULT'>('CONFIG');

  // Config inputs
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [count, setCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  // Active quiz session state
  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});

  // Result & Progress state
  const [result, setResult] = useState<QuizResult | null>(null);
  const [learnerProfile, setLearnerProfile] = useState<LearnerProgressProfile | null>(null);
  const [recommendation, setRecommendation] = useState<PersonalizedRecommendation | null>(null);

  // Status & Error
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // React to external quiz session launched from Question Bank
  React.useEffect(() => {
    if (externalQuiz) {
      setQuiz(externalQuiz);
      setCurrentIndex(0);
      setAnswers({});
      setResult(null);
      setPhase('TAKING');
      setError(null);
    }
  }, [externalQuiz]);

  const usableDocs = documents.filter(
    (d) => d.status === 'INDEXED' || d.status === 'EMBEDDED' || d.chunks > 0
  );

  // 1. Start Quiz Handler
  const handleStartQuiz = async () => {
    if (!selectedDocId) {
      setError('Please select a learning material to start a quiz session.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Create quiz session
      const createRes = await createQuiz({
        document_id: selectedDocId,
        topic: topic.trim() || undefined,
        count: count,
        difficulty: difficulty,
        learner_id: 'statistical_official'
      });

      // Fetch learner-safe quiz session
      const quizRes = await getQuiz(createRes.quiz_id);
      setQuiz(quizRes);
      setCurrentIndex(0);
      setAnswers({});
      setPhase('TAKING');
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to initialize quiz session.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Select Option Handler
  const handleSelectOption = (questionId: string, optionId: 'A' | 'B' | 'C' | 'D') => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  // 3. Submit Quiz Handler
  const handleSubmitQuiz = async () => {
    if (!quiz) return;

    // Check unanswered questions
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < quiz.total_questions) {
      const confirmed = window.confirm(
        `You have answered ${answeredCount} of ${quiz.total_questions} questions. Do you want to submit anyway?`
      );
      if (!confirmed) return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const submission: QuizSubmissionRequest = {
        answers: quiz.questions.map((q) => ({
          question_id: q.question_id,
          selected_answer: answers[q.question_id] || null
        }))
      };

      const evalResult = await submitQuiz(quiz.quiz_id, submission);
      setResult(evalResult);

      // Automatically load updated longitudinal learner progress & recommendation
      try {
        const progress = await getLearnerProgress(evalResult.learner_id);
        setLearnerProfile(progress);
      } catch (profileErr) {
        console.warn('Failed to load updated learner profile:', profileErr);
      }

      try {
        const rec = await getLearnerRecommendation(evalResult.learner_id);
        setRecommendation(rec);
      } catch (recErr) {
        console.warn('Failed to load recommendation:', recErr);
      }

      setPhase('RESULT');
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to evaluate quiz submission.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Start Personalized Recommended Practice
  const handleStartPersonalizedPractice = async () => {
    if (!result?.learner_id) return;
    setIsLoading(true);
    setError(null);
    try {
      const practiceQuiz = await startPersonalizedPractice(result.learner_id, 3);
      setQuiz(practiceQuiz);
      setCurrentIndex(0);
      setAnswers({});
      setResult(null);
      setLearnerProfile(null);
      setRecommendation(null);
      setPhase('TAKING');
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to start personalized practice session.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Reset to Config
  const handleReset = () => {
    setPhase('CONFIG');
    setQuiz(null);
    setResult(null);
    setLearnerProfile(null);
    setRecommendation(null);
    setAnswers({});
    setError(null);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Panel Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-gov-blue" />
            Official Learner Assessment Session
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive quiz session with deterministic server-side evaluation, scoring, and source review.
          </p>
        </div>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 w-fit">
          <Clock className="w-3.5 h-3.5 mr-1" />
          Phase 3B Evaluation
        </span>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Notice</p>
            <p className="mt-0.5 text-rose-700">{error}</p>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 1: CONFIG / START SCREEN                             */}
      {/* ========================================================= */}
      {phase === 'CONFIG' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            {/* Material selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Select Material
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

            {/* Optional Topic */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                Target Topic (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Sampling Design"
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
                  Questions: {count}
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
              <label className="text-xs font-semibold text-slate-700">Difficulty</label>
              <div className="grid grid-cols-3 gap-1">
                {(['easy', 'medium', 'hard'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDifficulty(lvl)}
                    className={`py-1.5 text-xs font-semibold rounded-lg capitalize border transition-colors ${
                      difficulty === lvl
                        ? 'bg-gov-blue text-white border-gov-blue shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleStartQuiz}
              disabled={isLoading || !selectedDocId}
              className="flex items-center gap-2 px-5 py-2.5 bg-gov-blue hover:bg-blue-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Preparing Quiz Session...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Start Learner Quiz</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 2: ACTIVE QUIZ TAKING                                 */}
      {/* ========================================================= */}
      {phase === 'TAKING' && quiz && (
        <div className="space-y-6">
          {/* Progress Tracker Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <span className="text-gov-blue font-bold">
                Question {currentIndex + 1} of {quiz.total_questions}
              </span>
              <span>•</span>
              <span className="text-slate-500">
                {Object.keys(answers).length} of {quiz.total_questions} answered
              </span>
            </div>

            {/* Step navigation dots */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {quiz.questions.map((q, idx) => {
                const isAnswered = Boolean(answers[q.question_id]);
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={q.question_id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                      isCurrent
                        ? 'bg-gov-blue text-white ring-2 ring-gov-blue/30'
                        : isAnswered
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Question Card */}
          {(() => {
            const currentQ = quiz.questions[currentIndex];
            const selectedOption = answers[currentQ.question_id];

            return (
              <div className="border border-slate-200 rounded-xl p-5 space-y-5 bg-white shadow-xs">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold border uppercase bg-slate-100 text-slate-700 border-slate-200">
                      {currentQ.difficulty}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-gov-blue border border-blue-200">
                      {currentQ.topic}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ID: {currentQ.question_id}
                  </span>
                </div>

                <h4 className="text-sm sm:text-base font-semibold text-slate-900 leading-relaxed">
                  {currentQ.question}
                </h4>

                {/* Options List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {currentQ.options.map((opt) => {
                    const isSelected = selectedOption === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOption(currentQ.question_id, opt.id)}
                        className={`p-3.5 rounded-xl border text-left text-xs flex items-start gap-3 transition-all ${
                          isSelected
                            ? 'bg-blue-50/80 border-gov-blue ring-1 ring-gov-blue text-slate-900 font-medium'
                            : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100/70 hover:border-slate-300'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-gov-blue text-white shadow-xs'
                              : 'bg-white text-slate-600 border border-slate-300'
                          }`}
                        >
                          {opt.id}
                        </span>
                        <span className="leading-relaxed flex-1 mt-0.5">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
              disabled={currentIndex === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-2">
              {currentIndex < quiz.total_questions - 1 ? (
                <button
                  onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, quiz.total_questions - 1))}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : null}

              <button
                onClick={handleSubmitQuiz}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Evaluating...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Quiz</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 3: QUIZ RESULT & QUESTION REVIEW                     */}
      {/* ========================================================= */}
      {phase === 'RESULT' && result && (
        <div className="space-y-6">
          {/* Top Score Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-xs text-slate-500 font-semibold">Total Score</span>
              <p className="text-xl font-bold text-slate-900 mt-0.5">
                {result.score} / {result.total_questions}
              </p>
              <span className="text-[11px] font-bold text-gov-blue">
                {result.percentage}%
              </span>
            </div>

            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-center">
              <span className="text-xs text-emerald-700 font-semibold">Correct</span>
              <p className="text-xl font-bold text-emerald-800 mt-0.5">
                {result.correct_answers}
              </p>
              <span className="text-[10px] text-emerald-600 font-medium">answers</span>
            </div>

            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl text-center">
              <span className="text-xs text-rose-700 font-semibold">Incorrect</span>
              <p className="text-xl font-bold text-rose-800 mt-0.5">
                {result.incorrect_answers}
              </p>
              <span className="text-[10px] text-rose-600 font-medium">answers</span>
            </div>

            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-center">
              <span className="text-xs text-amber-700 font-semibold">Unanswered</span>
              <p className="text-xl font-bold text-amber-800 mt-0.5">
                {result.unanswered_questions}
              </p>
              <span className="text-[10px] text-amber-600 font-medium">skipped</span>
            </div>
          </div>

          {/* Feedback Banner */}
          <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl flex items-start gap-3">
            <Award className="w-5 h-5 text-gov-blue shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-900">Evaluation Feedback</p>
              <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
                {result.overall_feedback}
              </p>
            </div>
          </div>

          {/* Topic Performance Breakdown */}
          {result.topic_performance && result.topic_performance.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                <BarChart3 className="w-4 h-4 text-gov-blue" />
                Topic-Level Accuracy Breakdown
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.topic_performance.map((tp) => {
                  const isStrongest = result.strongest_topic === tp.topic;
                  const isWeakest = result.weakest_topic === tp.topic;

                  return (
                    <div
                      key={tp.topic}
                      className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/40 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {tp.topic}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isStrongest && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Strongest
                            </span>
                          )}
                          {isWeakest && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              Focus Area
                            </span>
                          )}
                          <span className="text-xs font-bold text-slate-800">
                            {tp.accuracy}%
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            tp.accuracy >= 75
                              ? 'bg-emerald-500'
                              : tp.accuracy >= 50
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${tp.accuracy}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{tp.questions} Questions</span>
                        <span>{tp.correct} Correct • {tp.incorrect} Incorrect • {tp.unanswered} Skipped</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Longitudinal Learner Progress & Mastery Tracking */}
          {learnerProfile && Object.keys(learnerProfile.topics).length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                  <TrendingUp className="w-4 h-4 text-gov-blue" />
                  Learner Cumulative Progress & Mastery Tracking
                </h4>
                <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
                  <span>Tracked: <strong className="text-slate-800">{learnerProfile.total_tracked_topics}</strong></span>
                  <span>Mastered: <strong className="text-emerald-700">{learnerProfile.mastered_topics}</strong></span>
                  <span>Needs Review: <strong className="text-rose-700">{learnerProfile.topics_needing_review}</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {Object.values(learnerProfile.topics).map((tp) => {
                  const statusBadges: Record<string, string> = {
                    MASTERED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                    IMPROVING: 'bg-blue-100 text-blue-800 border-blue-300',
                    LEARNING: 'bg-amber-100 text-amber-800 border-amber-300',
                    NEEDS_REVIEW: 'bg-rose-100 text-rose-800 border-rose-300',
                  };
                  const trendStyles: Record<string, string> = {
                    IMPROVING: 'text-emerald-700 font-semibold',
                    STABLE: 'text-slate-600 font-medium',
                    DECLINING: 'text-rose-700 font-semibold',
                    INSUFFICIENT_DATA: 'text-slate-400',
                  };

                  return (
                    <div
                      key={tp.topic}
                      className="p-3 bg-white border border-slate-200 rounded-lg space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-800 truncate">
                          {tp.topic}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            statusBadges[tp.status] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {tp.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5 border-t border-slate-100">
                        <span>Overall: <strong className="text-slate-700">{tp.accuracy}%</strong></span>
                        <span>Recent: <strong className="text-slate-700">{tp.recent_accuracy}%</strong></span>
                        <span>Trend: <strong className={trendStyles[tp.trend] || 'text-slate-500'}>{tp.trend.replace('_', ' ')}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Personalized Learning Recommendation (Phase 3E) */}
          {recommendation && recommendation.status === 'RECOMMENDED' && recommendation.recommended_topic && (
            <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-blue-200/80 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gov-blue text-white flex items-center justify-center shrink-0">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Your Next Learning Step
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Personalized recommendation derived deterministically from your performance history
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 uppercase">
                    Action: {recommendation.action}
                  </span>
                  {recommendation.priority_score !== undefined && recommendation.priority_score !== null && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      Priority: {recommendation.priority_score}
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-white/80 border border-blue-100 rounded-lg p-3 space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {recommendation.recommended_topic}
                    </span>
                    {recommendation.topic_status && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {recommendation.topic_status.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    {recommendation.recent_accuracy !== undefined && recommendation.recent_accuracy !== null && (
                      <span>Recent Accuracy: <strong className="text-slate-800">{recommendation.recent_accuracy}%</strong></span>
                    )}
                    {recommendation.trend && (
                      <span>Trend: <strong className="text-slate-800">{recommendation.trend}</strong></span>
                    )}
                  </div>
                </div>

                <p className="text-slate-600 text-[12px] leading-relaxed">
                  <span className="font-semibold text-slate-800">Reason: </span>
                  {recommendation.reason}
                </p>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-blue-50">
                  <span className="text-[11px] text-gov-blue font-medium flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    {recommendation.next_step}
                  </span>
                  <button
                    onClick={handleStartPersonalizedPractice}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gov-blue hover:bg-gov-navy text-white text-xs font-semibold rounded-lg transition-colors shadow-xs shrink-0 cursor-pointer"
                  >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>Practice This Topic</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {recommendation && recommendation.status === 'ALL_MASTERED' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-3 text-xs text-emerald-800">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold">All Tracked Topics Mastered! </span>
                  <span>{recommendation.reason} {recommendation.next_step}</span>
                </div>
              </div>
            </div>
          )}

          {/* Question Review Section */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
              <Target className="w-4 h-4 text-gov-blue" />
              Detailed Question Review
            </h4>

            <div className="space-y-4">
              {result.question_results.map((qr, idx) => {
                const isCorrect = qr.is_correct;
                const wasSkipped = qr.selected_answer === null;

                return (
                  <div
                    key={qr.question_id || idx}
                    className={`border rounded-xl p-4.5 space-y-3.5 transition-colors ${
                      isCorrect
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : wasSkipped
                        ? 'border-amber-200 bg-amber-50/20'
                        : 'border-rose-200 bg-rose-50/20'
                    }`}
                  >
                    {/* Review Question Header */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold bg-slate-200 text-slate-800">
                          {idx + 1}
                        </span>
                        {isCorrect ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Correct
                          </span>
                        ) : wasSkipped ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded border border-amber-200">
                            <HelpCircle className="w-3.5 h-3.5" />
                            Skipped
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100/60 px-2 py-0.5 rounded border border-rose-200">
                            <XCircle className="w-3.5 h-3.5" />
                            Incorrect
                          </span>
                        )}
                        <span className="text-[11px] text-slate-500 font-medium">
                          • {qr.topic}
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-400 font-mono">
                        {qr.question_id}
                      </span>
                    </div>

                    {/* Question text */}
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
                      {qr.question}
                    </p>

                    {/* Options Review */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {qr.options.map((opt) => {
                        const isLearnerPick = opt.id === qr.selected_answer;
                        const isActualCorrect = opt.id === qr.correct_answer;

                        return (
                          <div
                            key={opt.id}
                            className={`p-2.5 rounded-lg border flex items-start gap-2 ${
                              isActualCorrect
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-medium'
                                : isLearnerPick
                                ? 'bg-rose-50 border-rose-300 text-rose-950 line-through'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[11px] shrink-0 ${
                                isActualCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : isLearnerPick
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {opt.id}
                            </span>
                            <span className="flex-1 leading-snug">{opt.text}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Grounded Explanation */}
                    <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-xs space-y-1">
                      <p className="text-slate-800 leading-relaxed">
                        <span className="font-semibold text-gov-blue">Explanation: </span>
                        {qr.explanation}
                      </p>
                      {qr.source && (
                        <div className="pt-1 text-[11px] text-slate-500 flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{qr.source.document}</span>
                          <span>•</span>
                          <span>{qr.source.locations?.join(', ') || 'Page 1'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reset action */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Take Another Quiz</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
