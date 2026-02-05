
import React from 'react';
import { View, Story, StoryType } from '../types';

interface HomeViewProps {
  setView: (view: View) => void;
  stories: Story[];
  isDarkMode: boolean;
}

const HomeView: React.FC<HomeViewProps> = ({ setView, stories, isDarkMode }) => {
  const recentStories = stories.slice(0, 4);

  const getStoryIcon = (type: StoryType) => {
    switch (type) {
      case StoryType.Video: return 'fa-video';
      case StoryType.Image: return 'fa-image';
      case StoryType.Document: return 'fa-file-lines';
      default: return 'fa-microphone-lines';
    }
  };

  return (
    <div className="p-10 space-y-12 animate-fadeIn bg-inherit">
      {/* Global Hero Section */}
      <section className="relative rounded-[50px] overflow-hidden h-96 shadow-2xl group border-4 border-white dark:border-slate-800">
        <img 
          src="https://images.unsplash.com/photo-1523733230464-42da073e04e9?auto=format&fit=crop&q=80&w=1400" 
          alt="Global Cultural Heritage" 
          className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-transparent flex flex-col justify-center p-16">
          <span className="text-amber-400 text-sm font-black uppercase tracking-[0.4em] mb-6 animate-pulse">Global Community Feed</span>
          <h2 className="text-white text-6xl font-black max-w-2xl mb-8 leading-tight drop-shadow-2xl">The Shared Ancestral Vault</h2>
          <div className="flex gap-6">
            <button 
              onClick={() => setView(View.Library)}
              className="bg-amber-600 text-white px-10 py-4 rounded-full font-black hover:bg-white hover:text-amber-600 transition-all shadow-xl active:scale-95"
            >
              Explore Shared Vault
            </button>
            <button 
              onClick={() => setView(View.Contribute)}
              className="bg-white/10 backdrop-blur-md border-2 border-white/20 text-white px-10 py-4 rounded-full font-black hover:bg-white/20 transition-all active:scale-95"
            >
              Archive Your Voice
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
        <section className="xl:col-span-2 space-y-8">
          <div className="flex justify-between items-end px-2">
            <div>
              <h3 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Recent Global Contributions</h3>
              <p className={`font-black uppercase text-[10px] tracking-widest mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-600'}`}>Real-time preservation from across the world</p>
            </div>
            <button onClick={() => setView(View.Library)} className="text-amber-600 dark:text-amber-500 text-sm font-black flex items-center gap-3 hover:gap-5 transition-all">
              View All Archives <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {recentStories.length > 0 ? recentStories.map((story) => (
              <div 
                key={story.id} 
                onClick={() => setView(View.Library)}
                className={`flex gap-6 p-6 rounded-[40px] border shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
              >
                <div className="w-24 h-24 rounded-3xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800 shadow-inner relative">
                  {story.coverImageBase64 ? (
                    <img src={story.coverImageBase64} alt="Cover" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-amber-900 flex items-center justify-center text-amber-500">
                      <i className={`fa-solid ${getStoryIcon(story.sourceType)} text-3xl`}></i>
                    </div>
                  )}
                  <div className="absolute top-1 right-1 bg-amber-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-[8px] shadow-lg">
                    <i className={`fa-solid ${getStoryIcon(story.sourceType)}`}></i>
                  </div>
                </div>
                <div className="flex-1 space-y-2 min-w-0">
                  <h4 className={`font-black text-xl group-hover:text-amber-600 transition-colors truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{story.title}</h4>
                  <p className={`text-sm line-clamp-2 leading-relaxed italic font-serif ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                    "{story.originalText.slice(0, 100)}..."
                  </p>
                  <div className="flex items-center gap-4 mt-4">
                    <span className="text-[10px] px-3 py-1 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-500 rounded-full font-black uppercase tracking-widest">
                      {story.culture}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-tighter ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{new Date(story.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className={`col-span-2 p-20 border-4 border-dashed rounded-[50px] text-center space-y-6 ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-300 bg-white'}`}>
                 <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400 dark:text-slate-700">
                   <i className="fa-solid fa-microphone-lines text-4xl"></i>
                 </div>
                 <div className="space-y-2">
                    <p className={`font-black text-xl ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>The Global Vault is Quiet</p>
                    <button onClick={() => setView(View.Contribute)} className="text-amber-600 font-black underline hover:text-amber-700">Record First Shared Memory</button>
                 </div>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-8">
          <h3 className={`text-3xl font-black px-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Vault Analytics</h3>
          <div className="bg-amber-900 dark:bg-amber-950 rounded-[50px] p-10 text-white relative overflow-hidden shadow-2xl h-full min-h-[450px] group border-4 border-amber-800/20">
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-[2000ms]">
              <i className="fa-solid fa-globe text-9xl -rotate-12"></i>
            </div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="bg-amber-400/20 w-16 h-16 rounded-3xl flex items-center justify-center mb-10 shadow-xl">
                <i className="fa-solid fa-people-group text-amber-400 text-2xl"></i>
              </div>
              <h4 className="text-2xl font-black mb-6">Shared Identity</h4>
              <p className="text-amber-50/90 leading-relaxed mb-8 text-lg font-bold">
                By sharing our stories, we create a global tapestry of human history. This app enables every user to witness the cinematic legacy of others, fostering universal understanding.
              </p>
              <div className="p-6 bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 mb-10 italic text-base leading-relaxed text-amber-50 font-bold">
                "Our voices are stronger when they are shared."
              </div>
              <button 
                onClick={() => setView(View.Library)}
                className="mt-auto w-full bg-amber-400 text-amber-950 font-black py-5 rounded-[24px] flex items-center justify-center gap-3 hover:bg-white hover:scale-105 transition-all active:scale-95 shadow-xl"
              >
                Join the Circle <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomeView;
