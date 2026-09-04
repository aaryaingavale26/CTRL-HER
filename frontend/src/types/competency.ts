// Competency Intelligence & Skill Gap Module (P1) - TypeScript Type Definitions

export type CompetencyCategory = 
  | 'Statistical'
  | 'Technical'
  | 'Digital Governance'
  | 'Behavioural & Managerial';

export interface CompetencyItem {
  id: number;
  category: string;
  name: string;
}

export interface CompetenciesGroupedResponse {
  total_competencies: number;
  categories: Record<string, CompetencyItem[]>;
}

export interface SelfAssessmentInput {
  competency_id: number;
  rating: number; // 1.0 - 5.0
  notes?: string;
}

export interface OfficialProfileCreatePayload {
  full_name: string;
  designation: string;
  department: string;
  job_role: string;
  current_assignment?: string;
  education?: string;
  experience_years: number;
  previous_training?: string[];
  career_objective?: string;
  self_assessments?: SelfAssessmentInput[];
}

export interface ProfileCreateResponse {
  official_id: string;
  full_name: string;
  job_role: string;
  scores_evaluated: number;
  message: string;
}

export interface CompetencyScoreItem {
  competency_id: number;
  competency_name: string;
  category: string;
  current_score: number;
  confidence_weight: number;
  last_updated: string;
}

export interface OfficialProfileDetails {
  id: string;
  full_name: string;
  designation: string;
  department: string;
  job_role: string;
  current_assignment?: string;
  education?: string;
  experience_years: number;
  previous_training?: string[];
  career_objective?: string;
  created_at: string;
  scores: CompetencyScoreItem[];
}

export type GapPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface CompetencyGapItem {
  competency_id: number;
  category: string;
  competency_name: string;
  current_score: number;
  required_score: number;
  gap: number;
  priority: GapPriority;
  is_critical: boolean;
}

export interface SkillGapAnalysisResponse {
  official_id: string;
  full_name: string;
  job_role: string;
  benchmark_source: string;
  total_competencies: number;
  high_priority_count: number;
  medium_priority_count: number;
  low_priority_count: number;
  average_gap: number;
  critical_gaps_rationale: string[];
  gaps: CompetencyGapItem[];
}

export interface RadarDataPoint {
  category: string;
  competency: string;
  current: number;
  required: number;
  gap: number;
}

export interface CategoryRadarPoint {
  category: string;
  current_avg: number;
  required_avg: number;
  gap_avg: number;
}

export interface RadarResponse {
  official_id: string;
  job_role: string;
  competency_radar: RadarDataPoint[];
  category_radar: CategoryRadarPoint[];
}

export interface CategoryProgress {
  category: string;
  current_average: number;
  required_average: number;
  readiness_pct: number;
  competencies_count: number;
}

export interface HistoryMilestone {
  id: number;
  competency_id: number;
  competency_name: string;
  category: string;
  score: number;
  source_type: string;
  reason?: string;
  recorded_at: string;
}

export interface CompetencyDigitalTwinResponse {
  official_id: string;
  full_name: string;
  designation: string;
  job_role: string;
  overall_readiness_pct: number;
  status_summary: string;
  category_breakdown: CategoryProgress[];
  timeline_milestones: HistoryMilestone[];
  recent_updates_count: number;
}
