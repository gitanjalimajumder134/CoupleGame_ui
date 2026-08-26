import React, { useState } from 'react';
import { Pencil, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Using the same avatars as Home.jsx
import girl1 from '../../assets/girl1.jpg';
import girl2 from '../../assets/girl2.jpg';
import girl3 from '../../assets/girl3.png';
import boy1 from '../../assets/boy1.jpg';
import boy2 from '../../assets/boy2.jpg';
import boy3 from '../../assets/boy3.png';

const AVATARS = [girl1, girl2, girl3, boy1, boy2, boy3];

export default function PlayerSetup({ players, setPlayers }) {
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const updateGuest = (key, val) => {
    const newPlayers = [...players];
    if (!newPlayers[1]) newPlayers[1] = { name: 'Player 2', avatar: AVATARS[3], relationship: 'crush' };
    newPlayers[1] = { ...newPlayers[1], [key]: val };
    setPlayers(newPlayers);
  };

  const guest = players[1] || {};

  return (
    <div className="w-full relative">
      <div className="bg-[#1a0c14]/80 border border-[#54152A]/60 rounded-xl p-4 sm:p-5 shadow-[0_0_20px_rgba(84,21,42,0.2)]">
        
        {/* Top Row: Players side by side */}
        <div className="flex items-start justify-between gap-2 sm:gap-4 relative">
          
          {/* HOST */}
          <div className="flex flex-col items-center flex-1 shrink-0 min-w-0">
            <div className="relative mb-2">
              <div className="absolute -top-2 -right-2 text-[8px] uppercase tracking-widest text-black bg-[#E6C88A] font-bold px-1.5 py-0.5 rounded shadow-sm z-10">Host</div>
              <img
                src={players[0]?.avatar || AVATARS[0]}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-[#E6C88A] object-cover shadow-[0_0_10px_rgba(230,200,138,0.2)]"
                alt="Host"
              />
            </div>
            <h4 className="text-sm font-serif text-white truncate w-full text-center">{players[0]?.name || 'Player 1'}</h4>
            <span className="text-[9px] text-green-400/80 uppercase tracking-widest mt-0.5">Ready</span>
          </div>

          {/* VS Divider */}
          <div className="flex flex-col items-center justify-center pt-5 px-1 sm:px-2">
            <span className="text-[10px] text-[#E6C88A]/50 font-bold uppercase tracking-widest bg-[#54152A]/30 px-2 py-1 rounded-full border border-[#54152A]/50">VS</span>
          </div>

          {/* PARTNER */}
          <div className="flex flex-col items-center flex-1 shrink-0 min-w-0">
            <div 
              className="relative mb-2 cursor-pointer group"
              onClick={() => setShowAvatarModal(true)}
            >
              <div className="absolute -bottom-1 -right-1 bg-[#E6C88A] text-black p-1 rounded-full shadow-md z-10 transform group-hover:scale-110 transition-transform">
                <Pencil className="w-3 h-3" />
              </div>
              {guest.avatar ? (
                <img src={guest.avatar} className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-[#54152A] object-cover transition-transform group-hover:border-[#E6C88A]" alt="Partner" />
              ) : (
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-dashed border-[#54152A] bg-black/40 flex items-center justify-center text-white/30 text-xs transition-colors group-hover:border-[#E6C88A]">?</div>
              )}
            </div>
            <input
              type="text"
              value={guest.name || ''}
              onChange={(e) => updateGuest('name', e.target.value)}
              className="w-[90%] bg-black/30 border border-[#54152A] rounded px-2 py-1 text-white text-xs text-center focus:border-[#E6C88A]/60 outline-none transition-colors placeholder:text-white/30"
              placeholder="Partner Name"
            />
          </div>

        </div>
      </div>

      {/* Avatar Selection Modal */}
      <AnimatePresence>
        {showAvatarModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1a0c14] border border-[#54152A]/80 rounded-2xl p-6 w-full max-w-sm relative shadow-[0_0_30px_rgba(84,21,42,0.4)]"
            >
              <button 
                onClick={() => setShowAvatarModal(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white bg-black/20 p-2 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <h3 className="text-xl font-serif text-white text-center mb-6">Choose Partner Avatar</h3>
              
              <div className="grid grid-cols-3 gap-4">
                {AVATARS.map((av, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                      updateGuest('avatar', av);
                      setShowAvatarModal(false);
                    }}
                    className={`relative rounded-xl overflow-hidden cursor-pointer aspect-square border-2 transition-all duration-200 ${
                      guest.avatar === av
                        ? 'border-[#E6C88A] scale-105 shadow-[0_0_15px_rgba(230,200,138,0.3)]'
                        : 'border-transparent hover:border-[#54152A]/60'
                    }`}
                  >
                    <img src={av} className="w-full h-full object-cover" alt="Avatar option" />
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
