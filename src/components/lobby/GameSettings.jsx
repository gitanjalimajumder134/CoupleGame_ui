import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export default function GameSettings({ settings, onUpdateSettings }) {
  const { timerDuration = 0, skipAllowed = true, turnOrder = 'random' } = settings;

  const update = (key, val) => onUpdateSettings({ ...settings, [key]: val });

  return (
    <div className="w-full space-y-4">

      {/* TIMER ROW */}
      <div className="bg-[#1a0c14]/80 border border-[#54152A]/40 rounded-xl p-4 flex flex-col space-y-3">
        <span className="text-white/70 text-xs uppercase font-bold tracking-wider">Timer</span>
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: 0, label: 'No Time' },
            { id: 15, label: '15s' },
            { id: 30, label: '30s' },
            { id: 60, label: '60s' }
          ].map(opt => {
            const isSelected = timerDuration === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => update('timerDuration', opt.id)}
                className={`relative flex items-center justify-center p-2 rounded-lg border transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#54152A]/50 border-[#E6C88A]/60 shadow-[0_0_10px_rgba(230,200,138,0.12)]'
                    : 'bg-black/40 border-[#54152A]/30 hover:bg-[#54152A]/20 hover:border-[#E6C88A]/20'
                }`}
              >
                <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center ${isSelected ? 'text-[#E6C88A]' : 'text-white/40'}`}>
                  {isSelected && <Check className="w-3 h-3 inline mr-1 mb-0.5" />}
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TURN ORDER ROW */}
      <div className="bg-[#1a0c14]/80 border border-[#54152A]/40 rounded-xl p-4 flex flex-col space-y-3">
        <span className="text-white/70 text-xs uppercase font-bold tracking-wider">Turn Order</span>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'random', label: 'Random' },
            { id: 'alternate', label: 'Alternate' }
          ].map(opt => {
            const isSelected = turnOrder === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => update('turnOrder', opt.id)}
                className={`relative flex items-center justify-center p-2 rounded-lg border transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#54152A]/50 border-[#E6C88A]/60 shadow-[0_0_10px_rgba(230,200,138,0.12)]'
                    : 'bg-black/40 border-[#54152A]/30 hover:bg-[#54152A]/20 hover:border-[#E6C88A]/20'
                }`}
              >
                <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center ${isSelected ? 'text-[#E6C88A]' : 'text-white/40'}`}>
                  {isSelected && <Check className="w-3 h-3 inline mr-1 mb-0.5" />}
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ALLOW SKIP ROW */}
      <div className="bg-[#1a0c14]/80 border border-[#54152A]/40 rounded-xl p-4 flex items-center justify-between">
        <span className="text-white/70 text-xs uppercase font-bold tracking-wider">Allow Skip</span>
        <button
          onClick={() => update('skipAllowed', !skipAllowed)}
          className={`w-12 h-6 rounded-full transition-all relative ${
            skipAllowed ? 'bg-[#E6C88A]' : 'bg-white/10'
          }`}
        >
          <motion.div
            animate={{ x: skipAllowed ? 24 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
          />
        </button>
      </div>
      
    </div>
  );
}
