import axios from 'axios';
import {
  HealthResponse,
  AITestResponse,
  UploadResponse,
  DocumentListResponse,
  DocumentPreviewResponse,
  DocumentChunksResponse,
  DocumentStatusResponse,
  EmbedResponse,
  IndexResponse,
  SearchRequest,
  SearchResponse,
  MCQGenerationRequest,
  MCQGenerationResponse,
  QuizCreateRequest,
  QuizResponse,
  QuizSubmissionRequest,
  QuizResult,
  LearnerProgressProfile,
  LearnerTopicProgress,
  PersonalizedRecommendation,
  LearningAssistantRequest,
  LearningAssistantResponse,
  QuestionBankItem,
  QuestionBankSaveRequest,
  QuestionBankUpdateRequest,
  QuestionBankListResponse,
  QuizFromBankRequest
} from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getHealthStatus = async (): Promise<HealthResponse> => {
  const response = await api.get<HealthResponse>('/health');
  return response.data;
};

export const testAiConnection = async (prompt?: string): Promise<AITestResponse> => {
  const response = await api.post<AITestResponse>('/ai/test', { prompt });
  return response.data;
};

export const uploadLearningDocument = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<UploadResponse>('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const fetchDocuments = async (): Promise<DocumentListResponse> => {
  const response = await api.get<DocumentListResponse>('/documents');
  return response.data;
};

export const fetchDocumentPreview = async (documentId: string): Promise<DocumentPreviewResponse> => {
  const response = await api.get<DocumentPreviewResponse>(`/documents/${documentId}/preview`);
  return response.data;
};

export const fetchDocumentChunks = async (documentId: string): Promise<DocumentChunksResponse> => {
  const response = await api.get<DocumentChunksResponse>(`/documents/${documentId}/chunks`);
  return response.data;
};

export const fetchDocumentStatus = async (documentId: string): Promise<DocumentStatusResponse> => {
  const response = await api.get<DocumentStatusResponse>(`/documents/${documentId}/status`);
  return response.data;
};

export const embedDocument = async (documentId: string): Promise<EmbedResponse> => {
  const response = await api.post<EmbedResponse>(`/documents/${documentId}/embed`);
  return response.data;
};

export const indexDocument = async (documentId: string): Promise<IndexResponse> => {
  const response = await api.post<IndexResponse>(`/documents/${documentId}/index`);
  return response.data;
};

export const semanticSearch = async (
  query: string,
  topK: number = 5,
  documentId?: string
): Promise<SearchResponse> => {
  const body: SearchRequest = { query, top_k: topK };
  if (documentId) body.document_id = documentId;
  const response = await api.post<SearchResponse>('/search', body);
  return response.data;
};

export const generateMCQs = async (request: MCQGenerationRequest): Promise<MCQGenerationResponse> => {
  const response = await api.post<MCQGenerationResponse>('/assessment/mcqs/generate', request);
  return response.data;
};

export const createQuiz = async (request: QuizCreateRequest): Promise<QuizResponse> => {
  const response = await api.post<QuizResponse>('/assessment/quizzes', request);
  return response.data;
};

export const getQuiz = async (quizId: string): Promise<QuizResponse> => {
  const response = await api.get<QuizResponse>(`/assessment/quizzes/${quizId}`);
  return response.data;
};

export const submitQuiz = async (
  quizId: string,
  submission: QuizSubmissionRequest
): Promise<QuizResult> => {
  const response = await api.post<QuizResult>(`/assessment/quizzes/${quizId}/submit`, submission);
  return response.data;
};

export const getQuizResult = async (quizId: string): Promise<QuizResult> => {
  const response = await api.get<QuizResult>(`/assessment/quizzes/${quizId}/result`);
  return response.data;
};

export const getLearnerProgress = async (learnerId: string): Promise<LearnerProgressProfile> => {
  const response = await api.get<LearnerProgressProfile>(`/learners/${learnerId}/progress`);
  return response.data;
};

export const getLearnerTopicProgress = async (
  learnerId: string,
  topic: string
): Promise<LearnerTopicProgress> => {
  const encodedTopic = encodeURIComponent(topic);
  const response = await api.get<LearnerTopicProgress>(`/learners/${learnerId}/progress/${encodedTopic}`);
  return response.data;
};

export const getLearnerRecommendation = async (
  learnerId: string
): Promise<PersonalizedRecommendation> => {
  const response = await api.get<PersonalizedRecommendation>(`/learners/${learnerId}/recommendation`);
  return response.data;
};

export const startPersonalizedPractice = async (
  learnerId: string,
  count: number = 3
): Promise<QuizResponse> => {
  const response = await api.post<QuizResponse>(`/learners/${learnerId}/recommendation/practice`, { count });
  return response.data;
};

// ─── Phase 3F — Learning Assistant ───────────────────────────────────────────

export const askLearningAssistant = async (
  request: LearningAssistantRequest
): Promise<LearningAssistantResponse> => {
  const response = await api.post<LearningAssistantResponse>('/learning-assistant/ask', request);
  return response.data;
};

// ─── Phase 3G — Trainer Question Bank & Review ───────────────────────────────

export const saveToQuestionBank = async (
  request: QuestionBankSaveRequest
): Promise<QuestionBankItem> => {
  const response = await api.post<QuestionBankItem>('/assessment/question-bank', request);
  return response.data;
};

export const listQuestionBank = async (params?: {
  document_id?: string;
  topic?: string;
  difficulty?: string;
  status?: string;
  search?: string;
}): Promise<QuestionBankListResponse> => {
  const response = await api.get<QuestionBankListResponse>('/assessment/question-bank', {
    params,
  });
  return response.data;
};

export const getQuestionBankItem = async (
  questionId: string
): Promise<QuestionBankItem> => {
  const response = await api.get<QuestionBankItem>(`/assessment/question-bank/${questionId}`);
  return response.data;
};

export const updateQuestionBankItem = async (
  questionId: string,
  request: QuestionBankUpdateRequest
): Promise<QuestionBankItem> => {
  const response = await api.patch<QuestionBankItem>(
    `/assessment/question-bank/${questionId}`,
    request
  );
  return response.data;
};

export const approveQuestionBankItem = async (
  questionId: string
): Promise<QuestionBankItem> => {
  const response = await api.post<QuestionBankItem>(
    `/assessment/question-bank/${questionId}/approve`
  );
  return response.data;
};

export const rejectQuestionBankItem = async (
  questionId: string
): Promise<QuestionBankItem> => {
  const response = await api.post<QuestionBankItem>(
    `/assessment/question-bank/${questionId}/reject`
  );
  return response.data;
};

export const createQuizFromQuestionBank = async (
  request: QuizFromBankRequest
): Promise<QuizResponse> => {
  const response = await api.post<QuizResponse>('/assessment/quizzes/from-bank', request);
  return response.data;
};






