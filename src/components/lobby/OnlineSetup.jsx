import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, LogIn, Users } from 'lucide-react';

export default function OnlineSetup({ 
  onHostClick, 
  onJoinRoom, 
  joinCode, 
  setJoinCode, 
  visiblePartners, 
  onInvite 
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col items-center justify-start w-full max-w-3xl mx-auto pt-4 space-y-8"
    >
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-serif text-[#E6C88A] tracking-wider">Virtual Heat</h2>
        <p className="text-white/60 text-xs uppercase tracking-widest font-light">Play long distance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* CREATE ROOM */}
        <button 
          onClick={onHostClick}
          className="group bg-[#241018]/80 backdrop-blur-xl border border-[#54152A] rounded-2xl p-8 flex flex-col items-center justify-center hover:border-[#E6C88A]/50 hover:shadow-[0_0_30px_rgba(230,200,138,0.15)] transition-all duration-300"
        >
          <PlusCircle className="w-12 h-12 text-[#E6C88A] mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-xl font-serif text-white mb-2">Create Room</h3>
          <p className="text-[#E6C88A]/60 text-[10px] uppercase tracking-widest text-center">Host a private game</p>
        </button>

        {/* JOIN ROOM */}
        <div className="bg-[#241018]/80 backdrop-blur-xl border border-[#54152A] rounded-2xl p-8 flex flex-col justify-center space-y-4">
          <div className="text-center">
            <h3 className="text-xl font-serif text-white mb-2">Join Game</h3>
            <p className="text-[#E6C88A]/60 text-[10px] uppercase tracking-widest text-center">Have a code?</p>
          </div>
          
          <div className="flex space-x-3">
            <input 
              type="text" 
              maxLength="4" 
              placeholder="CODE" 
              value={joinCode} 
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())} 
              className="w-full bg-black/50 border border-[#54152A] rounded-xl text-center text-white font-mono text-xl tracking-[0.3em] focus:border-[#E6C88A] outline-none transition-colors uppercase" 
            />
            <button 
              onClick={onJoinRoom} 
              className="bg-[#54152A] text-[#E6C88A] p-4 rounded-xl hover:bg-[#E6C88A] hover:text-black transition-colors"
            >
              <LogIn className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* DIRECT INVITES */}
      <div className="w-full bg-[#241018]/60 backdrop-blur-xl border border-[#54152A] rounded-2xl p-6">
        <h3 className="text-[#E6C88A] font-serif text-lg mb-4 flex items-center border-b border-[#54152A] pb-3">
          <Users className="w-5 h-5 mr-3" /> Connected Partners
        </h3>
        
        <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
          {visiblePartners.length === 0 ? (
            <p className="text-white/40 text-center py-6 font-serif italic text-sm">No partners are currently online.</p>
          ) : (
            visiblePartners.map(player => (
              <div key={player.id} className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-[#54152A]/50">
                <div className="flex items-center space-x-3">
                  <img src={player.avatar} className="w-10 h-10 rounded-full border border-[#E6C88A]/50 object-cover" alt={player.username} />
                  <div>
                    <span className="font-serif text-white block text-sm">{player.username}</span>
                    <span className="text-[9px] text-[#E6C88A]/70 uppercase tracking-wider">{player.gender === 'M' ? 'Male' : 'Female'}</span>
                  </div>
                </div>
                <button 
                  onClick={() => onInvite(player.id)} 
                  className="bg-transparent border border-[#E6C88A]/50 text-[#E6C88A] hover:bg-[#E6C88A] hover:text-black px-4 py-2 rounded-lg text-[10px] font-bold shadow-lg uppercase tracking-wider transition-all"
                >
                  Invite
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
