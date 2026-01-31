import { supabase } from '../config/supabase';

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
  age_group?: string;
  country?: string;
  language?: string;
  theme?: string;
  length_seconds?: number;
  created_at?: string;
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
    if (filters.language) query = query.eq('language', filters.language);
    if (filters.country) query = query.eq('country', filters.country);
    if (filters.storyteller_id) query = query.eq('storyteller_id', filters.storyteller_id);
    if (filters.theme) query = query.eq('theme', filters.theme);
    if (filters.age_group) query = query.eq('age_group', filters.age_group);
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
    .insert([tag])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getTagByName = async (name: string) => {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('name', name)
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
