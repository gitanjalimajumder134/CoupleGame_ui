import React from 'react';

const INTIMACY_LEVELS = [
  { id: 'sparks', title: 'Sparks', emoji: '✨' },
  { id: 'flames', title: 'Flames', emoji: '🔥' },
  { id: 'wildfire', title: 'Wildfire', emoji: '🌋' },
];

export default function IntimacySelector({ selectedCategories = [], toggleCategory }) {
  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {INTIMACY_LEVELS.map((level) => {
          const isSelected = selectedCategories.includes(level.id);

          return (
            <button
              key={level.id}
              onClick={() => toggleCategory(level.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-3 sm:px-4 rounded-full border transition-all duration-300
                ${isSelected
                  ? 'bg-[#54152A]/80 border-[#E6C88A] shadow-[0_0_15px_rgba(230,200,138,0.2)]'
                  : 'bg-[#1a0c14]/60 border-[#54152A]/40 hover:bg-[#54152A]/40 hover:border-[#E6C88A]/40 text-white/50'
                }`}
            >
              <span className="text-sm sm:text-base">{level.emoji}</span>
              <span className={`font-serif text-xs sm:text-sm tracking-wide ${isSelected ? 'text-white font-bold' : ''}`}>
                {level.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
