
import React, { useState, useRef, useEffect } from 'react';
import { getCulturalGuideResponse } from '../services/gemini';
import { ChatMessage } from '../types';

const HeritageGuide: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', content: "Greetings! I am your Heritage AI guide. Ask me anything about cultural traditions, linguistic roots, or the secret history of world dialects. How can I assist you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const response = await getCulturalGuideResponse(userMsg, messages);
      setMessages(prev => [...prev, { role: 'model', content: response || "The ancestors are quiet right now. Please try again shortly." }]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 h-[calc(100vh-80px)] flex flex-col animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white">Heritage AI Guide</h2>
          <p className="text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Conversational anthropology expertise</p>
        </div>
        <div className="flex -space-x-3">
           {[1,2,3].map(i => (
             <div key={i} className="w-10 h-10 rounded-full border-4 border-white dark:border-slate-800 bg-slate-100 overflow-hidden shadow-sm">
                <img src={`https://picsum.photos/seed/anthro${i}/100`} className="w-full h-full object-cover" alt="Expert" />
             </div>
           ))}
           <div className="w-10 h-10 rounded-full border-4 border-white dark:border-slate-800 bg-amber-600 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">+1k</div>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-10 space-y-8 scroll-smooth custom-scrollbar"
        >
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-4 max-w-[75%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center text-lg ${
                  m.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-amber-100 text-amber-700'
                }`}>
                  <i className={`fa-solid ${m.role === 'user' ? 'fa-user' : 'fa-feather-pointed'}`}></i>
                </div>
                <div className={`p-6 rounded-[32px] text-base leading-relaxed font-medium ${
                  m.role === 'user' 
                    ? 'bg-amber-600 text-white rounded-tr-none shadow-xl' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-700'
                }`}>
                  {m.content}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                  <i className="fa-solid fa-feather-pointed animate-pulse"></i>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-[32px] rounded-tl-none flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Archivist is researching...</span>
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="max-w-4xl mx-auto relative flex items-center gap-4">
            <input 
              type="text" 
              placeholder="Ask about cultural history, Patois origins, or African heritage..." 
              className="flex-1 p-6 pr-20 rounded-[32px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-amber-500 shadow-xl text-lg font-bold text-slate-800 dark:text-white"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="absolute right-3 w-14 h-14 bg-amber-600 text-white rounded-[24px] flex items-center justify-center disabled:opacity-50 transition-all hover:bg-amber-700 shadow-lg shadow-amber-200 active:scale-95"
            >
              <i className="fa-solid fa-paper-plane text-xl"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeritageGuide;
