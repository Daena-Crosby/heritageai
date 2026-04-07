import { supabaseAdmin as supabase } from '../config/supabase';

export interface Storyteller {
  id?: string;
  name: string;
  location?: string;
  dialect?: string;
  created_at?: string;
}

export interface Story {
  id?: string;
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
  updated_at?: string;
}

export interface Media {
  id?: string;
  story_id: string;
  type: 'audio' | 'video';
  file_url: string;
  created_at?: string;
}

export interface Translation {
  id?: string;
  story_id: string;
  original_text?: string;
  translated_text: string;
  synopsis?: string;
  subtitles?: Array<{ start: number; end: number; text: string }>;
  created_at?: string;
}

export interface Illustration {
  id?: string;
  story_id: string;
  image_url: string;
  page_number?: number;
  created_at?: string;
}

export interface Tag {
  id?: string;
  name: string;
}

// Storyteller operations
export const createStoryteller = async (storyteller: Storyteller) => {
  const { data, error } = await supabase
    .from('storytellers')
    .insert([storyteller])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getStoryteller = async (id: string) => {
  const { data, error } = await supabase
    .from('storytellers')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

// Story operations
export const createStory = async (story: Story) => {
  const { data, error } = await supabase
    .from('stories')
    .insert([story])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getStory = async (id: string) => {
  const { data, error } = await supabase
    .from('stories')
    .select(`
      *,
      storytellers (*),
      translations (*),
      media (*),
      illustrations (*),
      story_tags (
        tags (*)
      )
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

export const getAllStories = async (filters?: {
  language?: string;
  country?: string;
  storyteller_id?: string;
  theme?: string;
  age_group?: string;
}) => {
  let query = supabase
    .from('stories')
    .select(`
      *,
      storytellers (*),
      translations (*),
      media (*),
      illustrations (*),
      story_tags (
        tags (*)
      )
    `)
    .order('created_at', { ascending: false });

  if (filters) {
    if (filters.language) query = query.ilike('language', filters.language);
    if (filters.country) query = query.ilike('country', filters.country);
    if (filters.storyteller_id) query = query.eq('storyteller_id', filters.storyteller_id);
    if (filters.theme) query = query.ilike('theme', `%${filters.theme}%`);
    if (filters.age_group) query = query.ilike('age_group', filters.age_group);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const updateStory = async (id: string, updates: Partial<Story>) => {
  const { data, error } = await supabase
    .from('stories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Media operations
export const createMedia = async (media: Media) => {
  const { data, error } = await supabase
    .from('media')
    .insert([media])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Translation operations
export const createTranslation = async (translation: Translation) => {
  const { data, error } = await supabase
    .from('translations')
    .insert([translation])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateTranslation = async (id: string, updates: Partial<Translation>) => {
  const { data, error } = await supabase
    .from('translations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Illustration operations
export const createIllustration = async (illustration: Illustration) => {
  const { data, error } = await supabase
    .from('illustrations')
    .insert([illustration])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getIllustrationsByStory = async (storyId: string) => {
  const { data, error } = await supabase
    .from('illustrations')
    .select('*')
    .eq('story_id', storyId)
    .order('page_number', { ascending: true });
  
  if (error) throw error;
  return data;
};

// Tag operations
export const createTag = async (tag: Tag) => {
  const { data, error } = await supabase
    .from('tags')
    .insert([{ ...tag, name: tag.name.toLowerCase().trim() }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getTagByName = async (name: string) => {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .ilike('name', name.toLowerCase().trim())
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

export const linkStoryToTag = async (storyId: string, tagId: string) => {
  const { data, error } = await supabase
    .from('story_tags')
    .insert([{ story_id: storyId, tag_id: tagId }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Search operations
export const searchStories = async (query: string) => {
  const { data, error } = await supabase
    .from('stories')
    .select(`
      *,
      storytellers (*),
      translations (*),
      media (*),
      illustrations (*),
      story_tags (
        tags (*)
      )
    `)
    .or(`title.ilike.%${query}%,theme.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Processing job operations
export interface ProcessingJob {
  id: string;
  story_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  current_step: 'transcription' | 'translation' | 'subtitles' | 'themes' | 'illustrations' | 'video' | null;
  progress_pct: number;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export const createProcessingJob = async (storyId: string): Promise<ProcessingJob> => {
  const { data, error } = await supabase
    .from('processing_jobs')
    .insert({
      story_id: storyId,
      status: 'pending',
      current_step: null,
      progress_pct: 0,
      error_message: null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create processing job: ${error.message}`);
  return data;
};

export const updateProcessingJob = async (
  jobId: string,
  updates: Partial<Pick<ProcessingJob, 'status' | 'current_step' | 'progress_pct' | 'error_message' | 'completed_at'>>
): Promise<void> => {
  const { error } = await supabase
    .from('processing_jobs')
    .update(updates)
    .eq('id', jobId);

  if (error) throw new Error(`Failed to update processing job: ${error.message}`);
};

export const getProcessingJobByStory = async (storyId: string): Promise<ProcessingJob | null> => {
  const { data, error } = await supabase
    .from('processing_jobs')
    .select('*')
    .eq('story_id', storyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get processing job: ${error.message}`);
  }
  return data;
};
