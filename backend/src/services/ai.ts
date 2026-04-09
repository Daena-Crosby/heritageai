import { HfInference } from '@huggingface/inference';
import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';
import { handleExternalApiError } from '../middleware/errorHandler';

dotenv.config();

const hfToken = process.env.HUGGINGFACE_API_TOKEN;
const hf = hfToken ? new HfInference(hfToken) : null;

// Whisper transcription using Groq API
export const transcribeAudio = async (audioBuffer: Buffer): Promise<string> => {
  const groqKey = process.env.GROQ_API_KEY;

  if (!groqKey) {
    throw new Error('Audio transcription requires GROQ_API_KEY to be configured in backend/.env');
  }

  try {
    console.log('[TRANSCRIPTION] Starting Groq Whisper transcription, buffer size:', audioBuffer.length);

    // Create form data with audio file
    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename: 'audio.m4a',
      contentType: 'audio/m4a',
    });
    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'en'); // Jamaican Patois uses English base
    formData.append('response_format', 'json');

    const response = await axios.post(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          ...formData.getHeaders(),
        },
        timeout: 60000, // 60 second timeout
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );

    const transcription = response.data?.text?.trim();

    if (!transcription || transcription.length === 0) {
      throw new Error('Groq Whisper returned empty transcription');
    }

    console.log('[TRANSCRIPTION] Success, transcribed length:', transcription.length);
    return transcription;

  } catch (error: any) {
    console.error('[TRANSCRIPTION] Error details:', error?.response?.data || error?.message || error);

    if (error.code === 'ECONNABORTED') {
      throw new Error('Audio transcription timed out. Please try a shorter audio file (under 60 seconds).');
    }

    if (error.response?.status === 413) {
      throw new Error('Audio file is too large. Please upload files under 25MB.');
    }

    if (error.response?.status === 429) {
      throw new Error('Transcription rate limit exceeded. Please try again in a few minutes.');
    }

    const errorMsg = error.response?.data?.error?.message || error.message || 'Unknown error';
    throw new Error(`Audio transcription failed: ${errorMsg}`);
  }
};

// Translation using Hugging Face M2M100
export const translateText = async (text: string, sourceLang: string = 'pcm', targetLang: string = 'en'): Promise<string> => {
  if (!hf) {
    console.warn('Hugging Face token not configured, returning original text');
    return text;
  }
  try {
    // Using M2M100 for translation
    // Note: M2M100 might not support all language codes directly
    // We'll use a more general approach
    const response = await hf.translation({
      model: 'facebook/m2m100_418M',
      inputs: text,
    });
    
    const result = response as unknown as { translation_text?: string };
    return result.translation_text || text;
  } catch (error) {
    console.error('Translation error:', error);
    // Fallback: return original text if translation fails
    return text;
  }
};

// Generate illustrations using Hugging Face Stable Diffusion
export const generateIllustration = async (
  prompt: string,
  storyId: string,
  pageNumber: number
): Promise<Buffer> => {
  if (!hf) {
    console.warn('Hugging Face token not configured, returning placeholder image');
    // Return a placeholder image buffer (1x1 transparent PNG)
    return Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
  }
  try {
    // Enhance prompt for cartoon style
    const enhancedPrompt = `cartoon illustration, children's book style, colorful, ${prompt}`;
    
    const response = await hf.textToImage({
      model: 'stabilityai/stable-diffusion-2-1',
      inputs: enhancedPrompt,
      parameters: {
        negative_prompt: 'realistic, photo, dark, scary',
        num_inference_steps: 30,
      },
    });

    // Convert response to buffer
    if (response instanceof Blob) {
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } else if (typeof response === 'string') {
      // If it's a URL, fetch it
      const imageResponse = await axios.get(response, { responseType: 'arraybuffer' });
      return Buffer.from(imageResponse.data);
    } else {
      throw new Error('Unexpected response format from image generation');
    }
  } catch (error) {
    console.error('Illustration generation error:', error);
    // Return a placeholder image buffer (1x1 transparent PNG)
    const placeholderPNG = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    return placeholderPNG;
  }
};

// Generate subtitles with timestamps
export const generateSubtitles = async (
  audioBuffer: Buffer,
  translatedText: string
): Promise<Array<{ start: number; end: number; text: string }>> => {
  if (!hf) {
    console.warn('Hugging Face token not configured, returning simple subtitles');
    // Return simple subtitles without timestamps
    return [{
      start: 0,
      end: 60,
      text: translatedText,
    }];
  }
  try {
    // Use Whisper with word-level timestamps
    const response = await hf.automaticSpeechRecognition({
      model: 'openai/whisper-base',
      data: audioBuffer as unknown as Blob,
    });

    // Process timestamps and match with translated text
    // This is a simplified version - you may need to adjust based on actual API response
    const words = translatedText.split(' ');
    const subtitles: Array<{ start: number; end: number; text: string }> = [];
    
    // Group words into subtitle chunks (rough estimate)
    const wordsPerSubtitle = 8;
    for (let i = 0; i < words.length; i += wordsPerSubtitle) {
      const chunk = words.slice(i, i + wordsPerSubtitle).join(' ');
      subtitles.push({
        start: i * 0.5, // Rough estimate: 0.5 seconds per word
        end: (i + wordsPerSubtitle) * 0.5,
        text: chunk,
      });
    }

    return subtitles;
  } catch (error) {
    console.error('Subtitle generation error:', error);
    // Return simple subtitles without timestamps
    return [{
      start: 0,
      end: 60,
      text: translatedText,
    }];
  }
};

