import React from 'react';
import { Check } from 'lucide-react';

const ITEMS = [
  { id: 'ice', title: 'Ice', emoji: '🧊' },
  { id: 'chocolate', title: 'Chocolate', emoji: '🍫' },
  { id: 'rope', title: 'Rope', emoji: '🪢' },
  { id: 'handcuff', title: 'Handcuff', emoji: '⛓️' },
  { id: 'blindfold', title: 'Blindfold', emoji: '🙈' },
  { id: 'alcohol', title: 'Alcohol', emoji: '🥂' },
  { id: 'dice', title: 'Dice', emoji: '🎲' },
  { id: 'lotion', title: 'Lotion', emoji: '💧' },
  { id: 'candle', title: 'Candle', emoji: '🕯️' },
  { id: 'none', title: 'No Objects', emoji: '🚫' },
];

export default function ItemSelector({ selectedItems, toggleItem }) {
  return (
    <div className="w-full space-y-3">
      {/* 5 columns on desktop, 3 on tablet, 2 on mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {ITEMS.map((item) => {
          const isSelected = selectedItems.includes(item.id);

          return (
            <button
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`relative flex flex-col items-center justify-center text-center p-3 sm:p-4 rounded-xl border transition-all duration-200
                ${isSelected
                  ? 'bg-[#54152A]/50 border-[#E6C88A]/60 shadow-[0_0_10px_rgba(230,200,138,0.12)]'
                  : 'bg-[#1a0c14]/60 border-[#54152A]/40 hover:bg-[#54152A]/20 hover:border-[#E6C88A]/20'
                }`}
            >
              <span className="text-2xl mb-2">{item.emoji}</span>
              <span className={`text-[10px] sm:text-xs uppercase font-bold tracking-wider whitespace-normal break-words leading-tight ${isSelected ? 'text-white' : 'text-white/60'}`}>
                {item.title}
              </span>
              
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#E6C88A] flex items-center justify-center shadow-md">
                  <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-black" strokeWidth={4} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
