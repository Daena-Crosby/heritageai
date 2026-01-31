import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Story {
  id: string;
  title: string;
  storyteller_id?: string;
  age_group?: string;
  country?: string;
  language?: string;
  theme?: string;
  length_seconds?: number;
  created_at?: string;
  storytellers?: any;
  translations?: Translation[];
  media?: Media[];
  illustrations?: Illustration[];
  story_tags?: Array<{ tags: Tag }>;
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

// API functions
export const getStories = async (filters?: {
  language?: string;
  country?: string;
  theme?: string;
  age_group?: string;
}) => {
  const params = new URLSearchParams();
  if (filters?.language) params.append('language', filters.language);
  if (filters?.country) params.append('country', filters.country);
  if (filters?.theme) params.append('theme', filters.theme);
  if (filters?.age_group) params.append('age_group', filters.age_group);

  const response = await api.get<Story[]>('/stories', { params });
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
  
  // @ts-ignore
  formData.append('audio', {
    uri: audioUri,
    type: 'audio/mpeg',
    name: 'recording.mp3',
  });

  Object.entries(metadata).forEach(([key, value]) => {
    if (value) {
      formData.append(key, value);
    }
  });

  const response = await api.post('/upload/audio', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 120000, // 2 minutes for processing
  });

  return response.data;
};