// Dialect-to-English translation using Groq (Llama 3)
export const translateDialectText = async (
  text: string,
  sourceDialect: string
): Promise<{ translation: string }> => {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return { translation: '[Translation requires GROQ_API_KEY to be set in backend/.env]' };
  }

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `You are a dialect translation assistant specialising in Caribbean and West African creole languages. Translate the user's ${sourceDialect} text into clear, natural standard English. Output only the English translation — no explanations, no labels, no extra text.`,
          },
          { role: 'user', content: text },
        ],
        max_tokens: 400,
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const translation = response.data?.choices?.[0]?.message?.content?.trim() ?? text;
    return { translation };
  } catch (error: any) {
    console.error('[TRANSLATION] Error:', error?.response?.data || error?.message);
    return handleExternalApiError(error, 'Translation service');
  }
};

// Cultural Guide — conversational AI using HuggingFace Router chat completions
const GUIDE_SYSTEM_PROMPT = `You are Heritage AI Guide — a conversational expert in Caribbean cultural anthropology, \
Jamaican heritage, and African diaspora oral traditions. You have deep knowledge of:
- Jamaican Patois (Patwa) etymology and its West African linguistic roots (Twi, Akan, Yoruba, Ashanti)
- Caribbean folklore: Anansi the spider trickster, duppy spirits, and oral storytelling traditions
- How enslaved Africans preserved language and culture across the Caribbean and Americas
- Trinidadian Creole, Haitian Kreyòl, Nigerian Pidgin, and Louisiana Creole cultures
- The historical connections between West Africa, Jamaica, and the wider African diaspora

Guidelines:
- Be knowledgeable, warm, and respectful of cultural heritage
- Keep responses concise — 2 to 3 paragraphs maximum
- If you are unsure of a fact, say so rather than inventing one
- Speak naturally and conversationally, not like a textbook`;

export interface GuideMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const getCulturalGuideResponse = async (
  messages: GuideMessage[]
): Promise<string> => {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    throw new Error('GROQ_API_KEY is not configured in backend/.env');
  }

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: GUIDE_SYSTEM_PROMPT },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
        max_tokens: 512,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const reply: string = response.data?.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error('Empty response from model');
    return reply;
  } catch (error: any) {
    console.error('[CULTURAL_GUIDE] Error:', error?.response?.data || error?.message);
    return handleExternalApiError(error, 'Cultural Guide service');
  }
};

// Suggest themes using zero-shot classification
export const suggestThemes = async (text: string): Promise<string[]> => {
  if (!hf) {
    console.warn('Hugging Face token not configured, returning empty themes');
    return [];
  }
  try {
    const themes = ['folklore', 'moral', 'anansi', 'history', 'tradition', 'legend', 'fable'];

    const response = await hf.zeroShotClassification({
      model: 'facebook/bart-large-mnli',
      inputs: text,
      parameters: {
        candidate_labels: themes,
      },
    });

    // Return top 3 themes
    const items = Array.isArray(response) ? response : [response];
    return (items as Array<{ scores: number[]; labels: string[]; sequence: string }>)
      .flatMap(item =>
        item.labels.map((label, i) => ({ label, score: item.scores[i] }))
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.label);
  } catch (error) {
    console.error('Theme suggestion error:', error);
    return [];
  }
};

// Generate AI synopsis using Groq
export const generateSynopsis = async (text: string): Promise<string> => {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    // Fallback to simple truncation if Groq not available
    return text.length > 220 ? text.slice(0, 220).trimEnd() + '…' : text;
  }

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are a skilled summarizer. Create a compelling 2-3 sentence synopsis that captures the essence and key themes of the story. Make it engaging and concise.',
          },
          {
            role: 'user',
            content: `Summarize this story in 2-3 sentences:\n\n${text.substring(0, 2000)}`,
          },
        ],
        max_tokens: 150,
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const synopsis = response.data?.choices?.[0]?.message?.content?.trim();
    if (!synopsis) {
      // Fallback to truncation
      return text.length > 220 ? text.slice(0, 220).trimEnd() + '…' : text;
    }
    return synopsis;
  } catch (error: any) {
    console.error('[SYNOPSIS] Generation error:', error?.response?.data || error.message);
    // Fallback to simple truncation
    return text.length > 220 ? text.slice(0, 220).trimEnd() + '…' : text;
  }
};
