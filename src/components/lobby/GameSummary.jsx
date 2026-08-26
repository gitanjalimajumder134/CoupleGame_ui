import React from 'react';
import { Heart, ArrowLeft } from 'lucide-react';

const RELATIONSHIP_MAP = {
  couple: '❤️ Couple',
  spouse: '💍 Spouse',
  crush: '💘 Crush',
  new_date: '✨ New Date',
};

export default function GameSummary({
  gameMode,
  selectedGame,
  players,
  relationship,
  categories,
  items,
  settings,
  onStart,
  onEditStep,
  onBack
}) {
  const canStart = gameMode === 'online' ? true : (players.length >= 2 && players[1]?.name);

  const renderSection = (title, step, children) => (
    <div className="py-2.5 border-b border-[#54152A]/40 last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <h4 className="text-[10px] text-white/40 uppercase tracking-widest font-bold">{title}</h4>
        <button 
          onClick={() => onEditStep(step)}
          className="text-[9px] text-[#E6C88A]/70 uppercase tracking-wider hover:text-[#E6C88A] transition-colors bg-[#E6C88A]/10 px-2 py-0.5 rounded border border-[#E6C88A]/20"
        >
          Edit
        </button>
      </div>
      <div className="text-sm font-serif text-white/90">
        {children}
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-4">
      
      <div className="text-center mb-4">
        <h2 className="text-2xl font-serif text-white">Your Game ❤️</h2>
        <p className="text-white/40 text-[10px] mt-1.5 uppercase tracking-widest">Everything looks ready. Here's your setup.</p>
      </div>

      <div className="bg-[#1a0c14]/80 border border-[#54152A]/60 rounded-2xl p-4 sm:p-5 mb-6 shadow-[0_0_20px_rgba(84,21,42,0.2)]">
        
        {renderSection("Players", 1, 
          <div className="flex flex-wrap items-center gap-y-1.5 gap-x-2 mt-1">
             <div className="flex items-center">
               <span className="text-sm mr-1.5">👤</span>
               <span className="text-white text-sm">{players[0]?.name || 'Player 1'}</span>
               <span className="text-[8px] uppercase tracking-widest text-[#E6C88A] bg-[#E6C88A]/10 px-1.5 py-0.5 rounded ml-2">Host</span>
             </div>
             <span className="text-white/40 text-[10px] uppercase font-bold tracking-widest mx-1">vs</span>
             <div className="flex items-center">
               <span className="text-sm mr-1.5">👤</span>
               <span className="text-white text-sm">{players[1]?.name || 'Player 2'}</span>
             </div>
          </div>
        )}

        {selectedGame !== 'dice' && (
          <>
            {renderSection("Relationship", 1, 
              <span className="mt-1 block text-sm">{RELATIONSHIP_MAP[relationship] || 'Not selected'}</span>
            )}

            {renderSection("Mood", 2, 
               categories.length > 0
                 ? categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(' · ')
                 : <span className="text-white/30 italic">None selected</span>
            )}

            {renderSection("Available Items", 2, 
               items.length > 0
                 ? items.map(i => i === 'none' ? '🚫 No Objects' : i.charAt(0).toUpperCase() + i.slice(1)).join(' · ')
                 : <span className="text-white/30 italic">None selected</span>
            )}

            {renderSection("Intimacy Progression", 2,
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider">
                 <span className="text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded">✨ Sparks</span>
                 <span className="text-white/30">→</span>
                 <span className="text-orange-500 bg-orange-500/10 px-2 py-1 rounded">🔥 Flames</span>
                 <span className="text-white/30">→</span>
                 <span className="text-red-500 bg-red-500/10 px-2 py-1 rounded">🌋 Wildfire</span>
              </div>
            )}
          </>
        )}

        {renderSection("Game Setup", 2, 
          <div className="flex flex-wrap gap-4 mt-1 font-sans text-xs text-white/70">
             <div className="flex flex-col"><span className="text-[9px] uppercase tracking-wider text-white/30 mb-0.5">Timer</span>{settings.timerDuration > 0 ? settings.timerDuration + 's' : 'No Time'}</div>
             <div className="flex flex-col"><span className="text-[9px] uppercase tracking-wider text-white/30 mb-0.5">Turn Order</span>{settings.turnOrder.charAt(0).toUpperCase() + settings.turnOrder.slice(1)}</div>
             <div className="flex flex-col"><span className="text-[9px] uppercase tracking-wider text-white/30 mb-0.5">Allow Skip</span>{settings.skipAllowed ? 'On' : 'Off'}</div>
          </div>
        )}

      </div>

      {/* BOTTOM NAVIGATION */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onBack}
          className="bg-[#1a0c14]/80 border border-[#54152A]/60 text-white/60 hover:text-white hover:bg-[#54152A]/40 px-4 py-4 rounded-xl font-bold uppercase tracking-widest transition-all flex items-center justify-center shrink-0"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span className="text-[10px]">Back</span>
        </button>

        <button
          onClick={onStart}
          disabled={!canStart}
          className={`flex-1 relative overflow-hidden py-4 rounded-xl font-serif text-lg tracking-[0.15em] uppercase font-bold transition-all duration-500 group shadow-lg ${
            canStart
              ? 'bg-gradient-to-r from-[#54152A] to-[#7A1F3D] border border-[#E6C88A]/50 text-[#E6C88A] shadow-[0_0_20px_rgba(84,21,42,0.4)] hover:shadow-[0_0_30px_rgba(230,200,138,0.2)] hover:border-[#E6C88A]'
              : 'bg-[#1a0c14] border border-[#54152A]/30 text-white/20 cursor-not-allowed'
          }`}
        >
          {canStart && (
            <div className="absolute inset-0 bg-[#E6C88A] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-out z-0"></div>
          )}
          <span className={`relative z-10 flex items-center justify-center gap-2 ${canStart ? 'group-hover:text-black' : ''} transition-colors duration-300`}>
            <Heart className="w-4 h-4" />
            <span>{gameMode === 'online' ? 'Create Room' : 'Start Game'}</span>
          </span>
        </button>
      </div>
      
    </div>
  );
}
