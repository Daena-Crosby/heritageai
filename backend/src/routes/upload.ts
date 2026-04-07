/**
 * SECURITY: Upload Routes
 *
 * Implements secure file uploads with:
 * - Strict MIME type whitelisting
 * - File size limits (50MB audio, 10MB docs)
 * - Rate limiting (10 uploads/hour)
 * - Input validation on metadata
 * - Security event logging
 *
 * OWASP References:
 * - A04:2021 - Insecure Design (File Upload)
 * - A03:2021 - Injection (Input Validation)
 */

import express, { Request, Response } from 'express';
import multer from 'multer';
import mammoth from 'mammoth';
import {
  createStoryteller,
  createStory,
  createMedia,
  createTranslation,
  createIllustration,
  linkStoryToTag,
  getTagByName,
  createTag,
  createProcessingJob,
  updateProcessingJob,
  ProcessingJob,
} from '../services/database';
import { uploadAudioFile, uploadImageFile } from '../services/storage';
import {
  transcribeAudio,
  translateText,
  translateDialectText,
  generateIllustration,
  generateSubtitles,
  suggestThemes,
  generateSynopsis,
} from '../services/ai';
import { generateVideo } from '../services/video';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { uploadLimiter } from '../middleware/rateLimiter';
import { validate, storyUploadSchema } from '../middleware/validate';
import { logFileUpload } from '../middleware/securityLogger';
import { z } from 'zod';

const router = express.Router();

// Allowed audio MIME types — includes iOS variants (audio/x-m4a, audio/aac)
const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
  'audio/webm', 'audio/mp4', 'audio/m4a', 'audio/x-m4a',
  'audio/aac', 'audio/x-wav', 'audio/wave',
];

const ALLOWED_DOC_TYPES = [
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
];

const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_AUDIO_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: mp3, wav, ogg, webm, m4a`));
    }
  },
});

const docUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for documents
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_DOC_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: .txt, .doc, .docx`));
    }
  },
});

// ============================
// Shared: process text through AI pipeline (no audio)
// ============================
async function processTextPipeline(
  storyId: string,
  originalText: string,
  language: string
) {
  let job: ProcessingJob | undefined;

  try {
    // Create processing job
    job = await createProcessingJob(storyId);

    // Update job: Starting translation (30%)
    await updateProcessingJob(job.id, {
      status: 'processing',
      current_step: 'translation',
      progress_pct: 30,
    });

    const translatedText = language.toLowerCase().includes('english')
      ? originalText
      : (await translateDialectText(originalText, language)).translation;

    console.log('[TEXT PIPELINE] Original length:', originalText.length, 'Translated length:', translatedText.length);

    // Generate AI synopsis
    const synopsis = await generateSynopsis(translatedText);
    console.log('[TEXT PIPELINE] Synopsis generated, length:', synopsis.length);

    const translation = await createTranslation({
      story_id: storyId,
      original_text: originalText,
      translated_text: translatedText,
      synopsis,
      subtitles: [],
    });
    console.log('[TEXT PIPELINE] Translation created:', translation.id);

    // Update job: Starting theme detection (50%)
    await updateProcessingJob(job.id, {
      current_step: 'themes',
      progress_pct: 50,
    });

    const suggestedThemes = await suggestThemes(translatedText);
    for (const themeName of suggestedThemes) {
      let tag = await getTagByName(themeName);
      if (!tag) tag = await createTag({ name: themeName });
      if (tag.id) await linkStoryToTag(storyId, tag.id);
    }

    // Update job: Starting illustrations (70%)
    await updateProcessingJob(job.id, {
      current_step: 'illustrations',
      progress_pct: 70,
    });

    const sentences = translatedText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const illustrations: string[] = [];
    for (let i = 0; i < Math.min(sentences.length, 10); i++) {
      const illustrationBuffer = await generateIllustration(sentences[i].trim(), storyId, i + 1);
      const imageUrl = await uploadImageFile(illustrationBuffer, `${storyId}_page_${i + 1}.png`, storyId);
      await createIllustration({ story_id: storyId, image_url: imageUrl, page_number: i + 1 });
      illustrations.push(imageUrl);
    }

    // Mark job as completed (no video for text uploads)
    await updateProcessingJob(job.id, {
      status: 'completed',
      progress_pct: 100,
      completed_at: new Date().toISOString(),
    });

    return { translation, suggestedThemes, illustrations };

  } catch (error: any) {
    // Mark job as failed if it exists
    if (job) {
      await updateProcessingJob(job.id, {
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString(),
      }).catch((err) => console.error('Failed to update job status:', err));
    }
    throw error; // Re-throw to be handled by route handler
  }
}

