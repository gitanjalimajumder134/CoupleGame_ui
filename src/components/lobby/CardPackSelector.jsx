import React from 'react';
import { motion } from 'framer-motion';

const PACKS = [
  { id: 'classic', title: 'Classic Romance', desc: 'The original pack to get things started.', count: 42, intensity: 'Sweet' },
  { id: 'midnight', title: 'Midnight Confessions', desc: 'Questions that get a little more interesting.', count: 50, intensity: 'Flirty' },
  { id: 'date_night', title: 'Date Night', desc: 'Perfect for dinner and drinks.', count: 30, intensity: 'Spicy' },
  { id: 'after_dark', title: 'After Dark', desc: 'Not for the faint of heart.', count: 60, intensity: 'Wild' },
];

export default function CardPackSelector({ selectedPacks, togglePack, onNext }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col items-center justify-start w-full max-w-4xl mx-auto pt-4 space-y-8 h-full"
    >
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-serif text-[#E6C88A] tracking-wider">Choose Your Cards</h2>
        <p className="text-white/60 text-xs uppercase tracking-widest font-light">Select the packs you want to play with</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full px-4 overflow-y-auto max-h-[50vh] custom-scrollbar pb-8">
        {PACKS.map((pack) => {
          const isSelected = selectedPacks.includes(pack.id);
          
          return (
            <button
              key={pack.id}
              onClick={() => togglePack(pack.id)}
              className={`relative flex items-center p-6 rounded-2xl border transition-all duration-300 text-left
                ${isSelected 
                  ? 'bg-[#54152A]/40 border-[#E6C88A] shadow-[0_0_20px_rgba(230,200,138,0.15)]' 
                  : 'bg-[#241018]/60 border-transparent hover:bg-[#54152A]/20 hover:border-[#E6C88A]/30'
                }`}
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className={`font-serif text-lg ${isSelected ? 'text-white' : 'text-white/80'}`}>{pack.title}</h4>
                  <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${isSelected ? 'border-[#E6C88A]/50 text-[#E6C88A]' : 'border-white/20 text-white/50'}`}>
                    {pack.intensity}
                  </span>
                </div>
                <p className={`text-[10px] leading-relaxed mb-3 ${isSelected ? 'text-[#E6C88A]/80' : 'text-white/40'}`}>
                  {pack.desc}
                </p>
                <div className={`text-[10px] font-bold uppercase ${isSelected ? 'text-white/80' : 'text-white/30'}`}>
                  {pack.count} Cards
                </div>
              </div>

              {isSelected && (
                <div className="ml-4 text-[#E6C88A]">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="w-full max-w-sm mx-auto">
        <button 
          onClick={onNext}
          disabled={selectedPacks.length === 0}
          className={`w-full py-4 rounded-xl font-serif text-lg tracking-widest transition-all duration-300 ${
            selectedPacks.length > 0 
              ? 'bg-[#54152A] text-[#E6C88A] border border-[#E6C88A]/30 shadow-[0_0_20px_rgba(84,21,42,0.6)] hover:bg-[#E6C88A] hover:text-black' 
              : 'bg-[#241018] text-white/20 border border-[#54152A]/30 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
}
