
import React, { useState } from 'react';
import { translateDialect } from '../services/gemini';
import { TranslationResult } from '../types';

const TranslateTool: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [dialect, setDialect] = useState('Jamaican Patois');

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await translateDialect(inputText, dialect);
      setResult(data);
    } catch (err) {
      console.error(err);
      setError("The Agent encountered a linguistic hurdle. Please try again with different phrasing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 flex flex-col h-full animate-fadeIn pb-32">
      <div className="flex items-center justify-between mb-10">
        <div>
           <h2 className="text-5xl font-black text-slate-800 dark:text-white">Dialect Agent</h2>
           <p className="text-slate-600 dark:text-slate-500 font-black uppercase text-[10px] tracking-[0.2em] mt-1">Linguistic Etymology Explorer</p>
        </div>
        <div className="flex gap-4 items-center bg-white dark:bg-slate-900 p-2 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest pl-4">Source</span>
          <select 
            value={dialect}
            onChange={(e) => setDialect(e.target.value)}
            className="text-sm font-black bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-6 py-3 rounded-2xl outline-none border-none focus:ring-2 focus:ring-amber-500 transition-all cursor-pointer"
          >
            <option>Jamaican Patois</option>
            <option>Trinidadian Slang</option>
            <option>Nigerian Pidgin</option>
            <option>Louisiana Creole</option>
            <option>Haitian Kreyòl</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 flex-1">
        {/* INPUT COLUMN */}
        <div className="space-y-8 flex flex-col">
          <div className="relative flex-1 group">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Enter text in ${dialect}...`}
              className="w-full h-full p-10 rounded-[50px] bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 focus:border-amber-400 dark:focus:border-amber-500 outline-none transition-all resize-none shadow-sm text-2xl font-bold leading-relaxed placeholder:text-slate-300 dark:placeholder:text-slate-800 text-slate-800 dark:text-white"
            />
            {inputText && (
              <button 
                onClick={() => { setInputText(''); setResult(null); setError(null); }}
                className="absolute top-10 right-10 text-slate-400 hover:text-red-500 transition-colors"
              >
                <i className="fa-solid fa-circle-xmark text-3xl"></i>
              </button>
            )}
          </div>

          <button 
            onClick={handleTranslate}
            disabled={loading || !inputText}
            className="w-full bg-amber-600 text-white font-black py-8 rounded-[32px] shadow-2xl shadow-amber-600/20 active:scale-[0.98] hover:bg-amber-700 transition-all disabled:opacity-50 flex items-center justify-center gap-6 text-xl"
          >
            {loading ? (
              <>
                <div className="flex gap-2 items-center">
                  <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
                  <div className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                </div>
                <span>Decoding Ancestry...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-wand-magic-sparkles"></i>
                Map Heritage
              </>
            )}
          </button>

          {error && (
            <div className="p-6 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-3xl text-sm font-black border border-red-100 dark:border-red-900/20 flex items-center gap-4 animate-shake">
              <i className="fa-solid fa-triangle-exclamation text-xl"></i>
              {error}
            </div>
          )}
        </div>

        {/* RESULTS COLUMN */}
        <div className="overflow-y-auto pr-4 space-y-10 custom-scrollbar h-full min-h-[500px]">
          {result ? (
            <div className="space-y-10 animate-fadeIn">
              <div className="p-10 bg-white dark:bg-slate-900 rounded-[50px] border border-amber-200 dark:border-amber-900/20 shadow-xl space-y-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 dark:bg-amber-900/10 rounded-full -translate-y-32 translate-x-32 transition-transform duration-1000 group-hover:scale-110"></div>
                <div className="relative z-10 space-y-6">
                  <h4 className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-[0.3em]">Fluent Interpretation</h4>
                  <p className="text-3xl text-slate-800 dark:text-white leading-tight font-black">{result.translated}</p>
                  <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                    <h5 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-3 tracking-widest">Syntax Etymology</h5>
                    <p className="text-lg text-slate-600 dark:text-slate-300 italic leading-relaxed font-serif">"{result.literal}"</p>
                  </div>
                </div>
              </div>

              {result.slangExplanations.length > 0 && (
                <div className="space-y-6">
                  <h4 className="text-2xl font-black flex items-center gap-4 text-slate-800 dark:text-white px-4">
                    <i className="fa-solid fa-book-open text-amber-500"></i>
                    Slang Lexicon
                  </h4>
                  <div className="grid grid-cols-1 gap-6">
                    {result.slangExplanations.map((item, idx) => (
                      <div key={idx} className="p-8 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-400 dark:hover:border-amber-900 transition-all flex gap-6 group/item">
                        <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0 text-amber-700 dark:text-amber-500 text-2xl font-black group-hover/item:rotate-12 transition-transform">?</div>
                        <div>
                          <span className="font-black text-amber-900 dark:text-amber-500 text-xl">"{item.term}"</span>
                          <p className="text-base text-slate-700 dark:text-slate-400 mt-2 leading-relaxed font-bold">{item.explanation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-10 bg-slate-900 dark:bg-black rounded-[50px] text-amber-50 shadow-2xl relative overflow-hidden group">
                 <i className="fa-solid fa-scroll absolute -bottom-10 -right-10 text-[200px] opacity-5 -rotate-12 group-hover:scale-110 transition-transform duration-[2000ms]"></i>
                 <div className="relative z-10 space-y-6">
                    <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-[0.4em]">Heritage Insight</h4>
                    <p className="text-2xl leading-relaxed opacity-90 italic font-serif group-hover:opacity-100 transition-opacity">"{result.culturalContext}"</p>
                 </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-20 opacity-40 dark:opacity-20 space-y-8">
               <div className="w-40 h-40 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center shadow-inner">
                  <i className="fa-solid fa-microscope text-6xl text-slate-400"></i>
               </div>
               <div className="max-w-sm space-y-3">
                  <h4 className="text-2xl font-black text-slate-600">Awaiting Input</h4>
                  <p className="text-sm font-bold uppercase tracking-widest leading-loose text-slate-500">Enter heritage text to activate the Agent</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TranslateTool;
