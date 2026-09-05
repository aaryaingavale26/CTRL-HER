import axios from 'axios';

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface IGOTCourse {
  id: string;
  title: string;
  description: string;
  competencies: string[];
  difficulty: string;
  duration_hours: number;
  target_roles: string[];
  provider: string;
  category: string;
  url: string;
}

export interface IGOTProgress {
  user_id: string;
  course_id: string;
  progress: number;
  status: string;
}

export interface CourseRecommendation {
  course_id: string;
  title: string;
  description: string;
  competencies: string[];
  difficulty: string;
  duration_hours: number;
  target_roles: string[];
  match_percentage: number;
  matched_competencies: string[];
  missing_competencies: string[];
  reason: string;
  url: string;
}

export interface IGOTCoursesResponse {
  source: string;
  total: number;
  courses: IGOTCourse[];
}

export interface IGOTProgressResponse {
  source: string;
  user_id: string;
  progress: IGOTProgress[];
}

export interface IGOTRecommendationResponse {
  learner_id: string;
  skill_gaps: string[];
  recommendations: CourseRecommendation[];
}

// Get all iGOT courses
export const getIGOTCourses = async (): Promise<IGOTCoursesResponse> => {
  const response = await api.get<IGOTCoursesResponse>('/igot/courses');
  return response.data;
};

// Get details of one course
export const getIGOTCourse = async (
  courseId: string
): Promise<{ source: string; course: IGOTCourse }> => {
  const response = await api.get<{ source: string; course: IGOTCourse }>(
    `/igot/courses/${courseId}`
  );

  return response.data;
};

// Get learner's iGOT progress
export const getIGOTProgress = async (
  userId: string
): Promise<IGOTProgressResponse> => {
  const response = await api.get<IGOTProgressResponse>(
    `/igot/users/${userId}/progress`
  );

  return response.data;
};

// Get personalized course recommendations
export const getIGOTRecommendations = async (
  learnerId: string,
  skillGaps: string[],
  role?: string,
  limit: number = 5
): Promise<IGOTRecommendationResponse> => {
  const response = await api.get<IGOTRecommendationResponse>(
    '/igot/recommendations',
    {
      params: {
        learner_id: learnerId,
        skill_gaps: skillGaps.join(','),
        role,
        limit,
      },
    }
  );

  return response.data;
};