// ============================
// POST /upload/audio
// ============================
router.post('/audio', uploadLimiter, optionalAuth, audioUpload.single('audio'), validate(storyUploadSchema), async (req: AuthenticatedRequest, res: Response) => {
  let job: ProcessingJob | undefined;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // SECURITY: Log file upload event
    logFileUpload(req, req.file.originalname, req.file.mimetype, req.file.size);

    const { title, storytellerName, storytellerLocation, storytellerDialect, ageGroup, country, language, theme } = req.body;
    const uploadedBy = req.user?.id;

    let storytellerId: string | undefined;
    if (storytellerName) {
      const storyteller = await createStoryteller({
        name: storytellerName,
        location: storytellerLocation,
        dialect: storytellerDialect || language || 'Jamaican Patois',
      });
      storytellerId = storyteller.id;
    }

    const story = await createStory({
      title: title || 'Untitled Story',
      storyteller_id: storytellerId,
      uploaded_by: uploadedBy,
      age_group: ageGroup?.toLowerCase() as any,
      country: country || 'Jamaica',
      language: language || 'Jamaican Patois',
      theme: theme?.toLowerCase().trim(),
    });

    // Create processing job immediately after story creation
    job = await createProcessingJob(story.id!);

    const audioFileName = `${story.id}_${Date.now()}.m4a`;
    const audioUrl = await uploadAudioFile(req.file.buffer, audioFileName, story.id!);
    await createMedia({ story_id: story.id!, type: 'audio', file_url: audioUrl });

    // Update job: Starting transcription (10%)
    await updateProcessingJob(job.id, {
      status: 'processing',
      current_step: 'transcription',
      progress_pct: 10,
    });

    const originalText = await transcribeAudio(req.file.buffer);

    // Update job: Starting translation (30%)
    await updateProcessingJob(job.id, {
      current_step: 'translation',
      progress_pct: 30,
    });

    console.log('[UPLOAD] Transcription complete, length:', originalText.length);
    const { translation: translatedText } = await translateDialectText(
      originalText,
      language || 'Jamaican Patois'
    );
    console.log('[UPLOAD] Translation complete, length:', translatedText.length);

    // Generate AI synopsis
    const synopsis = await generateSynopsis(translatedText);
    console.log('[UPLOAD] Synopsis generated, length:', synopsis.length);

    const subtitles = await generateSubtitles(req.file.buffer, translatedText);

    const translation = await createTranslation({
      story_id: story.id!,
      original_text: originalText,
      translated_text: translatedText,
      synopsis,
      subtitles,
    });
    console.log('[UPLOAD] Translation record created:', translation.id);

    // Update job: Starting theme detection (50%)
    await updateProcessingJob(job.id, {
      current_step: 'themes',
      progress_pct: 50,
    });

    const suggestedThemes = await suggestThemes(translatedText);
    for (const themeName of suggestedThemes) {
      let tag = await getTagByName(themeName);
      if (!tag) tag = await createTag({ name: themeName });
      if (tag.id) await linkStoryToTag(story.id!, tag.id);
    }

    // Update job: Starting illustrations (70%)
    await updateProcessingJob(job.id, {
      current_step: 'illustrations',
      progress_pct: 70,
    });

    const sentences = translatedText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const illustrations: string[] = [];
    for (let i = 0; i < Math.min(sentences.length, 10); i++) {
      const illustrationBuffer = await generateIllustration(sentences[i].trim(), story.id!, i + 1);
      const imageUrl = await uploadImageFile(illustrationBuffer, `${story.id}_page_${i + 1}.png`, story.id!);
      await createIllustration({ story_id: story.id!, image_url: imageUrl, page_number: i + 1 });
      illustrations.push(imageUrl);
    }

    // Update job: Starting video generation (90%)
    await updateProcessingJob(job.id, {
      current_step: 'video',
      progress_pct: 90,
    });

    // Start video generation with job tracking (async)
    const jobId = job.id;
    const storyId = story.id!;
    (async () => {
      try {
        console.log('[UPLOAD] Starting background video generation for story:', storyId);
        const videoUrl = await generateVideo(audioUrl, storyId, `${storyId}_video.mp4`);
        await createMedia({ story_id: storyId, type: 'video', file_url: videoUrl });

        // Mark job as completed
        await updateProcessingJob(jobId, {
          status: 'completed',
          progress_pct: 100,
          completed_at: new Date().toISOString(),
        });
        console.log('[UPLOAD] Video generation completed successfully');
      } catch (err: any) {
        console.error('[UPLOAD] Video generation failed:', err.message);

        // Video failed but audio/story succeeded - mark as completed with error note
        await updateProcessingJob(jobId, {
          status: 'completed',
          progress_pct: 100,
          error_message: `Video generation failed: ${err.message}. Story is available in audio-only mode.`,
          completed_at: new Date().toISOString(),
        });

        // Don't throw - allow story to exist without video
      }
    })();

    // Return immediately (video generating in background)
    res.status(201).json({ story, translation, audioUrl, illustrations, suggestedThemes, message: 'Story uploaded and processed successfully' });
  } catch (error: any) {
    console.error('Audio upload error:', error);

    // Mark job as failed if it exists
    if (job) {
      await updateProcessingJob(job.id, {
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString(),
      }).catch((err) => console.error('Failed to update job status:', err));
    }

    res.status(500).json({ error: error.message });
  }
});

