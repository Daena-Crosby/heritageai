import { supabaseAdmin as supabase } from '../config/supabase';

export const uploadAudioFile = async (
  file: Buffer,
  fileName: string,
  storyId: string
): Promise<string> => {
  const filePath = `audio/${storyId}/${fileName}`;
  
  const { data, error } = await supabase.storage
    .from('media')
    .upload(filePath, file, {
      contentType: 'audio/mpeg',
      upsert: false
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('media')
    .getPublicUrl(filePath);

  return publicUrl;
};

export const uploadVideoFile = async (
  file: Buffer,
  fileName: string,
  storyId: string
): Promise<string> => {
  const filePath = `video/${storyId}/${fileName}`;
  
  const { data, error } = await supabase.storage
    .from('media')
    .upload(filePath, file, {
      contentType: 'video/mp4',
      upsert: false
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('media')
    .getPublicUrl(filePath);

  return publicUrl;
};

export const uploadImageFile = async (
  file: Buffer,
  fileName: string,
  storyId: string
): Promise<string> => {
  const filePath = `illustrations/${storyId}/${fileName}`;
  
  const { data, error } = await supabase.storage
    .from('media')
    .upload(filePath, file, {
      contentType: 'image/png',
      upsert: false
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('media')
    .getPublicUrl(filePath);

  return publicUrl;
};
