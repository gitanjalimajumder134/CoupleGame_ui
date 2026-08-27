import React from 'react';
import { Check } from 'lucide-react';

const RELATIONSHIPS = [
  { id: 'couple', title: 'Couple', emoji: '❤️' },
  { id: 'spouse', title: 'Spouse', emoji: '💍' },
  { id: 'crush', title: 'Crush', emoji: '💘' },
  { id: 'new_date', title: 'New Date', emoji: '✨' },
  { id: 'long_distance', title: 'Long Distance', emoji: '✈️' },
];

export default function RelationshipSelector({ selected, onSelect }) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {RELATIONSHIPS.map((rel) => {
          const isSelected = selected === rel.id;

          return (
            <button
              key={rel.id}
              onClick={() => onSelect(rel.id)}
              className={`relative flex flex-col items-center justify-center text-center p-4 sm:p-5 rounded-xl border transition-all duration-200 group
                ${isSelected
                  ? 'bg-[#54152A]/50 border-[#E6C88A]/60 shadow-[0_0_15px_rgba(230,200,138,0.12)]'
                  : 'bg-[#1a0c14]/60 border-[#54152A]/40 hover:bg-[#54152A]/20 hover:border-[#E6C88A]/20'
                }`}
            >
              <span className="text-2xl sm:text-3xl mb-3">{rel.emoji}</span>
              <span className={`font-serif text-sm sm:text-base leading-snug whitespace-normal break-words ${isSelected ? 'text-white' : 'text-white/70'}`}>
                {rel.title}
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
