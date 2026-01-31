import express, { Request, Response } from 'express';
import multer from 'multer';
import { createStoryteller, createStory, createMedia, createTranslation, createIllustration, linkStoryToTag, getTagByName, createTag } from '../services/database';
import { uploadAudioFile, uploadImageFile } from '../services/storage';
import { transcribeAudio, translateText, generateIllustration, generateSubtitles, suggestThemes } from '../services/ai';
import { generateVideo } from '../services/video';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Upload audio and process story
router.post('/audio', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const {
      title,
      storytellerName,
      storytellerLocation,
      storytellerDialect,
      ageGroup,
      country,
      language,
      theme,
    } = req.body;

    // 1. Create or get storyteller
    let storytellerId: string | undefined;
    if (storytellerName) {
      const storyteller = await createStoryteller({
        name: storytellerName,
        location: storytellerLocation,
        dialect: storytellerDialect || language || 'Jamaican Patois',
      });
      storytellerId = storyteller.id;
    }

    // 2. Create story record
    const story = await createStory({
      title: title || 'Untitled Story',
      storyteller_id: storytellerId,
      age_group: ageGroup,
      country: country || 'Jamaica',
      language: language || 'Jamaican Patois',
      theme: theme,
    });

    // 3. Upload audio file
    const audioFileName = `${story.id}_${Date.now()}.mp3`;
    const audioUrl = await uploadAudioFile(req.file.buffer, audioFileName, story.id!);

    // 4. Create media record
    await createMedia({
      story_id: story.id!,
      type: 'audio',
      file_url: audioUrl,
    });

    // 5. Process audio: Transcription
    const originalText = await transcribeAudio(req.file.buffer);

    // 6. Translation
    const translatedText = await translateText(originalText);

    // 7. Generate subtitles
    const subtitles = await generateSubtitles(req.file.buffer, translatedText);

    // 8. Create translation record
    const translation = await createTranslation({
      story_id: story.id!,
      original_text: originalText,
      translated_text: translatedText,
      subtitles: subtitles,
    });

    // 9. Suggest themes using AI
    const suggestedThemes = await suggestThemes(translatedText);
    
    // Link suggested themes
    for (const themeName of suggestedThemes) {
      let tag = await getTagByName(themeName);
      if (!tag) {
        tag = await createTag({ name: themeName });
      }
      if (tag.id) {
        await linkStoryToTag(story.id!, tag.id);
      }
    }

    // 10. Generate illustrations for storybook
    const sentences = translatedText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const illustrations = [];
    
    for (let i = 0; i < Math.min(sentences.length, 10); i++) {
      const prompt = sentences[i].trim();
      const illustrationBuffer = await generateIllustration(prompt, story.id!, i + 1);
      const imageFileName = `${story.id}_page_${i + 1}.png`;
      const imageUrl = await uploadImageFile(illustrationBuffer, imageFileName, story.id!);
      
      await createIllustration({
        story_id: story.id!,
        image_url: imageUrl,
        page_number: i + 1,
      });
      
      illustrations.push(imageUrl);
    }

    // 11. Generate video (async, don't wait)
    generateVideo(audioUrl, story.id!, `${story.id}_video.mp4`)
      .then(async (videoUrl) => {
        await createMedia({
          story_id: story.id!,
          type: 'video',
          file_url: videoUrl,
        });
      })
      .catch((error) => {
        console.error('Video generation failed:', error);
      });

    // Return story with all data
    res.status(201).json({
      story,
      translation,
      audioUrl,
      illustrations,
      suggestedThemes,
      message: 'Story uploaded and processed successfully',
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
