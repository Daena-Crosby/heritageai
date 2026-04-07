import ffmpeg from 'fluent-ffmpeg';
import { readFileSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import axios from 'axios';
import { uploadVideoFile } from './storage';
import { getIllustrationsByStory } from './database';

export const generateVideo = async (
  audioUrl: string,
  storyId: string,
  outputFileName: string = 'story_video.mp4'
): Promise<string> => {
  const tempDir = tmpdir();
  const outputPath = join(tempDir, outputFileName);
  let audioPath: string | null = null;
  const imagePaths: string[] = [];

  try {
    console.log('[VIDEO] Starting video generation for story:', storyId);

    // Fetch audio file with timeout
    console.log('[VIDEO] Downloading audio from:', audioUrl);
    const audioResponse = await axios.get(audioUrl, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30 second timeout
    });
    const audioBuffer = Buffer.from(audioResponse.data);
    audioPath = join(tempDir, `audio_${storyId}.mp3`);
    writeFileSync(audioPath, audioBuffer);
    console.log('[VIDEO] Audio downloaded, size:', audioBuffer.length);

    // Get illustrations for the story
    const illustrations = await getIllustrationsByStory(storyId);

    if (illustrations.length === 0) {
      throw new Error('No illustrations found for story');
    }
    console.log('[VIDEO] Found', illustrations.length, 'illustrations');

    // Download illustrations with per-image error handling
    const failedDownloads: string[] = [];
    for (let i = 0; i < illustrations.length; i++) {
      try {
        console.log(`[VIDEO] Downloading illustration ${i + 1}/${illustrations.length}:`, illustrations[i].image_url);
        const imgResponse = await axios.get(illustrations[i].image_url, {
          responseType: 'arraybuffer',
          timeout: 20000, // 20 second timeout per image
        });
        const imgBuffer = Buffer.from(imgResponse.data);

        // Verify we got actual image data
        if (imgBuffer.length < 100) {
          throw new Error(`Downloaded image is too small (${imgBuffer.length} bytes)`);
        }

        const imgPath = join(tempDir, `image_${storyId}_${i}.png`);
        writeFileSync(imgPath, imgBuffer);
        imagePaths.push(imgPath);
        console.log(`[VIDEO] Illustration ${i + 1} downloaded successfully, size:`, imgBuffer.length);
      } catch (imgErr: any) {
        console.error(`[VIDEO] Failed to download illustration ${i + 1}:`, imgErr.message);
        failedDownloads.push(`Illustration ${i + 1}: ${imgErr.message}`);
        // Continue with other images instead of failing completely
      }
    }

    // Verify we have at least some images
    if (imagePaths.length === 0) {
      throw new Error(`All illustration downloads failed. Errors: ${failedDownloads.join('; ')}`);
    }

    if (failedDownloads.length > 0) {
      console.warn(`[VIDEO] Some illustrations failed to download (${failedDownloads.length}/${illustrations.length}), continuing with ${imagePaths.length} images`);
    }

    // Calculate duration per image (distribute audio length evenly)
    console.log('[VIDEO] Getting audio duration');
    const audioDuration = await getAudioDuration(audioPath);
    const durationPerImage = audioDuration / imagePaths.length;
    console.log(`[VIDEO] Audio duration: ${audioDuration}s, ${durationPerImage}s per image`);

    // Create video with images and audio
    console.log('[VIDEO] Starting FFmpeg processing');
    return new Promise((resolve, reject) => {
      const ffmpegTimeout = setTimeout(() => {
        reject(new Error('FFmpeg processing timed out after 5 minutes'));
      }, 300000); // 5 minute timeout

      let command = ffmpeg();

      // Add images as input
      imagePaths.forEach((imgPath, index) => {
        command = command.input(imgPath);
      });

      // Add audio
      command = command.input(audioPath!);

      // Create complex filter for image sequence
      const scaleFilters = imagePaths
        .map((_, index) => {
          return `[${index}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black,setpts=PTS-STARTPTS,fps=30[v${index}]`;
        })
        .join(';');

      const concatInputs = imagePaths
        .map((_, index) => `[v${index}]`)
        .join('');

      const filterComplex = `${scaleFilters};${concatInputs}concat=n=${imagePaths.length}:v=1:a=0[outv]`;

      command
        .complexFilter(filterComplex)
        .outputOptions([
          '-map [outv]',
          `-map ${imagePaths.length}:a`, // Map audio from the audio input (after all image inputs)
          '-c:v libx264',
          '-c:a aac',
          '-shortest',
          '-pix_fmt yuv420p',
        ])
        .output(outputPath)
        .on('progress', (progress) => {
          console.log(`[VIDEO] FFmpeg progress: ${JSON.stringify(progress)}`);
        })
        .on('end', async () => {
          clearTimeout(ffmpegTimeout);
          try {
            console.log('[VIDEO] FFmpeg completed, uploading video');

            // Verify output file exists and has content
            const videoBuffer = readFileSync(outputPath);
            if (videoBuffer.length < 1000) {
              throw new Error(`Generated video file is too small (${videoBuffer.length} bytes) - likely corrupted`);
            }
            console.log('[VIDEO] Video file size:', videoBuffer.length);

            const videoUrl = await uploadVideoFile(videoBuffer, outputFileName, storyId);
            console.log('[VIDEO] Video uploaded successfully to:', videoUrl);

            // Cleanup temp files
            if (audioPath) unlinkSync(audioPath);
            imagePaths.forEach(path => {
              try {
                unlinkSync(path);
              } catch (cleanupErr) {
                console.warn('[VIDEO] Failed to cleanup temp file:', path);
              }
            });
            unlinkSync(outputPath);

            resolve(videoUrl);
          } catch (error) {
            clearTimeout(ffmpegTimeout);
            reject(error);
          }
        })
        .on('error', (err) => {
          clearTimeout(ffmpegTimeout);
          console.error('[VIDEO] FFmpeg error:', err.message);
          reject(new Error(`FFmpeg processing failed: ${err.message}`));
        })
        .run();
    });
  } catch (error: any) {
    // Cleanup on error
    if (audioPath) {
      try {
        unlinkSync(audioPath);
      } catch (cleanupErr) {
        console.warn('[VIDEO] Failed to cleanup audio file on error');
      }
    }
    imagePaths.forEach(path => {
      try {
        unlinkSync(path);
      } catch (cleanupErr) {
        console.warn('[VIDEO] Failed to cleanup image file on error:', path);
      }
    });

    console.error('[VIDEO] Video generation failed:', error.message);
    throw new Error(`Video generation failed: ${error.message}`);
  }
};

const getAudioDuration = (audioPath: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata.format.duration || 60);
    });
  });
};

/**
 * Validates that FFmpeg is installed and available in system PATH
 * @throws Error if FFmpeg is not found
 */
export const validateFFmpeg = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    ffmpeg.getAvailableFormats((err, formats) => {
      if (err) {
        reject(new Error('FFmpeg not found in system PATH. Please install FFmpeg from https://ffmpeg.org/download.html'));
      } else {
        resolve();
      }
    });
  });
};