// ============================
// POST /upload/text  — type a story directly
// ============================
const textStorySchema = z.object({
  storyText: z.string().min(10, 'Story must be at least 10 characters').max(50000),
  title: z.string().min(1).max(200).optional(),
  storytellerName: z.string().max(100).optional(),
  storytellerLocation: z.string().max(100).optional(),
  ageGroup: z.enum(['children', 'teens', 'general']).optional(),
  country: z.string().max(100).optional(),
  language: z.string().max(100).optional(),
  theme: z.string().max(100).optional(),
});

router.post('/text', uploadLimiter, optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  const parsed = textStorySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  try {
    const { storyText, title, storytellerName, storytellerLocation, ageGroup, country, language, theme } = parsed.data;
    const uploadedBy = req.user?.id;

    let storytellerId: string | undefined;
    if (storytellerName) {
      const storyteller = await createStoryteller({
        name: storytellerName,
        location: storytellerLocation,
        dialect: language || 'English',
      });
      storytellerId = storyteller.id;
    }

    const story = await createStory({
      title: title || 'Untitled Story',
      storyteller_id: storytellerId,
      uploaded_by: uploadedBy,
      age_group: ageGroup?.toLowerCase() as any,
      country: country || 'Jamaica',
      language: language || 'English',
      theme: theme?.toLowerCase().trim(),
    });

    const { translation, suggestedThemes, illustrations } = await processTextPipeline(
      story.id!,
      storyText,
      language || 'English'
    );

    res.status(201).json({ story, translation, illustrations, suggestedThemes, message: 'Text story saved and processed successfully' });
  } catch (error: any) {
    console.error('Text upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================
// POST /upload/document  — upload .txt or .docx
// ============================
router.post('/document', uploadLimiter, optionalAuth, docUpload.single('document'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document file provided' });
    }

    // SECURITY: Log file upload event
    logFileUpload(req, req.file.originalname, req.file.mimetype, req.file.size);

    // Extract text from document
    let extractedText = '';
    const mime = req.file.mimetype;

    if (mime === 'text/plain') {
      extractedText = req.file.buffer.toString('utf-8');
    } else if (
      mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mime === 'application/msword'
    ) {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      extractedText = result.value;
    }

    extractedText = extractedText.trim();
    if (extractedText.length < 10) {
      return res.status(400).json({ error: 'Document appears to be empty or too short.' });
    }

    const { title, storytellerName, storytellerLocation, ageGroup, country, language, theme } = req.body;
    const uploadedBy = req.user?.id;

    let storytellerId: string | undefined;
    if (storytellerName) {
      const storyteller = await createStoryteller({
        name: storytellerName,
        location: storytellerLocation,
        dialect: language || 'English',
      });
      storytellerId = storyteller.id;
    }

    const story = await createStory({
      title: title || req.file.originalname.replace(/\.[^/.]+$/, '') || 'Untitled Story',
      storyteller_id: storytellerId,
      uploaded_by: uploadedBy,
      age_group: ageGroup?.toLowerCase() as any,
      country: country || 'Jamaica',
      language: language || 'English',
      theme: theme?.toLowerCase().trim(),
    });

    const { translation, suggestedThemes, illustrations } = await processTextPipeline(
      story.id!,
      extractedText,
      language || 'English'
    );

    res.status(201).json({ story, translation, illustrations, suggestedThemes, message: 'Document uploaded and processed successfully' });
  } catch (error: any) {
    console.error('Document upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
