import React from 'react';
import { Check } from 'lucide-react';

const CATEGORIES = [
  { id: 'romantic', title: 'Romantic', emoji: '❤️', desc: 'Sweet & meaningful moments' },
  { id: 'flirty', title: 'Flirty', emoji: '💋', desc: 'Playful questions & chemistry' },
  { id: 'dares', title: 'Dares', emoji: '🔥', desc: 'Fun challenges for both' },
  { id: 'truth', title: 'Truth', emoji: '👀', desc: 'Honest & unexpected answers' },
  { id: 'naughty', title: 'Naughty', emoji: '😈', desc: 'Turn up the intensity' },
];

export default function CategorySelector({ selectedCategories, toggleCategory }) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategories.includes(cat.id);

          return (
            <button
              key={cat.id}
              onClick={() => toggleCategory(cat.id)}
              className={`relative flex flex-col items-center justify-center text-center p-4 sm:p-5 rounded-xl border transition-all duration-200
                ${isSelected
                  ? 'bg-[#54152A]/50 border-[#E6C88A]/60 shadow-[0_0_15px_rgba(230,200,138,0.12)]'
                  : 'bg-[#1a0c14]/60 border-[#54152A]/40 hover:bg-[#54152A]/20 hover:border-[#E6C88A]/20'
                }`}
            >
              <span className="text-2xl sm:text-3xl mb-3">{cat.emoji}</span>
              <span className={`font-serif text-sm sm:text-base whitespace-normal break-words leading-snug mb-1.5 ${isSelected ? 'text-white' : 'text-white/70'}`}>
                {cat.title}
              </span>
              <span className="text-[10px] sm:text-xs text-white/40 whitespace-normal break-words leading-tight px-1">
                {cat.desc}
              </span>
              
              {isSelected && (
                <div className="absolute top-2 right-2 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#E6C88A] flex items-center justify-center shadow-md">
                  <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black" strokeWidth={4} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
