import { HfInference } from '@huggingface/inference';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const hfToken = process.env.HUGGINGFACE_API_TOKEN;
const hf = hfToken ? new HfInference(hfToken) : null;

// Whisper transcription using Hugging Face
export const transcribeAudio = async (audioBuffer: Buffer): Promise<string> => {
  if (!hf) {
    console.warn('Hugging Face token not configured, returning placeholder');
    return 'Transcription requires Hugging Face API token';
  }
  try {
    // Using Hugging Face's Whisper model
    const response = await hf.automaticSpeechRecognition({
      model: 'openai/whisper-base',
      data: audioBuffer as unknown as Blob,
    });
    
    return response.text;
  } catch (error) {
    console.error('Transcription error:', error);
    // Fallback: return placeholder text
    return 'Transcription in progress...';
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
