
import React, { useState, useRef, useEffect } from 'react';
import { Story, StorySegment, Attachment, StoryType, TranslationResult } from '../types';
import { translateDialect, generateIllustration, transcribeAudio, generateBookCover, generateSpeech, analyzeUploadedMedia, generateCinematicVideo } from '../services/gemini';

const WISDOM_QUOTES = [
  "Synthesizing ancestral knowledge in parallel threads...",
  "Oral traditions are being encoded into digital light.",
  "Veo is visualizing the rhythm of your ancestors.",
  "Concurrency engine: Mapping linguistics and visuals simultaneously.",
  "Your voice is now the soundtrack to history."
];

interface ContributeViewProps {
  onAdd: (story: Story) => void;
}

const ContributeView: React.FC<ContributeViewProps> = ({ onAdd }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    location: '',
    culture: 'Jamaican',
    dialect: 'Patois',
    text: '',
    tags: 'Folklore',
  });

  useEffect(() => {
    let interval: any;
    if (isProcessing) {
      interval = setInterval(() => setQuoteIndex(prev => (prev + 1) % WISDOM_QUOTES.length), 5000);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
      timerRef.current = window.setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (err) { alert("Microphone access denied."); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newAttachments: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const base64 = await blobToBase64(file);
      newAttachments.push({
        id: Math.random().toString(36).substring(7),
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        data: base64,
        size: file.size
      });
    }
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return alert("Please provide a title.");

    setIsProcessing(true);
    setProcessingStep('Initializing Rapid Archival...');

    try {
      let originalText = formData.text;
      let finalDialect = formData.dialect;
      let audioBase64 = "";
      let sourceType = StoryType.Text;
      let mediaData = "";
      let mediaMimeType = "";
      let transData: TranslationResult | null = null;

      // 1. CORE EXTRACTION (Sequential because logic depends on it)
      const videoAtt = attachments.find(a => a.mimeType.startsWith('video/'));
      const imageAtt = attachments.find(a => a.mimeType.startsWith('image/'));
      const docAtt = attachments.find(a => a.mimeType === 'application/pdf' || a.name.endsWith('.pdf'));

      if (videoAtt) {
        sourceType = StoryType.Video;
        mediaData = videoAtt.data;
        mediaMimeType = videoAtt.mimeType;
        transData = await analyzeUploadedMedia(mediaData, mediaMimeType);
        originalText = formData.text || "Video Artifact";
      } else if (imageAtt) {
        sourceType = StoryType.Image;
        mediaData = imageAtt.data;
        mediaMimeType = imageAtt.mimeType;
        transData = await analyzeUploadedMedia(mediaData, mediaMimeType);
        originalText = formData.text || "Visual Artifact";
      } else if (docAtt) {
        sourceType = StoryType.Document;
        transData = await analyzeUploadedMedia(docAtt.data, docAtt.mimeType);
        originalText = transData.translated;
      } else if (audioBlob) {
        audioBase64 = await blobToBase64(audioBlob);
        const transResult = await transcribeAudio(audioBase64, audioBlob.type);
        originalText = transResult.text;
        finalDialect = transResult.dialect;
        transData = await translateDialect(originalText, finalDialect);
      } else {
        transData = await translateDialect(originalText || "Untranscribed memory", finalDialect);
      }

      setProcessingStep('Parallel Synthesis Active...');

      // 2. PARALLEL GENERATION (Speed boost: Run all heavy tasks at once)
      const tasks: [
        Promise<string | undefined>, // Cinematic Video
        Promise<string | undefined>, // Book Cover
        Promise<StorySegment[]>       // All Segments (Illustrations + Audio)
      ] = [
        // Cinematic Task
        (async () => {
          if (videoAtt) return undefined; // Don't generate if video already exists
          return generateCinematicVideo(transData!.translated);
        })(),
        
        // Book Cover Task
        generateBookCover(formData.title, formData.culture),

        // Multi-Segment Parallel Task
        (async () => {
          if (!transData?.segments || transData.segments.length === 0) return [];
          // Process all segments in parallel
          return Promise.all(transData.segments.map(async (seg) => {
            const [illustration, speech] = await Promise.all([
              generateIllustration(seg.translated),
              generateSpeech(seg.translated)
            ]);
            return {
              original: seg.original,
              translated: seg.translated,
              illustrationBase64: illustration,
              audioBase64: speech
            };
          }));
        })()
      ];

      const [generatedVideoBase64, coverImageBase64, segments] = await Promise.all(tasks);

      const newStory: Story = {
        id: Date.now().toString(),
        title: formData.title,
        author: formData.author || 'Global Archivist',
        location: formData.location || 'Community Portal',
        culture: formData.culture,
        ageGroup: 'General',
        dialectName: finalDialect,
        originalText,
        translatedText: transData!.translated,
        segments,
        slangExplanations: transData!.slangExplanations || [],
        culturalContext: transData!.culturalContext || "",
        timestamp: Date.now(),
        tags: [formData.tags, sourceType.toUpperCase()],
        audioBase64,
        coverImageBase64,
        attachments,
        sourceType,
        mediaData,
        mediaMimeType,
        generatedVideoBase64
      };

      onAdd(newStory);
    } catch (err: any) {
      console.error(err);
      alert("Synthesis failed. Ensure your API key is valid and billing is active.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-10 text-center space-y-12">
        <div className="relative">
          <div className="w-56 h-56 border-[12px] border-amber-500/10 border-t-amber-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <i className="fa-solid fa-bolt-lightning text-5xl text-amber-500 animate-pulse"></i>
          </div>
        </div>
        <div className="max-w-xl space-y-6">
          <h3 className="text-4xl font-black text-slate-900 dark:text-white">{processingStep}</h3>
          <p className="text-xl text-amber-600 font-serif italic transition-all duration-700">"{WISDOM_QUOTES[quoteIndex]}"</p>
          <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 animate-[progress_60s_linear_forwards]"></div>
          </div>
          <div className="pt-4 flex justify-center gap-4">
             <span className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400"><i className="fa-solid fa-microchip"></i> Parallel Threads</span>
             <span className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400"><i className="fa-solid fa-film"></i> Cinematic Async</span>
          </div>
        </div>
        <style>{` @keyframes progress { 0% { width: 0%; } 100% { width: 100%; } } `}</style>
      </div>
    );
  }

  return (
    <div className="p-10 space-y-12 max-w-6xl mx-auto bg-inherit">
      <div className="space-y-2">
        <h2 className="text-5xl font-black text-slate-900 dark:text-white">Global Command Center</h2>
        <p className="text-xl text-slate-600 dark:text-slate-400 font-medium">Record and archive heritage using our multi-threaded synthesis engine.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-10">
          <div className="p-10 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-10">
            
            <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Archive Metadata</label>
               <input required className="w-full p-6 rounded-3xl bg-slate-50 dark:bg-slate-800 border-none outline-none text-xl font-bold shadow-inner" placeholder="Artifact Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>

            <div className="grid grid-cols-1 gap-10">
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Oral & Written Record</h4>
                   {isRecording && <div className="flex items-center gap-2 text-red-600 font-black text-xs animate-pulse"><i className="fa-solid fa-circle"></i> Recording {formatTime(recordingTime)}</div>}
                </div>
                
                <div className="flex flex-col gap-6">
                  <button 
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-full py-6 rounded-3xl flex items-center justify-center gap-4 transition-all shadow-lg ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-600 text-white hover:bg-amber-700 shadow-amber-100'}`}
                  >
                    <i className={`fa-solid ${isRecording ? 'fa-stop-circle' : 'fa-microphone'}`}></i>
                    <span className="font-black uppercase tracking-widest">{isRecording ? 'Stop Recording' : audioBlob ? 'Update Record' : 'Start Oral Record'}</span>
                  </button>

                  <textarea 
                    className="w-full h-48 p-8 bg-slate-50 dark:bg-slate-800 rounded-[40px] outline-none border-none text-lg leading-relaxed shadow-inner" 
                    placeholder="Type the story context or manually transcribe here..." 
                    value={formData.text} 
                    onChange={e => setFormData({...formData, text: e.target.value})} 
                  />
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Supplementary Artifacts</h4>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[40px] text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group bg-slate-50 dark:bg-slate-800/20"
                >
                  <i className="fa-solid fa-file-arrow-up text-3xl text-slate-300 group-hover:text-amber-500 mb-2"></i>
                  <p className="text-sm font-bold text-slate-400">Upload media (AI analyzes in background)</p>
                  <input type="file" multiple hidden ref={fileInputRef} onChange={handleFileChange} />
                </div>

                {attachments.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {attachments.map(att => (
                      <div key={att.id} className="p-3 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-between border dark:border-slate-700 shadow-sm">
                        <span className="text-xs font-bold truncate max-w-[150px]">{att.name}</span>
                        <button type="button" onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))} className="text-red-500"><i className="fa-solid fa-trash-can"></i></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="p-10 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8 sticky top-24">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Global Classification</label>
              <input className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border text-sm font-bold" placeholder="Culture/Ethos" value={formData.culture} onChange={e => setFormData({...formData, culture: e.target.value})} />
              <input className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border text-sm font-bold" placeholder="Archive Origin" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              <select className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border text-sm font-bold" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})}>
                <option>Folklore</option><option>History</option><option>Personal Story</option><option>Ancestral Wisdom</option>
              </select>
            </div>
            
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <button type="submit" className="w-full bg-amber-600 text-white font-black py-6 rounded-[32px] text-xl shadow-2xl hover:bg-amber-700 active:scale-95 transition-all">
                Optimized Preservation
              </button>
              <p className="text-[10px] text-center font-black text-slate-400 mt-6 uppercase tracking-widest">Multi-threaded Archival active</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ContributeView;
