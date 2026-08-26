import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Share, Users, ShieldAlert, Heart, Flame, Sparkles } from 'lucide-react';

export default function OnlineLobby({
  roomCode,
  isHost,
  hostInfo,
  opponentInfo,
  relationship,
  moods = [],
  items = [],
  onStartGame,
  onCancel
}) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const getInviteLink = () => {
    return `${window.location.origin}/?join=${roomCode}`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getInviteLink());
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Join my Ignite Game!',
      text: `Use my room code ${roomCode} to join our game!`,
      url: getInviteLink()
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        handleCopyLink();
      }
    } catch (err) {
      console.log('Error sharing:', err);
    }
  };

  const formatMoods = () => moods.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(', ') || 'Any';
  const formatItems = () => items.filter(i => i !== 'none').map(i => i.charAt(0).toUpperCase() + i.slice(1)).join(', ') || 'No Items';

  return (
    <div className="fixed inset-0 z-[100] flex flex-col p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="my-auto mx-auto bg-neutral-950/90 border border-[#54152A] rounded-[2rem] p-8 w-full max-w-md shadow-[0_0_60px_rgba(84,21,42,0.4)] text-center relative overflow-hidden shrink-0"
      >
        {/* Glow Effects */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-rose-500/10 blur-[50px] rounded-full pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#E6C88A]/10 blur-[50px] rounded-full pointer-events-none"></div>

        <div className="relative z-10">
          <Heart className="w-10 h-10 text-rose-500 mx-auto mb-3 animate-pulse" />
          <h2 className="text-2xl font-serif text-[#E6C88A] font-black mb-1 tracking-widest uppercase">Room Created</h2>
          <p className="text-white/40 text-[10px] uppercase tracking-widest mb-6">Online Lobby</p>

          {/* ROOM CODE SECTION */}
          <div className="bg-black/60 border border-rose-500/30 rounded-2xl p-6 mb-6 relative group">
            <p className="text-white/50 text-[9px] uppercase tracking-widest font-bold mb-2">Your Room Code</p>
            <div className="flex items-center justify-center space-x-4">
              <span className="text-5xl font-black tracking-[0.3em] text-white font-mono drop-shadow-[0_0_15px_rgba(244,63,94,0.6)]">
                {roomCode}
              </span>
            </div>
            
            <div className="flex items-center justify-center space-x-3 mt-6">
              <button 
                onClick={handleCopyCode}
                className="flex items-center space-x-2 px-4 py-2 bg-rose-950/40 text-rose-300 rounded-lg hover:bg-rose-900/60 transition-colors border border-rose-500/20 text-xs uppercase font-bold tracking-wider"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy Code'}</span>
              </button>
              
              <button 
                onClick={handleShare}
                className="flex items-center space-x-2 px-4 py-2 bg-[#E6C88A]/10 text-[#E6C88A] rounded-lg hover:bg-[#E6C88A]/20 transition-colors border border-[#E6C88A]/20 text-xs uppercase font-bold tracking-wider"
              >
                <Share className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
            
            <button 
              onClick={handleCopyLink}
              className="mt-4 text-[10px] text-white/40 hover:text-white uppercase tracking-widest font-bold flex items-center justify-center w-full transition-colors"
            >
              {linkCopied ? 'Link Copied!' : '🔗 Copy Invite Link'}
            </button>
          </div>

          {/* PLAYERS SECTION */}
          <div className="flex items-center justify-between mb-8 px-2">
            {/* HOST */}
            <div className="flex flex-col items-center w-1/3">
              <div className="relative mb-2">
                <img src={hostInfo?.avatar} className="w-16 h-16 rounded-full border-2 border-[#E6C88A] object-cover shadow-[0_0_15px_rgba(230,200,138,0.3)]" alt="Host" />
                <div className="absolute -bottom-2 -left-2 bg-[#E6C88A] text-black text-[8px] px-2 py-0.5 rounded font-bold uppercase tracking-widest border border-black">Host</div>
              </div>
              <span className="text-white font-serif text-sm truncate w-full">{hostInfo?.username || 'Host'}</span>
            </div>

            <div className="w-1/3 flex flex-col items-center">
              <span className="text-rose-500 font-black text-xl italic drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]">VS</span>
            </div>

            {/* OPPONENT */}
            <div className="flex flex-col items-center w-1/3">
              <div className="relative mb-2">
                {opponentInfo ? (
                  <img src={opponentInfo.avatar} className="w-16 h-16 rounded-full border-2 border-rose-500 object-cover shadow-[0_0_15px_rgba(244,63,94,0.3)]" alt="Opponent" />
                ) : (
                  <div className="w-16 h-16 rounded-full border-2 border-neutral-700 bg-black/50 flex items-center justify-center animate-pulse">
                    <Users className="w-6 h-6 text-neutral-600" />
                  </div>
                )}
              </div>
              <span className={`font-serif text-sm truncate w-full ${opponentInfo ? 'text-white' : 'text-neutral-500 italic'}`}>
                {opponentInfo ? opponentInfo.username : 'Waiting...'}
              </span>
            </div>
          </div>

          {/* ROOM CONFIGURATION */}
          <div className="bg-black/40 border border-[#54152A]/50 rounded-xl p-4 mb-8 text-left space-y-2">
            <h4 className="text-[10px] text-[#E6C88A]/80 uppercase tracking-widest font-bold mb-3 border-b border-[#54152A]/50 pb-2 flex items-center">
              <Sparkles className="w-3 h-3 mr-2" /> Game Settings
            </h4>
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/40 uppercase tracking-wider font-bold">Relationship</span>
              <span className="text-white capitalize">{relationship?.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/40 uppercase tracking-wider font-bold">Mood</span>
              <span className="text-rose-300">{formatMoods()}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/40 uppercase tracking-wider font-bold">Items</span>
              <span className="text-amber-200">{formatItems()}</span>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="space-y-3">
            {isHost ? (
              <button
                onClick={onStartGame}
                disabled={!opponentInfo}
                className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center transition-all ${
                  opponentInfo 
                    ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-[0_0_30px_rgba(244,63,94,0.4)] hover:scale-[1.02]' 
                    : 'bg-neutral-900 text-neutral-600 border border-neutral-800 cursor-not-allowed'
                }`}
              >
                {opponentInfo ? 'Start Game' : 'Waiting for opponent...'}
              </button>
            ) : (
              <div className="w-full py-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <span className="text-rose-400/60 text-xs font-bold uppercase tracking-widest animate-pulse">
                  Waiting for Host to start...
                </span>
              </div>
            )}
            
            <button 
              onClick={onCancel}
              className="w-full py-3 bg-transparent text-white/40 rounded-xl font-bold uppercase tracking-widest hover:text-white transition-colors text-xs"
            >
              Leave Room
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
