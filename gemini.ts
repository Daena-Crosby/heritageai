
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { TranslationResult } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const handleModelError = (e: any, modelName: string) => {
  const errorMessage = e?.message || String(e);
  console.error(`Error with model ${modelName}:`, e);
  if (errorMessage.includes("PERMISSION_DENIED") || errorMessage.includes("Requested entity was not found")) {
    window.dispatchEvent(new CustomEvent('heritage-api-key-error'));
    throw new Error(`Model error. Redirecting...`);
  }
  throw e;
};

export const generateCinematicVideo = async (prompt: string): Promise<string | undefined> => {
  const model = 'veo-3.1-fast-generate-preview';
  try {
    const ai = getAI();
    let operation = await ai.models.generateVideos({
      model,
      prompt: `A beautiful cinematic heritage film: ${prompt}. High quality, 4k, cultural textures, evocative and respectful.`,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) return undefined;

    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Video generation failed:", e);
    return undefined;
  }
};

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<{ text: string, dialect: string }> => {
  const model = 'gemini-3-flash-preview';
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [
            { inlineData: { mimeType, data: base64Audio } },
            { text: "Listen to this audio. Transcribe the oral story in its original dialect. Identify the dialect. Return JSON: {text, dialect}." }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { text: { type: Type.STRING }, dialect: { type: Type.STRING } },
          required: ["text", "dialect"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (e) { return handleModelError(e, model); }
};

export const analyzeUploadedMedia = async (base64Data: string, mimeType: string): Promise<TranslationResult> => {
  const model = 'gemini-3-flash-preview';
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: "Analyze this uploaded heritage artifact. Provide a short synopsis of the content, identify any cultural slang/terms used (at least 3), and explain the cultural context. Return in the specified JSON format." }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translated: { type: Type.STRING, description: "A short synopsis of the artifact content" },
            literal: { type: Type.STRING, description: "A one sentence summary" },
            slangExplanations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { term: { type: Type.STRING }, explanation: { type: Type.STRING } },
                required: ["term", "explanation"]
              }
            },
            culturalContext: { type: Type.STRING },
            segments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { original: { type: Type.STRING }, translated: { type: Type.STRING } },
                required: ["original", "translated"]
              }
            }
          },
          required: ["translated", "literal", "slangExplanations", "culturalContext", "segments"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (e) { return handleModelError(e, model); }
};

export const translateDialect = async (text: string, dialect: string): Promise<TranslationResult> => {
  const model = "gemini-3-pro-preview";
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model,
      contents: `Translate and analyze this text from the ${dialect} dialect. TEXT: "${text}"`,
      config: {
        systemInstruction: `You are the Heritage AI Agent. Provide translation, literal syntax, slang explanations, cultural context, and break into 4-6 story segments.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translated: { type: Type.STRING },
            literal: { type: Type.STRING },
            slangExplanations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { term: { type: Type.STRING }, explanation: { type: Type.STRING } }
              }
            },
            culturalContext: { type: Type.STRING },
            segments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { original: { type: Type.STRING }, translated: { type: Type.STRING } }
              }
            }
          },
          required: ["translated", "literal", "slangExplanations", "culturalContext", "segments"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (e) { return handleModelError(e, model); }
};

export const generateIllustration = async (prompt: string): Promise<string | undefined> => {
  const model = 'gemini-2.5-flash-image';
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: `Hand-painted folk art illustration: ${prompt}` }] },
      config: { imageConfig: { aspectRatio: "1:1" } },
    });
    for (const part of response.candidates?.[0]?.content.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
  } catch (e) { return undefined; }
};

export const generateBookCover = async (title: string, culture: string): Promise<string | undefined> => {
  const model = 'gemini-3-pro-image-preview';
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: `High-end cultural book cover for "${title}" in ${culture} style.` }] },
      config: { imageConfig: { aspectRatio: "3:4", imageSize: "1K" } },
    });
    for (const part of response.candidates?.[0]?.content.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
  } catch (e) { return undefined; }
};

export const generateSpeech = async (text: string): Promise<string | undefined> => {
  const model = "gemini-2.5-flash-preview-tts";
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: `Read with a warm storytelling voice: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (e) { return undefined; }
};

export const getCulturalGuideResponse = async (query: string, history: any[]) => {
  const model = 'gemini-3-pro-preview';
  try {
    const ai = getAI();
    const chat = ai.chats.create({ model });
    const result = await chat.sendMessage({ message: query });
    return result.text;
  } catch (e) { return handleModelError(e, model); }
};
