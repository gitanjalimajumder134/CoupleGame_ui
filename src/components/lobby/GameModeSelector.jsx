import React from 'react';
import { Globe, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GameModeSelector({ onSelect }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto space-y-8"
    >
      <div className="text-center space-y-2">
        <h2 className="text-3xl sm:text-4xl font-serif text-[#E6C88A] tracking-wider">How Do You Want To Play?</h2>
        <p className="text-white/60 text-sm uppercase tracking-widest font-light">Select your experience</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* ONLINE MODE */}
        <button 
          onClick={() => onSelect('online')}
          className="group relative overflow-hidden bg-[#241018]/80 backdrop-blur-xl border border-[#54152A] rounded-2xl p-8 hover:border-[#E6C88A]/50 hover:shadow-[0_0_30px_rgba(230,200,138,0.15)] transition-all duration-500 text-left"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#54152A]/20 blur-[40px] rounded-full group-hover:bg-[#E6C88A]/10 transition-colors"></div>
          
          <Globe className="w-10 h-10 text-[#E6C88A] mb-6 group-hover:scale-110 transition-transform duration-500" />
          
          <h3 className="text-2xl font-serif text-white mb-2">ONLINE GAME</h3>
          <p className="text-[#E6C88A]/70 text-sm font-light">Play with friends from anywhere in the world.</p>
          
          <div className="mt-8 flex space-x-2">
            <span className="text-[10px] uppercase tracking-widest text-white/40 border border-white/10 px-3 py-1 rounded-full group-hover:border-[#E6C88A]/30 group-hover:text-[#E6C88A]/80 transition-colors">Create</span>
            <span className="text-[10px] uppercase tracking-widest text-white/40 border border-white/10 px-3 py-1 rounded-full group-hover:border-[#E6C88A]/30 group-hover:text-[#E6C88A]/80 transition-colors">Join</span>
          </div>
        </button>

        {/* OFFLINE MODE */}
        <button 
          onClick={() => onSelect('local')}
          className="group relative overflow-hidden bg-[#241018]/80 backdrop-blur-xl border border-[#54152A] rounded-2xl p-8 hover:border-[#E6C88A]/50 hover:shadow-[0_0_30px_rgba(230,200,138,0.15)] transition-all duration-500 text-left"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#54152A]/20 blur-[40px] rounded-full group-hover:bg-[#E6C88A]/10 transition-colors"></div>
          
          <Smartphone className="w-10 h-10 text-[#E6C88A] mb-6 group-hover:scale-110 transition-transform duration-500" />
          
          <h3 className="text-2xl font-serif text-white mb-2">OFFLINE GAME</h3>
          <p className="text-[#E6C88A]/70 text-sm font-light">Play together on the same device, face to face.</p>
          
          <div className="mt-8 flex space-x-2">
            <span className="text-[10px] uppercase tracking-widest text-white/40 border border-white/10 px-3 py-1 rounded-full group-hover:border-[#E6C88A]/30 group-hover:text-[#E6C88A]/80 transition-colors">Pass & Play</span>
          </div>
        </button>
      </div>
    </motion.div>
  );
}
