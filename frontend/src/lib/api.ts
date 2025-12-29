/**
 * API Client for Validator Backend
 * Communicates with FastAPI backend for all features
 */
import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Response types
export interface DashboardData {
  funding_probability: number;
  matching_investors: number;
  applicable_schemes: number;
  active_opportunities: number;
  recommended_actions: {
    title: string;
    priority: 'high' | 'medium' | 'low';
    impact: string;
  }[];
  user_profile: {
    name: string;
    email: string;
    startup_name: string;
    sector: string;
    stage: string;
    location: string;
    state: string;
    team_size: number;
    monthly_revenue: number;
    dpiit_registered: boolean;
  };
}

export interface ChatResponse {
  success: boolean;
  answer: string;
  sources: string[];
  context_used: boolean;
}

export interface RouteMapData {
  success: boolean;
  nodes: {
    id: string;
    type?: string;
    data: { label: string };
    position: { x: number; y: number };
    style?: Record<string, string>;
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    animated?: boolean;
    style?: Record<string, string>;
  }[];
  summary: string;
}

export interface PitchAnalysisResult {
  success: boolean;
  confidence_score: number;
  eye_contact_score?: number;
  head_position_score?: number;
  feedback: {
    type: 'positive' | 'neutral' | 'suggestion' | 'warning' | 'summary' | 'info';
    message: string;
  }[];
  simulated: boolean;
  error?: string;
}

export interface Opportunity {
  id: string;
  name: string;
  type: string;
  organizer: string;
  prize: string;
  deadline: string;
  eligibility: Record<string, unknown>;
  benefits: string[];
  link: string;
  source: string;
}

export interface UserProfile {
  name: string;
  email: string;
  startup_name: string;
  sector: string;
  stage: string;
  location: string;
  state: string;
  team_size: number;
  monthly_revenue: number;
  dpiit_registered: boolean;
}

export interface ApplicationResponse {
  success: boolean;
  message: string;
  application_id: string;
}

// API Functions
export async function getDashboard(): Promise<DashboardData> {
  const response = await api.get<{ success: boolean; data: DashboardData }>('/api/dashboard');
  return response.data.data;
}

export async function sendChatMessage(message: string): Promise<ChatResponse> {
  const response = await api.post<ChatResponse>('/api/chat', { message });
  return response.data;
}

export async function generateRouteMap(
  stage: string,
  sector: string,
  location: string
): Promise<RouteMapData> {
  const response = await api.post<RouteMapData>('/api/route-map', {
    stage,
    sector,
    location,
  });
  return response.data;
}

export async function analyzePitch(imageBase64: string): Promise<PitchAnalysisResult> {
  const response = await api.post<PitchAnalysisResult>('/api/analyze-pitch', {
    image: imageBase64,
  });
  return response.data;
}

export async function getOpportunities(
  sector?: string,
  type?: string
): Promise<Opportunity[]> {
  const params = new URLSearchParams();
  if (sector) params.append('sector', sector);
  if (type) params.append('opp_type', type);
  
  const response = await api.get<{ success: boolean; data: Opportunity[] }>(
    `/api/opportunities?${params.toString()}`
  );
  return response.data.data;
}

export async function getUserProfile(): Promise<UserProfile> {
  const response = await api.get<{ success: boolean; data: UserProfile }>('/api/user-profile');
  return response.data.data;
}

export async function submitApplication(
  opportunityId: string,
  applicantName: string,
  applicantEmail: string,
  startupName: string,
  pitch: string
): Promise<ApplicationResponse> {
  const response = await api.post<ApplicationResponse>('/api/apply', {
    opportunity_id: opportunityId,
    applicant_name: applicantName,
    applicant_email: applicantEmail,
    startup_name: startupName,
    pitch,
  });
  return response.data;
}

export async function checkHealth(): Promise<{ status: string; service: string }> {
  const response = await api.get<{ status: string; service: string }>('/api/health');
  return response.data;
}

// Error handler helper
export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response?.data?.detail) {
      return error.response.data.detail;
    }
    if (error.message) {
      return error.message;
    }
  }
  return 'An unexpected error occurred';
}

export default api;
