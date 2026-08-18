import React from 'react';

// Using the same avatars as Home.jsx
import girl1 from '../../assets/girl1.jpg';
import girl2 from '../../assets/girl2.jpg';
import girl3 from '../../assets/girl3.png';
import boy1 from '../../assets/boy1.jpg';
import boy2 from '../../assets/boy2.jpg';
import boy3 from '../../assets/boy3.png';

const AVATARS = [girl1, girl2, girl3, boy1, boy2, boy3];

export default function PlayerSetup({ players, setPlayers }) {
  const updateGuest = (key, val) => {
    const newPlayers = [...players];
    if (!newPlayers[1]) newPlayers[1] = { name: 'Player 2', avatar: AVATARS[3], relationship: 'crush' };
    newPlayers[1] = { ...newPlayers[1], [key]: val };
    setPlayers(newPlayers);
  };

  const guest = players[1] || {};

  return (
    <div className="w-full space-y-4">
      {/* Two player cards stacked or side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* HOST CARD */}
        <div className="bg-[#1a0c14]/80 border border-[#54152A]/60 rounded-xl p-4 flex items-center space-x-4 relative overflow-hidden">
          <div className="absolute top-2 right-2 text-[8px] uppercase tracking-[0.2em] text-[#E6C88A] font-bold bg-[#E6C88A]/10 px-2 py-0.5 rounded border border-[#E6C88A]/20">Host</div>
          <img
            src={players[0]?.avatar || AVATARS[0]}
            className="w-14 h-14 rounded-full border border-[#E6C88A]/60 object-cover shrink-0"
            alt="Host"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-serif text-white truncate">{players[0]?.name || 'Player 1'}</h4>
            <p className="text-[10px] text-green-400/80 uppercase tracking-widest mt-0.5">Ready</p>
          </div>
        </div>

        {/* PARTNER CARD */}
        <div className="bg-[#1a0c14]/80 border border-[#54152A]/60 rounded-xl p-4 flex flex-col space-y-3 relative">
          <div className="absolute top-2 right-2 text-[8px] uppercase tracking-[0.2em] text-white/40 font-bold bg-white/5 px-2 py-0.5 rounded border border-white/10">Partner</div>
          
          <div className="flex items-center space-x-3 w-full pr-12">
             <div className="w-12 h-12 shrink-0">
                {guest.avatar ? (
                  <img src={guest.avatar} className="w-12 h-12 rounded-full border border-[#E6C88A]/60 object-cover" alt="Partner" />
                ) : (
                  <div className="w-12 h-12 rounded-full border border-[#54152A] bg-black/40 flex items-center justify-center text-white/30 text-xs">?</div>
                )}
             </div>
             <input
                type="text"
                value={guest.name || ''}
                onChange={(e) => updateGuest('name', e.target.value)}
                className="w-full bg-black/30 border border-[#54152A] rounded-lg px-3 py-1.5 text-white text-sm focus:border-[#E6C88A]/60 outline-none transition-colors placeholder:text-white/30"
                placeholder="Partner name"
              />
          </div>

          <div className="flex justify-start gap-1.5 flex-wrap pt-1">
            {AVATARS.map((av, idx) => (
              <img
                key={idx}
                src={av}
                onClick={() => updateGuest('avatar', av)}
                className={`w-7 h-7 rounded-full cursor-pointer object-cover border transition-all duration-200 ${
                  guest.avatar === av
                    ? 'border-[#E6C88A] scale-110 shadow-[0_0_8px_rgba(230,200,138,0.2)]'
                    : 'border-transparent opacity-40 hover:opacity-80'
                }`}
                alt="Avatar"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
