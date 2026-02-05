
import React, { useState, useEffect, useRef } from 'react';
import { Story, StoryType } from '../types';

interface StoryDetailViewProps {
  story: Story;
  onBack: () => void;
}

const StoryDetailView: React.FC<StoryDetailViewProps> = ({ story, onBack }) => {
  const hasGeneratedVideo = !!story.generatedVideoBase64;
  const initialMode = hasGeneratedVideo || story.sourceType === StoryType.Video ? 'video' : 
                     story.sourceType === StoryType.Image || story.segments.length > 0 ? 'storybook' : 'reading';
  
  const [mode, setMode] = useState<'reading' | 'storybook' | 'video'>(initialMode);
  const [currentPage, setCurrentPage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode === 'video' && videoRef.current && audioRef.current) {
      const v = videoRef.current;
      const a = audioRef.current;
      const handlePlay = () => a.play();
      const handlePause = () => a.pause();
      const handleSeek = () => { a.currentTime = v.currentTime; };
      v.addEventListener('play', handlePlay);
      v.addEventListener('pause', handlePause);
      v.addEventListener('seeking', handleSeek);
      return () => {
        v.removeEventListener('play', handlePlay);
        v.removeEventListener('pause', handlePause);
        v.removeEventListener('seeking', handleSeek);
      };
    }
  }, [mode]);

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const videoSource = story.generatedVideoBase64 || (story.mediaData ? `data:${story.mediaMimeType};base64,${story.mediaData}` : null);

  return (
    <div className={`flex flex-col h-full animate-fadeIn transition-colors ${mode === 'video' ? 'bg-slate-950 text-white' : 'bg-slate-50 dark:bg-slate-950 dark:text-white'}`}>
      <div className={`px-10 py-6 border-b flex justify-between items-center z-50 shadow-sm ${mode === 'video' ? 'bg-slate-900 border-slate-800' : 'bg-white dark:bg-slate-900 dark:border-slate-800'}`}>
        <button onClick={onBack} className="font-black flex items-center gap-3">
          <i className="fa-solid fa-arrow-left"></i><span>Exit Archive</span>
        </button>
        
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
          {(['reading', 'storybook', 'video'] as const).map((m) => {
            if (m === 'video' && !videoSource) return null;
            if (m === 'storybook' && story.segments.length === 0 && !story.mediaData) return null;
            return (
              <button
                key={m}
                onClick={() => { setMode(m); setCurrentPage(0); }}
                className={`px-5 py-2 rounded-xl text-xs font-black capitalize transition-all ${
                  mode === m ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-md' : 'text-slate-400'
                }`}
              >
                {m === 'video' && hasGeneratedVideo ? 'Cinematic' : m}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 relative overflow-y-auto custom-scrollbar">
        {mode === 'reading' && (
          <div className="p-10 max-w-5xl mx-auto space-y-12">
            <div className="space-y-4">
              <span className="text-amber-600 font-black uppercase text-xs tracking-widest">{story.culture} Archive</span>
              <h1 className="text-7xl font-black">{story.title}</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="aspect-[3/4] rounded-[50px] overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800">
                  {story.coverImageBase64 ? <img src={story.coverImageBase64} className="w-full h-full object-cover" /> : <div className="h-full bg-amber-900 flex items-center justify-center text-amber-500"><i className="fa-solid fa-book text-6xl"></i></div>}
                </div>
                
                {story.slangExplanations.length > 0 && (
                  <div className="p-10 bg-white dark:bg-slate-900 rounded-[50px] border shadow-xl space-y-6">
                    <h4 className="text-xl font-black flex items-center gap-3"><i className="fa-solid fa-language text-amber-600"></i> Lexicon</h4>
                    <div className="space-y-4">
                      {story.slangExplanations.map((lex, idx) => (
                        <div key={idx} className="pb-4 border-b last:border-none border-slate-100 dark:border-slate-800">
                          <p className="font-black text-amber-700 dark:text-amber-500">"{lex.term}"</p>
                          <p className="text-sm font-bold text-slate-600 dark:text-slate-400">{lex.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-10">
                <div className="p-10 bg-amber-100/50 dark:bg-slate-900 rounded-[50px] border border-amber-200 dark:border-slate-800 shadow-sm space-y-6">
                  <h4 className="text-[10px] font-black text-amber-800 dark:text-amber-500 uppercase tracking-widest">Synopsis & Insights</h4>
                  <p className="text-2xl font-serif italic leading-relaxed text-slate-800 dark:text-slate-200">"{story.translatedText}"</p>
                </div>

                <div className="p-10 bg-slate-900 text-white rounded-[50px] shadow-2xl space-y-6 relative overflow-hidden">
                  <i className="fa-solid fa-scroll absolute -bottom-10 -right-10 text-[180px] opacity-5 -rotate-12"></i>
                  <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Cultural Context</h4>
                  <p className="text-lg font-medium relative z-10">{story.culturalContext}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {mode === 'storybook' && (
          <div className="h-full flex items-center justify-center p-12">
            <div className="relative w-full max-w-6xl aspect-[1.6/1] bg-white dark:bg-slate-900 rounded-[50px] shadow-2xl flex overflow-hidden border dark:border-slate-800">
              <div className="w-1/2 h-full bg-slate-100 dark:bg-slate-800 relative">
                {story.sourceType === StoryType.Image && story.mediaData ? (
                  <img src={`data:${story.mediaMimeType};base64,${story.mediaData}`} className="w-full h-full object-cover" />
                ) : story.segments[currentPage]?.illustrationBase64 ? (
                  <img src={story.segments[currentPage].illustrationBase64} className="w-full h-full object-cover" />
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-300"><i className="fa-solid fa-image text-8xl"></i></div>
                )}
              </div>
              <div className="w-1/2 h-full p-20 flex flex-col justify-center">
                <div className="space-y-8">
                  <span className="text-xs font-black text-amber-500 uppercase tracking-widest">Archive Page {currentPage + 1}</span>
                  <p className="text-3xl font-black leading-tight">{story.segments[currentPage]?.translated || story.translatedText}</p>
                  <p className="text-lg font-serif italic opacity-60">"{story.segments[currentPage]?.original || story.originalText.slice(0, 100) + '...'}"</p>
                </div>
                <div className="mt-auto flex justify-between items-center pt-10">
                   <button disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)} className="text-amber-600 font-black flex items-center gap-2 disabled:opacity-30"><i className="fa-solid fa-chevron-left"></i> Previous</button>
                   <button disabled={currentPage >= Math.max(0, story.segments.length - 1)} onClick={() => setCurrentPage(p => p + 1)} className="text-amber-600 font-black flex items-center gap-2 disabled:opacity-30">Next <i className="fa-solid fa-chevron-right"></i></button>
                </div>
              </div>
            </div>
          </div>
        )}

        {mode === 'video' && (
          <div ref={videoContainerRef} className="h-full bg-slate-950 flex flex-col items-center justify-center relative">
            {videoSource ? (
              <div className={`relative ${isFullscreen ? 'w-screen h-screen' : 'w-full max-w-6xl aspect-video rounded-[50px] overflow-hidden'}`}>
                <video 
                  ref={videoRef}
                  controls 
                  className="w-full h-full bg-black shadow-2xl" 
                  src={videoSource} 
                  autoPlay={hasGeneratedVideo}
                />
                
                {story.audioBase64 && (
                  <audio ref={audioRef} src={`data:audio/webm;base64,${story.audioBase64}`} />
                )}

                <div className="absolute top-8 left-8 flex items-center gap-3">
                   <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-full flex items-center gap-4 border border-white/10">
                      <i className={`fa-solid ${hasGeneratedVideo ? 'fa-wand-magic-sparkles text-amber-400' : 'fa-video text-white'}`}></i>
                      <span className="text-xs font-black uppercase tracking-widest">
                        {hasGeneratedVideo ? 'AI Cinematic Synthesis' : 'Archive Artifact'}
                      </span>
                   </div>
                   {story.audioBase64 && (
                      <div className="bg-amber-600 text-white px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest shadow-xl">
                        Oral Over-Sync
                      </div>
                   )}
                </div>

                <div className="absolute top-8 right-8 flex gap-4">
                  <button onClick={toggleFullscreen} className="w-12 h-12 bg-white/10 backdrop-blur rounded-full text-white flex items-center justify-center hover:bg-white/20"><i className="fa-solid fa-expand"></i></button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryDetailView;
