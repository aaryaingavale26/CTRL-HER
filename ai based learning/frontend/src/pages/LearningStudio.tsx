import React, { useState, useEffect } from 'react';
import { FileUploader } from '../components/FileUploader';
import { DocumentCard } from '../components/DocumentCard';
import { DocumentPreviewModal } from '../components/DocumentPreviewModal';
import { ChunkExplorerModal } from '../components/ChunkExplorerModal';
import { SemanticSearchPanel } from '../components/SemanticSearchPanel';
import { QuizGeneratorPanel } from '../components/QuizGeneratorPanel';
import { QuestionBankPanel } from '../components/QuestionBankPanel';
import { LearnerQuizPanel } from '../components/LearnerQuizPanel';
import { LearningAssistantPanel } from '../components/LearningAssistantPanel';
import { fetchDocuments, testAiConnection, embedDocument, indexDocument } from '../api/ai';
import { DocumentItem, AITestResponse, QuizResponse } from '../types';
import { BookOpen, Sparkles, Database, Search, RefreshCw, Cpu, CheckCircle, AlertCircle, Layers } from 'lucide-react';

export const LearningStudio: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(true);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  const [chunksDocId, setChunksDocId] = useState<string | null>(null);

  // Embedding state
  const [embeddingDocId, setEmbeddingDocId] = useState<string | null>(null);
  const [embedError, setEmbedError] = useState<string | null>(null);

  // Indexing state
  const [indexingDocId, setIndexingDocId] = useState<string | null>(null);
  const [indexError, setIndexError] = useState<string | null>(null);

  // AI Connection Test state
  const [testPrompt, setTestPrompt] = useState<string>('Verify connection to StatSaksham AI LLM service for official statistics.');
  const [isTestingAi, setIsTestingAi] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<AITestResponse | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Phase 3G Question Bank launched quiz session
  const [bankLaunchedQuiz, setBankLaunchedQuiz] = useState<QuizResponse | null>(null);

  const loadDocuments = async () => {
    setIsLoadingDocs(true);
    setDocsError(null);
    try {
      const res = await fetchDocuments();
      setDocuments(res.documents || []);
    } catch (err: any) {
      setDocsError(err.message || 'Failed to fetch statistical documents from server.');
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleUploadSuccess = (newDoc: DocumentItem) => {
    setDocuments((prev) => [newDoc, ...prev]);
  };

  const handleEmbed = async (documentId: string) => {
    setEmbeddingDocId(documentId);
    setEmbedError(null);
    try {
      const result = await embedDocument(documentId);
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.document_id === documentId
            ? { ...doc, status: 'EMBEDDED' as const, embeddings: result.chunks_embedded }
            : doc
        )
      );
    } catch (err: any) {
      setEmbedError(
        err?.response?.data?.detail || err?.message || 'Failed to generate embeddings.'
      );
    } finally {
      setEmbeddingDocId(null);
    }
  };

  const handleIndex = async (documentId: string) => {
    setIndexingDocId(documentId);
    setIndexError(null);
    try {
      await indexDocument(documentId);
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.document_id === documentId
            ? { ...doc, status: 'INDEXED' as const }
            : doc
        )
      );
    } catch (err: any) {
      setIndexError(
        err?.response?.data?.detail || err?.message || 'Failed to build search index.'
      );
    } finally {
      setIndexingDocId(null);
    }
  };

  const handleRunAiTest = async () => {
    setIsTestingAi(true);
    setTestError(null);
    setTestResult(null);
    try {
      const res = await testAiConnection(testPrompt);
      setTestResult(res);
    } catch (err: any) {
      setTestError(err.response?.data?.detail || err.message || 'Failed to run AI test connection.');
    } finally {
      setIsTestingAi(false);
    }
  };

  const totalChunks = documents.reduce((acc, d) => acc + (d.chunks || 0), 0);

  const filteredDocs = documents.filter((doc) =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      
      {/* Top Welcome / Studio Header */}
      <div className="bg-gradient-to-r from-gov-navy via-slate-900 to-gov-blue text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center space-x-2 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <BookOpen className="w-4 h-4 text-teal-400" />
            <span>StatSaksham AI • P3 Document Intelligence (Phase 2B)</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">AI Content Cleaning & Intelligent Chunking Studio</h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
            Ingest, conservatively clean, and divide official statistical materials (NSS, CPI, ASI, SDG) into structure-aware contextual chunks prepared for vector search.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-gov-blue flex items-center justify-center font-bold">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Ingested Materials</p>
            <p className="text-lg font-bold text-slate-900">{documents.length} Files</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Generated Chunks</p>
            <p className="text-lg font-bold text-slate-900">{totalChunks} Chunks</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Chunking Strategy</p>
            <p className="text-lg font-bold text-emerald-700">800w / 120w (2B)</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">LLM Engine</p>
            <p className="text-lg font-bold text-slate-900">Gemini / Mock</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Upload Card & Diagnostic LLM Connection Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: File Uploader */}
        <div className="lg:col-span-2">
          <FileUploader onUploadSuccess={handleUploadSuccess} />
        </div>

        {/* Right 1 Column: LLM Provider Connection Diagnostic Panel */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-gov-blue" />
                LLM Provider Diagnostic
              </h3>
              <span className="text-[10px] font-mono bg-blue-50 text-gov-blue px-2 py-0.5 rounded border border-blue-200">
                POST /api/ai/test
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Verify real Gemini API connectivity or automatic Mock fallback response.
            </p>

            <div className="mt-3 space-y-2">
              <label className="text-[11px] font-medium text-slate-700 block">Test Prompt</label>
              <input
                type="text"
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-gov-blue focus:outline-none"
                placeholder="Enter prompt for LLM connection test..."
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={handleRunAiTest}
              disabled={isTestingAi}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-xs flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
            >
              {isTestingAi ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-400" />
                  <span>Testing LLM Service...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Test Gemini / Mock Service</span>
                </>
              )}
            </button>

            {testError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                <span className="break-all">{testError}</span>
              </div>
            )}

            {testResult && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700">{testResult.provider}</span>
                  <span className={`px-1.5 py-0.5 rounded font-mono ${testResult.is_mock ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {testResult.is_mock ? 'Mock Fallback' : 'Live Gemini API'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-mono bg-white p-2 rounded border border-slate-200 leading-relaxed max-h-24 overflow-y-auto">
                  {testResult.response_text}
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Recent Materials Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Recent Statistical Materials</h3>
            <p className="text-xs text-slate-500">Processed materials with generated contextual chunks.</p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs w-48 sm:w-64 focus:outline-none focus:ring-1 focus:ring-gov-blue"
              />
            </div>
            <button
              onClick={loadDocuments}
              className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"
              title="Refresh list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDocs ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoadingDocs && (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gov-blue" />
            <p className="text-xs font-medium">Loading statistical documents...</p>
          </div>
        )}

        {/* Error State */}
        {!isLoadingDocs && docsError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{docsError}</span>
          </div>
        )}

        {/* Embedding Error Banner */}
        {embedError && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{embedError}</span>
            </div>
            <button onClick={() => setEmbedError(null)} className="text-amber-600 hover:text-amber-800 font-semibold ml-3">✕</button>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingDocs && !docsError && filteredDocs.length === 0 && (
          <div className="py-12 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">No statistical materials found</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Upload PDF, PowerPoint, or Word documents above to begin building chunks.
            </p>
          </div>
        )}

        {/* Documents Grid */}
        {!isLoadingDocs && !docsError && filteredDocs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {filteredDocs.map((doc) => (
              <DocumentCard
                key={doc.document_id}
                document={doc}
                onPreviewClick={(id) => setPreviewDocId(id)}
                onChunksClick={(id) => setChunksDocId(id)}
                onEmbedClick={handleEmbed}
                onIndexClick={handleIndex}
                isEmbedding={embeddingDocId === doc.document_id}
                isIndexing={indexingDocId === doc.document_id}
              />
            ))}
          </div>
        )}

        {/* Index error banner */}
        {indexError && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{indexError}</span>
            </div>
            <button onClick={() => setIndexError(null)} className="text-amber-600 hover:text-amber-800 font-semibold ml-3">✕</button>
          </div>
        )}
      </div>

      {/* Semantic Search Panel */}
      <SemanticSearchPanel documents={documents} />

      {/* AI Quiz & Assessment Generator Panel (Trainer View) */}
      <QuizGeneratorPanel documents={documents} />

      {/* Phase 3G — Trainer Question Bank & Review Quality Gate */}
      <QuestionBankPanel
        onLaunchQuiz={(quiz) => {
          setBankLaunchedQuiz(quiz);
          const elem = document.getElementById('learner-quiz-section');
          if (elem) {
            elem.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      {/* Official Learner Assessment Session Panel */}
      <div id="learner-quiz-section">
        <LearnerQuizPanel documents={documents} externalQuiz={bankLaunchedQuiz} />
      </div>

      {/* Phase 3F — Grounded RAG Learning Assistant */}
      <LearningAssistantPanel documents={documents} />

      {/* Document Text Preview Modal */}
      <DocumentPreviewModal
        documentId={previewDocId}
        onClose={() => setPreviewDocId(null)}
      />

      {/* Chunk Explorer Modal */}
      <ChunkExplorerModal
        documentId={chunksDocId}
        onClose={() => setChunksDocId(null)}
      />

    </div>
  );
};
