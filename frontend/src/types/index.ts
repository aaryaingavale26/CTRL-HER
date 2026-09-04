export interface ExtractedBlock {
  document_id: string;
  source: string;
  location?: string;
  text: string;
}

export interface DocumentChunk {
  chunk_id: string;
  document_id: string;
  chunk_index: number;
  text: string;
  source: string;
  location?: string;
  locations: string[];
  word_count: number;
}

export interface DocumentItem {
  document_id: string;
  filename: string;
  file_type: string;
  file_size_bytes: number;
  file_size_formatted: string;
  uploaded_at: string;
  status: 'INDEXED' | 'INDEXING' | 'EMBEDDED' | 'EMBEDDING' | 'CHUNKED' | 'TEXT_EXTRACTED' | 'FAILED' | 'processing' | 'uploaded';
  pages: number;
  text_blocks: number;
  chunks: number;
  embeddings: number;
  description?: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data: DocumentItem;
}

export interface DocumentListResponse {
  total: number;
  documents: DocumentItem[];
}

export interface DocumentPreviewResponse {
  document_id: string;
  filename: string;
  file_type: string;
  pages: number;
  text_blocks: number;
  content: ExtractedBlock[];
}

export interface DocumentChunksResponse {
  document_id: string;
  filename: string;
  chunk_count: number;
  chunks: DocumentChunk[];
}

export interface DocumentStatusResponse {
  document_id: string;
  status: string;
  progress: number;
  pages: number;
  text_blocks: number;
  chunks: number;
  embeddings: number;
  embedding_dimension: number;
}

export interface EmbedResponse {
  document_id: string;
  status: string;
  chunks_embedded: number;
  embedding_dimension: number;
  embedding_model: string;
  skipped: boolean;
}

export interface HealthResponse {
  status: string;
  project: string;
  version: string;
  timestamp: string;
  llm_provider: string;
}

export interface AITestResponse {
  status: string;
  provider: string;
  is_mock: boolean;
  response_text: string;
  timestamp: string;
}

export interface IndexResponse {
  document_id: string;
  status: string;
  chunks_indexed: number;
  total_vectors: number;
  embedding_dimension: number;
  skipped: boolean;
}

export interface SearchResultItem {
  chunk_id: string;
  document_id: string;
  score: number;
  text: string;
  source: string;
  location?: string;
  locations: string[];
  chunk_index: number;
}

export interface SearchRequest {
  query: string;
  top_k?: number;
  document_id?: string;
}

export interface SearchResponse {
  query: string;
  top_k: number;
  total_results: number;
  results: SearchResultItem[];
}

export interface MCQOption {
  id: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface MCQSource {
  document_id: string;
  document: string;
  chunk_ids: string[];
  locations: string[];
}

export interface MCQItem {
  question_id: string;
  question: string;
  options: MCQOption[];
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  source: MCQSource;
}

export interface MCQGenerationRequest {
  document_id: string;
  topic?: string;
  count?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface MCQGenerationResponse {
  status: 'GENERATED' | 'INSUFFICIENT_CONTENT' | 'FAILED';
  document_id: string;
  count: number;
  questions: MCQItem[];
  message?: string;
}

export interface QuizCreateRequest {
  document_id: string;
  topic?: string;
  count?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  learner_id?: string;
}

export interface LearnerQuestion {
  question_id: string;
  question: string;
  options: MCQOption[];
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  source: MCQSource;
}

export interface QuizResponse {
  quiz_id: string;
  learner_id: string;
  document_id: string;
  topic?: string;
  difficulty: string;
  created_at: string;
  status: 'IN_PROGRESS' | 'SUBMITTED';
  total_questions: number;
  questions: LearnerQuestion[];
}

export interface SingleAnswerSubmission {
  question_id: string;
  selected_answer?: 'A' | 'B' | 'C' | 'D' | null;
}

export interface QuizSubmissionRequest {
  answers: SingleAnswerSubmission[];
}

export interface QuestionEvaluationResult {
  question_id: string;
  question: string;
  options: MCQOption[];
  selected_answer?: string | null;
  correct_answer: string;
  is_correct: boolean;
  explanation: string;
  difficulty: string;
  topic: string;
  source: MCQSource;
}

export interface TopicPerformance {
  topic: string;
  questions: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  accuracy: number;
}

export interface QuizResult {
  quiz_id: string;
  learner_id: string;
  document_id: string;
  total_questions: number;
  answered_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  unanswered_questions: number;
  score: number;
  percentage: number;
  question_results: QuestionEvaluationResult[];
  topic_performance: TopicPerformance[];
  strongest_topic?: string | null;
  weakest_topic?: string | null;
  overall_feedback: string;
  submitted_at: string;
}

export interface TopicAttemptHistory {
  quiz_id: string;
  accuracy: number;
  questions: number;
  correct: number;
  incorrect: number;
  timestamp: string;
}

export interface LearnerTopicProgress {
  topic: string;
  attempts: number;
  questions_attempted: number;
  correct_answers: number;
  incorrect_answers: number;
  accuracy: number;
  recent_accuracy: number;
  status: 'NEEDS_REVIEW' | 'LEARNING' | 'IMPROVING' | 'MASTERED';
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING' | 'INSUFFICIENT_DATA';
  first_seen_at: string;
  last_practiced_at: string;
  history: TopicAttemptHistory[];
}

export interface LearnerProgressProfile {
  learner_id: string;
  topics: Record<string, LearnerTopicProgress>;
  total_tracked_topics: number;
  mastered_topics: number;
  topics_needing_review: number;
  improving_topics: number;
  overall_accuracy: number;
}

export interface PersonalizedRecommendation {
  status: 'RECOMMENDED' | 'NO_PROGRESS' | 'ALL_MASTERED';
  learner_id: string;
  recommended_topic?: string | null;
  action?: 'REVIEW' | 'PRACTICE' | 'REASSESS' | 'ADVANCE' | null;
  priority_score?: number | null;
  topic_status?: string | null;
  accuracy?: number | null;
  recent_accuracy?: number | null;
  trend?: string | null;
  reason: string;
  next_step: string;
  document_id?: string | null;
}

// ─── Phase 3F — Learning Assistant ───────────────────────────────────────────

export interface LearningAssistantRequest {
  question: string;
  document_id?: string;
  top_k?: number;
}

export interface LearningAssistantSource {
  document_id: string;
  document: string;
  chunk_id: string;
  location?: string | null;
}

export interface LearningAssistantResponse {
  status: 'ANSWERED' | 'INSUFFICIENT_CONTEXT' | 'NO_INDEX';
  question: string;
  answer: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  sources: LearningAssistantSource[];
}

// ─── Phase 3G — Trainer Question Bank & Review ───────────────────────────────

export type QuestionBankStatus = 'DRAFT' | 'APPROVED' | 'REJECTED';
export type QuestionBankOrigin = 'GENERATED' | 'MANUAL';

export interface QuestionBankItem {
  question_id: string;
  question: string;
  options: MCQOption[];
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  source: MCQSource;
  status: QuestionBankStatus;
  origin: QuestionBankOrigin;
  created_at: string;
  updated_at: string;
  reviewed_at?: string | null;
}

export interface QuestionBankSaveRequest {
  question: string;
  options: MCQOption[];
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  source: MCQSource;
  origin?: QuestionBankOrigin;
}

export interface QuestionBankUpdateRequest {
  question?: string;
  options?: MCQOption[];
  correct_answer?: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  topic?: string;
}

export interface QuestionBankListResponse {
  total: number;
  items: QuestionBankItem[];
}

export interface QuizFromBankRequest {
  learner_id?: string;
  count?: number;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}
