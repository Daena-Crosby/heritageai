
import React, { useState } from 'react';
import { Story } from '../types';
import StoryDetailView from './StoryDetailView';

interface LibraryViewProps {
  stories: Story[];
  onDelete: (id: string) => void;
}

const LibraryView: React.FC<LibraryViewProps> = ({ stories, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  const filters = ['All', 'Folklore', 'Personal Story', 'History', 'Ancestral Wisdom'];

  const filteredStories = stories.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.culture.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'All' || s.tags.includes(activeFilter);
    return matchesSearch && matchesFilter;
  });

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent opening the story
    if (confirm("Are you sure you want to remove this artifact from the permanent archive?")) {
      onDelete(id);
    }
  };

  if (selectedStory) {
    return <StoryDetailView story={selectedStory} onBack={() => setSelectedStory(null)} />;
  }

  return (
    <div className="p-10 space-y-10 animate-fadeIn bg-inherit">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-5xl font-black text-slate-900 dark:text-white">Heritage Vault</h2>
          <p className="text-slate-700 dark:text-slate-400 text-lg font-medium">A permanent collection of global voices.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400"></i>
            <input 
              type="text" 
              placeholder="Search traditions..." 
              className={`w-full sm:w-80 pl-14 pr-6 py-4 rounded-3xl border outline-none shadow-sm transition-colors ${
                stories.length > 0 
                  ? 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-white text-slate-900' 
                  : 'bg-slate-100 border-transparent'
              }`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className={`flex gap-2 p-1.5 rounded-2xl ${
            stories.length > 0 ? 'bg-slate-200/50 dark:bg-slate-900' : 'bg-transparent'
          }`}>
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                  activeFilter === f ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                {f.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredStories.length > 0 ? filteredStories.map(story => (
          <button 
            key={story.id} 
            onClick={() => setSelectedStory(story)}
            className="flex flex-col text-left group transition-all relative"
          >
            <div className="aspect-[3/4] w-full rounded-[40px] overflow-hidden mb-6 shadow-xl group-hover:shadow-2xl group-hover:-translate-y-2 transition-all relative border-4 border-transparent group-hover:border-amber-400/20">
                {story.coverImageBase64 ? (
                  <img src={story.coverImageBase64} className="w-full h-full object-cover" alt="Cover" />
                ) : (
                   <div className="w-full h-full bg-amber-900 flex items-center justify-center text-amber-500">
                     <i className="fa-solid fa-book text-6xl"></i>
                   </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full">{story.tags[0]}</span>
                </div>
                
                {/* DELETE BUTTON */}
                <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => handleDelete(e, story.id)}
                    className="w-10 h-10 bg-red-600/90 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
                    title="Remove artifact"
                  >
                    <i className="fa-solid fa-trash-can text-sm"></i>
                  </button>
                </div>
            </div>
            <h3 className="font-bold text-xl text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors truncate px-2">{story.title}</h3>
            <div className="flex items-center gap-2 px-2 mt-1">
               <span className="text-xs text-slate-700 dark:text-slate-400 font-bold">{story.author}</span>
               <div className="w-1 h-1 bg-amber-500 rounded-full"></div>
               <span className="text-[10px] text-amber-700 dark:text-amber-500 font-black uppercase tracking-widest">{story.culture}</span>
            </div>
          </button>
        )) : (
          <div className="col-span-full py-40 text-center space-y-6 opacity-30 dark:opacity-20">
            <i className="fa-solid fa-box-open text-8xl text-slate-900 dark:text-white"></i>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest">Vault Empty</h4>
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryView;
