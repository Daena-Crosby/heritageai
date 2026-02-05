
export enum View {
  Home = 'home',
  Translate = 'translate',
  Library = 'library',
  Contribute = 'contribute',
  Guide = 'guide'
}

export enum StoryType {
  Text = 'text',
  Video = 'video',
  Image = 'image',
  Document = 'document'
}

export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  data: string; // Base64
  size: number;
}

export interface StorySegment {
  original: string;
  translated: string;
  illustrationBase64?: string;
  audioBase64?: string;
}

export interface Story {
  id: string;
  title: string;
  author: string;
  location: string;
  culture: string;
  ageGroup: string;
  dialectName: string;
  originalText: string;
  translatedText: string;
  segments: StorySegment[];
  slangExplanations: { term: string; explanation: string }[];
  culturalContext: string;
  timestamp: number;
  tags: string[];
  audioBase64?: string; // Original voice recording
  coverImageBase64?: string;
  attachments?: Attachment[];
  sourceType: StoryType;
  mediaData?: string; // Base64 for primary uploaded video/image
  mediaMimeType?: string;
  generatedVideoBase64?: string; // The Veo cinematic generated video
}

export interface TranslationResult {
  translated: string;
  literal: string;
  slangExplanations: { term: string; explanation: string }[];
  culturalContext: string;
  segments?: { original: string; translated: string }[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}
