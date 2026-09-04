import axios from 'axios';
import type {
  CompetenciesGroupedResponse,
  OfficialProfileCreatePayload,
  ProfileCreateResponse,
  OfficialProfileDetails,
  SkillGapAnalysisResponse,
  RadarResponse,
  CompetencyDigitalTwinResponse,
} from '../types/competency';

// Base URL: Default to port 8000 where FastAPI backend is running
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 25000,
});

export const api = {
  /**
   * Fetch all 33 master competencies grouped by category
   */
  async getCompetencies(): Promise<CompetenciesGroupedResponse> {
    const response = await apiClient.get<CompetenciesGroupedResponse>('/competencies');
    return response.data;
  },

  /**
   * Create official profile & trigger AI baseline evaluation
   */
  async createProfile(payload: OfficialProfileCreatePayload): Promise<ProfileCreateResponse> {
    const response = await apiClient.post<ProfileCreateResponse>('/profile/create', payload);
    return response.data;
  },

  /**
   * Retrieve official profile and 33 evaluated scores
   */
  async getProfile(officialId: string): Promise<OfficialProfileDetails> {
    const response = await apiClient.get<OfficialProfileDetails>(`/profile/${officialId}`);
    return response.data;
  },

  /**
   * Calculate role benchmark skill gaps with priority categorization & AI rationales
   */
  async getSkillGaps(officialId: string): Promise<SkillGapAnalysisResponse> {
    const response = await apiClient.get<SkillGapAnalysisResponse>(`/competency/gaps/${officialId}`);
    return response.data;
  },

  /**
   * Retrieve Recharts-ready Radar chart data points (competency and category levels)
   */
  async getRadarData(officialId: string): Promise<RadarResponse> {
    const response = await apiClient.get<RadarResponse>(`/competency/radar/${officialId}`);
    return response.data;
  },

  /**
   * Retrieve Competency Digital Twin status, progress bars, and timeline milestones
   */
  async getDigitalTwin(officialId: string): Promise<CompetencyDigitalTwinResponse> {
    const response = await apiClient.get<CompetencyDigitalTwinResponse>(`/competency/digital-twin/${officialId}`);
    return response.data;
  },
};

export default api;
