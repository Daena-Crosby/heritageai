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

export interface Story {
  id: string;
  title: string;
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

export const getStories = async (filters?: {
  language?: string;
  country?: string;
  theme?: string;
  age_group?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get<Story[]>('/stories', { params: filters });
  return response.data;
};

export const getStory = async (id: string) => {
  const response = await api.get<Story>(`/stories/${id}`);
  return response.data;
};

export const searchStories = async (query: string) => {
  const response = await api.get<Story[]>('/search', { params: { q: query } });
  return response.data;
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
// Processing Status
// ============================

export const getProcessingStatus = async (storyId: string): Promise<ProcessingJob> => {
  const response = await api.get<ProcessingJob>(`/processing/${storyId}`);
  return response.data;
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
