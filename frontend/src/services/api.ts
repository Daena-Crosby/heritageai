import axios from 'axios';
import { getApiUrl } from '../utils/apiUrl';

export const api = axios.create({
  baseURL: `${getApiUrl()}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================
// Types
// ============================

export type ModerationStatus = 'pending' | 'approved' | 'rejected';

export interface Story {
  id: string;
  title: string;
  moderation_status?: ModerationStatus;
  moderation_note?: string;
  storyteller_id?: string;
  uploaded_by?: string;
  age_group?: 'children' | 'teens' | 'general';
  country?: string;
  language?: string;
  theme?: string;
  length_seconds?: number;
  is_published?: boolean;
  view_count?: number;
  created_at?: string;
  storytellers?: Storyteller;
  translations?: Translation[];
  media?: Media[];
  illustrations?: Illustration[];
  story_tags?: Array<{ tags: Tag }>;
}

export interface Storyteller {
  id: string;
  name: string;
  location?: string;
  dialect?: string;
}

export interface Translation {
  id: string;
  story_id: string;
  original_text?: string;
  translated_text: string;
  synopsis?: string;
  subtitles?: Array<{ start: number; end: number; text: string }>;
}

export interface Media {
  id: string;
  story_id: string;
  type: 'audio' | 'video';
  file_url: string;
}

export interface Illustration {
  id: string;
  story_id: string;
  image_url: string;
  page_number?: number;
}

export interface Tag {
  id: string;
  name: string;
}

export interface ProcessingJob {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  current_step: string | null;
  progress_pct: number;
  error_message?: string;
}

// ============================
// Stories
// ============================

export interface PaginatedResponse<T> {
  stories: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getStories = async (filters?: {
  language?: string;
  country?: string;
  theme?: string;
  age_group?: string;
  page?: number;
  limit?: number;
}): Promise<Story[]> => {
  const response = await api.get<PaginatedResponse<Story>>('/stories', { params: filters });
  // Handle both old array format and new paginated format for backwards compatibility
  if (Array.isArray(response.data)) {
    return response.data;
  }
  return response.data.stories ?? [];
};

export const getStory = async (id: string) => {
  const response = await api.get<Story>(`/stories/${id}`);
  return response.data;
};

export const searchStories = async (query: string): Promise<Story[]> => {
  const response = await api.get<PaginatedResponse<Story> | Story[]>('/search', { params: { q: query } });
  // Handle both old array format and new paginated format for backwards compatibility
  if (Array.isArray(response.data)) {
    return response.data;
  }
  return response.data.stories ?? [];
};

export const uploadStoryText = async (
  storyText: string,
  metadata: {
    title?: string;
    storytellerName?: string;
    storytellerLocation?: string;
    ageGroup?: string;
    country?: string;
    language?: string;
    theme?: string;
  }
) => {
  const response = await api.post('/upload/text', { storyText, ...metadata }, {
    timeout: 120000,
  });
  return response.data;
};

export const uploadStoryDocument = async (
  fileUri: string,
  fileName: string,
  mimeType: string,
  metadata: {
    title?: string;
    storytellerName?: string;
    storytellerLocation?: string;
    ageGroup?: string;
    country?: string;
    language?: string;
    theme?: string;
  }
) => {
  const formData = new FormData();
  // @ts-ignore
  formData.append('document', { uri: fileUri, type: mimeType, name: fileName });
  Object.entries(metadata).forEach(([key, value]) => {
    if (value) formData.append(key, value);
  });
  const response = await api.post('/upload/document', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
  return response.data;
};

export const uploadStory = async (
  audioUri: string,
  metadata: {
    title: string;
    storytellerName?: string;
    storytellerLocation?: string;
    storytellerDialect?: string;
    ageGroup?: string;
    country?: string;
    language?: string;
    theme?: string;
  }
) => {
  const formData = new FormData();

  // @ts-ignore — React Native FormData accepts { uri, type, name }
  formData.append('audio', {
    uri: audioUri,
    type: 'audio/mpeg',
    name: 'recording.mp3',
  });

  Object.entries(metadata).forEach(([key, value]) => {
    if (value) formData.append(key, value);
  });

  const response = await api.post('/upload/audio', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000, // 2 minutes for AI processing
  });

  return response.data;
};

// ============================
// Dialect Translation
// ============================

export const translateDialect = async (
  text: string,
  sourceDialect: string
): Promise<{ translation: string; sourceDialect: string }> => {
  const response = await api.post('/translate', { text, sourceDialect });
  return response.data;
};

// ============================
// Cultural Guide
// ============================

export const getCulturalGuide = async (
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<{ reply: string }> => {
  const response = await api.post('/guide', { messages }, { timeout: 50000 });
  return response.data;
};

// ============================
// User Profile
// ============================

export const getMyStories = async (): Promise<Story[]> => {
  const { data } = await api.get('/users/me/stories');
  return data.stories ?? [];
};

export const updateMyProfile = async (updates: { display_name?: string; bio?: string }) => {
  const { data } = await api.patch('/users/me', updates);
  return data;
};

// ============================
// Processing Status
// ============================

export const getProcessingStatus = async (storyId: string): Promise<ProcessingJob> => {
  const response = await api.get<ProcessingJob>(`/processing/${storyId}`);
  return response.data;
};

// ============================
// Moderation (mod + admin)
// ============================

export const getModerationQueue = async (): Promise<Story[]> => {
  const { data } = await api.get('/moderation/queue');
  return data;
};

export const approveStory = async (id: string) => {
  const { data } = await api.post(`/moderation/stories/${id}/approve`);
  return data;
};

export const rejectStory = async (id: string, note?: string) => {
  const { data } = await api.post(`/moderation/stories/${id}/reject`, { note });
  return data;
};

export const getFlaggedComments = async () => {
  const { data } = await api.get('/moderation/flagged-comments');
  return data;
};

export const deleteModerationComment = async (id: string) => {
  const { data } = await api.delete(`/moderation/comments/${id}`);
  return data;
};

export const dismissCommentFlag = async (id: string) => {
  const { data } = await api.post(`/moderation/comments/${id}/dismiss`);
  return data;
};

// ============================
// Admin
// ============================

export interface AdminUser {
  id: string;
  display_name?: string;
  bio?: string;
  role: 'user' | 'moderator' | 'admin';
  created_at?: string;
}

export interface AdminStats {
  totalUsers: number;
  totalStories: number;
  pendingStories: number;
  flaggedComments: number;
  activeProcessingJobs: number;
}

export const getAdminUsers = async (): Promise<AdminUser[]> => {
  const { data } = await api.get('/admin/users');
  return data;
};

export const updateUserRole = async (userId: string, role: 'user' | 'moderator' | 'admin') => {
  const { data } = await api.put(`/admin/users/${userId}/role`, { role });
  return data;
};

export const deleteAdminUser = async (userId: string) => {
  const { data } = await api.delete(`/admin/users/${userId}`);
  return data;
};

export const getAdminStats = async (): Promise<AdminStats> => {
  const { data } = await api.get('/admin/stats');
  return data;
};

export const getAuditLog = async (limit = 50) => {
  const { data } = await api.get('/admin/audit-log', { params: { limit } });
  return data;
};

// ============================
// Comments
// ============================

export const getComments = async (storyId: string, page = 1) => {
  const response = await api.get(`/comments/story/${storyId}`, { params: { page } });
  return response.data;
};

export const postComment = async (storyId: string, content: string) => {
  const response = await api.post(`/comments/story/${storyId}`, { content });
  return response.data;
};

// ============================
// Favorites
// ============================

export const addFavorite = async (storyId: string) => {
  const response = await api.post(`/users/me/favorites/${storyId}`);
  return response.data;
};

export const removeFavorite = async (storyId: string) => {
  const response = await api.delete(`/users/me/favorites/${storyId}`);
  return response.data;
};
