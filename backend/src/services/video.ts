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

  try {
    // Fetch audio file using axios
    const audioResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
    const audioBuffer = Buffer.from(audioResponse.data);
    const audioPath = join(tempDir, 'audio.mp3');
    writeFileSync(audioPath, audioBuffer);

    // Get illustrations for the story
    const illustrations = await getIllustrationsByStory(storyId);
    
    if (illustrations.length === 0) {
      throw new Error('No illustrations found for story');
    }

    // Download illustrations using axios
    const imagePaths: string[] = [];
    for (let i = 0; i < illustrations.length; i++) {
      const imgResponse = await axios.get(illustrations[i].image_url, { responseType: 'arraybuffer' });
      const imgBuffer = Buffer.from(imgResponse.data);
      const imgPath = join(tempDir, `image_${i}.png`);
      writeFileSync(imgPath, imgBuffer);
      imagePaths.push(imgPath);
    }

    // Calculate duration per image (distribute audio length evenly)
    const audioDuration = await getAudioDuration(audioPath);
    const durationPerImage = audioDuration / imagePaths.length;

    // Create video with images and audio
    return new Promise((resolve, reject) => {
      let command = ffmpeg();

      // Add images as input
      imagePaths.forEach((imgPath, index) => {
        command = command.input(imgPath);
      });

      // Add audio
      command = command.input(audioPath);

      // Create complex filter for image sequence
      const scaleFilters = imagePaths
        .map((_, index) => {
          return `[${index}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setpts=PTS-STARTPTS,fps=30[v${index}]`;
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
        .on('end', async () => {
          try {
            // Upload video to Supabase
            const videoBuffer = readFileSync(outputPath);
            const videoUrl = await uploadVideoFile(videoBuffer, outputFileName, storyId);

            // Cleanup temp files
            unlinkSync(audioPath);
            imagePaths.forEach(path => unlinkSync(path));
            unlinkSync(outputPath);

            resolve(videoUrl);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (err) => {
          reject(err);
        })
        .run();
    });
  } catch (error) {
    throw new Error(`Video generation failed: ${error}`);
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
