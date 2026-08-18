import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, AlertTriangle, XCircle, CheckCircle2, Heart, LogOut, Sparkles, Zap } from 'lucide-react';
import { formatCardText } from '../utils/text';

const FALLBACK_AVATAR = "https://api.dicebear.com/7.x/lorelei/svg?seed=fallback";

// --- ESCALATION CONFIG (same as LocalGame) ---
const ESCALATION_CONFIG = {
  sparks: {
    nextLevel: 'flames',
    icon: Sparkles,
    title: 'The sparks are flying...',
    subtitle: 'Ready to turn this into a Flame?',
    acceptText: '🔥 Turn up the heat',
    declineText: "💋 Let's tease a little longer",
    borderColor: 'border-pink-500',
    glowColor: 'rgba(236, 72, 153, 0.5)',
    bgGradient: 'from-pink-950/90 to-black',
    iconColor: 'text-pink-400',
  },
  flames: {
    nextLevel: 'wildfire',
    icon: Flame,
    title: 'Things are getting incredibly hot...',
    subtitle: 'Ready to start a Wildfire?',
    acceptText: '🔥 Take it all off',
    declineText: '💫 Keep the tension building',
    borderColor: 'border-red-500',
    glowColor: 'rgba(239, 68, 68, 0.5)',
    bgGradient: 'from-red-950/90 to-black',
    iconColor: 'text-red-500',
  },
  wildfire: {
    nextLevel: null,
    icon: Zap,
    title: 'The screen is getting in the way.',
    subtitle: 'Put the phones down. The real game starts now.',
    acceptText: '💋 We\'re ready',
    declineText: null,
    borderColor: 'border-orange-500',
    glowColor: 'rgba(249, 115, 22, 0.6)',
    bgGradient: 'from-orange-950/90 to-black',
    iconColor: 'text-orange-500',
  }
};

export default function GameBoard({ socket }) {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [turn, setTurn] = useState(state?.turn);
  const [card, setCard] = useState(null);
  const [penaltyMessage, setPenaltyMessage] = useState('');
  const [refusalStatus, setRefusalStatus] = useState(null);
  const [partnerLeftMsg, setPartnerLeftMsg] = useState(null);
  const [deniedPenalty, setDeniedPenalty] = useState(null);
  const [heatScore, setHeatScore] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);

  // --- ESCALATION STATE ---
  const [currentHeatLevel, setCurrentHeatLevel] = useState(state?.category || 'sparks');
  const [escalationState, setEscalationState] = useState(null); // null, 'deciding', 'waiting'
  const [escalationLevel, setEscalationLevel] = useState(null); // the level being escalated FROM
  const [deciderName, setDeciderName] = useState('');
  const [showGameOver, setShowGameOver] = useState(false);

  // Extract Players from Server State
  const myDataSrc = state?.players?.find(p => p.id === socket.id) || { username: 'Me', avatar: FALLBACK_AVATAR };
  const partnerDataSrc = state?.players?.find(p => p.id !== socket.id) || { username: 'Partner', avatar: FALLBACK_AVATAR };
  
  const myData = { ...myDataSrc, username: myDataSrc.username.split(' ')[0] };
  const partnerData = { ...partnerDataSrc, username: partnerDataSrc.username.split(' ')[0] };

  const isMyTurn = turn === socket.id;

  // Heat level display
  const heatDisplayName = currentHeatLevel.charAt(0).toUpperCase() + currentHeatLevel.slice(1);
  const heatColors = {
    sparks: 'text-pink-400',
    flames: 'text-red-500',
    wildfire: 'text-orange-500'
  };

  useEffect(() => {
    if (state?.roomCode) socket.emit('rejoinRoom', state.roomCode);
    socket.on('cardDrawn', (drawnCard) => setCard(drawnCard));
    socket.on('turnUpdated', (nextTurnId) => { 
      setTurn(nextTurnId); setCard(null); setRefusalStatus(null); setDeniedPenalty(null); 
    });
    socket.on('penaltyTaken', (playerName) => {
      setPenaltyMessage(`🔥 ${playerName} was allowed to strip! 🔥`);
      setRefusalStatus(null);
      setTimeout(() => setPenaltyMessage(''), 5000);
    });
    socket.on('refusalPending', (data) => setRefusalStatus(data.playerId === socket.id ? 'pending_mine' : 'pending_partners'));
    socket.on('refusalDenied', () => setRefusalStatus('denied'));

    // Partner leaving
    socket.on('partnerLeft', (data) => setPartnerLeftMsg(data.message));

    // --- ESCALATION LISTENERS ---
    socket.on('escalationPrompt', (data) => {
      setEscalationLevel(data.currentLevel);
      setEscalationState('deciding');
    });

    socket.on('escalationWaiting', (data) => {
      setDeciderName(data.deciderName);
      setEscalationState('waiting');
    });

    socket.on('heatEscalated', (data) => {
      setCurrentHeatLevel(data.newLevel);
      setEscalationState(null);
      setEscalationLevel(null);
    });

    socket.on('escalationDeclined', () => {
      setEscalationState(null);
      setEscalationLevel(null);
    });

    socket.on('wildfireEnding', () => {
      setShowGameOver(true);
    });

    socket.on('verdictResult', (data) => {
      if (data.status === 'denied') {
        setDeniedPenalty(`🔥 DENIED! ${data.targetName} MUST STRIP! 🔥`);
        setTimeout(() => setDeniedPenalty(null), 4000);
      }
    });

    socket.on('heatUpdated', (score) => {
      setHeatScore(score);
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 500);
    });

    return () => {
      socket.off('cardDrawn'); socket.off('turnUpdated');
      socket.off('penaltyTaken'); socket.off('refusalPending'); socket.off('refusalDenied');
      socket.off('partnerLeft');
      socket.off('escalationPrompt'); socket.off('escalationWaiting');
      socket.off('heatEscalated'); socket.off('escalationDeclined');
      socket.off('wildfireEnding');
      socket.off('verdictResult');
      socket.off('heatUpdated');
    };
  }, [socket, state?.roomCode]);

  const handleRefuseClick = () => socket.emit('attemptRefusal', state?.roomCode);
  const handleDeckClick = () => { if (isMyTurn && !card) socket.emit('drawCard', state?.roomCode); };

  const handlePartnerVerdict = (decision) => {
    socket.emit('partnerVerdict', { roomCode: state.roomCode, decision });
  };

  const handleEscalationAccept = () => {
    socket.emit('escalationAccept', state?.roomCode);
  };

  const handleEscalationDecline = () => {
    socket.emit('escalationDecline', state?.roomCode);
  };

  // --- WILDFIRE GAME OVER MODAL ---
  if (showGameOver) {
    const cfg = ESCALATION_CONFIG.wildfire;
    const GameOverIcon = cfg.icon;
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-sm h-[80vh] px-6 mt-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-full bg-gradient-to-b ${cfg.bgGradient} backdrop-blur-xl border-2 ${cfg.borderColor} rounded-[3rem] p-10 text-center relative overflow-hidden`}
          style={{ boxShadow: `0 0 80px ${cfg.glowColor}` }}
        >
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-orange-600/20 blur-[80px] rounded-full pointer-events-none"></div>
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-red-600/20 blur-[80px] rounded-full pointer-events-none"></div>

          <GameOverIcon className={`w-16 h-16 ${cfg.iconColor} mx-auto mb-6 animate-pulse`} style={{ filter: `drop-shadow(0 0 30px ${cfg.glowColor})` }} />

          <h2 className="text-2xl font-serif text-white font-black tracking-widest uppercase mb-3">
            {cfg.title}
          </h2>
          <p className="text-orange-200/80 text-sm font-bold mb-8 leading-relaxed">
            {cfg.subtitle}
          </p>

          <button
            onClick={() => { socket.emit('quitGame', state?.roomCode); navigate('/home'); }}
            className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-black uppercase tracking-widest hover:from-orange-500 hover:to-red-500 transition-all text-sm"
            style={{ boxShadow: `0 0 30px ${cfg.glowColor}` }}
          >
            {cfg.acceptText}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-sm space-y-6 relative pt-4 px-2">

      {/* --- ESCALATION DECIDER MODAL --- */}
      <AnimatePresence>
        {escalationState === 'deciding' && escalationLevel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            {(() => {
              const cfg = ESCALATION_CONFIG[escalationLevel];
              const EscIcon = cfg.icon;
              return (
                <div className={`w-full max-w-sm bg-gradient-to-b ${cfg.bgGradient} backdrop-blur-xl border-2 ${cfg.borderColor} rounded-[3rem] p-8 text-center relative overflow-hidden`} style={{ boxShadow: `0 0 60px ${cfg.glowColor}` }}>
                  <div className="absolute -top-20 -right-20 w-60 h-60 bg-rose-600/15 blur-[80px] rounded-full pointer-events-none"></div>

                  <p className="text-[10px] uppercase tracking-[0.3em] font-black text-white/40 mb-4">
                    Your Decision
                  </p>

                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  >
                    <EscIcon className={`w-14 h-14 ${cfg.iconColor} mx-auto mb-5`} style={{ filter: `drop-shadow(0 0 25px ${cfg.glowColor})` }} />
                  </motion.div>

                  <h2 className="text-xl font-serif text-white font-black tracking-wider uppercase mb-2">
                    {cfg.title}
                  </h2>
                  <p className="text-rose-200/70 text-sm font-bold mb-8">
                    {cfg.subtitle}
                  </p>

                  <div className="space-y-3">
                    <button
                      onClick={handleEscalationAccept}
                      className="w-full py-4 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-xl font-black uppercase tracking-widest hover:from-rose-500 hover:to-red-500 transition-all text-xs"
                      style={{ boxShadow: `0 0 25px ${cfg.glowColor}` }}
                    >
                      {cfg.acceptText}
                    </button>
                    {cfg.declineText && (
                      <button
                        onClick={handleEscalationDecline}
                        className="w-full py-3 bg-black/60 text-rose-300 border border-rose-900/50 rounded-xl font-black uppercase tracking-widest hover:bg-rose-950/40 transition-all text-[11px]"
                      >
                        {cfg.declineText}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- ESCALATION WAITING MODAL --- */}
      <AnimatePresence>
        {escalationState === 'waiting' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
          >
            <div className="w-full max-w-sm bg-neutral-950/95 border border-rose-500/40 rounded-[3rem] p-10 text-center relative overflow-hidden" style={{ boxShadow: '0 0 60px rgba(244, 63, 94, 0.3)' }}>
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-rose-600/10 blur-[80px] rounded-full pointer-events-none"></div>

              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              >
                <Flame className="w-12 h-12 text-rose-500 mx-auto mb-6" style={{ filter: 'drop-shadow(0 0 20px rgba(244, 63, 94, 0.8))' }} />
              </motion.div>

              <h2 className="text-lg font-serif text-white font-black tracking-widest uppercase mb-3">
                A Decision is Being Made...
              </h2>
              <p className="text-rose-300/70 text-sm font-bold animate-pulse leading-relaxed">
                Waiting to see if <span className="text-white">{deciderName}</span> wants to turn up the heat...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- PARTNER LEFT MODAL --- */}
      <AnimatePresence>
        {partnerLeftMsg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          >
            <div className="bg-neutral-950/95 border border-rose-500 rounded-[2rem] p-8 w-full max-w-sm shadow-[0_0_60px_rgba(244,63,94,0.4)] text-center">
              <Heart className="w-14 h-14 text-rose-500 mx-auto mb-4 opacity-60" />
              <h2 className="text-xl font-serif text-white font-black mb-2 tracking-widest uppercase">Game Over</h2>
              <p className="text-rose-300 text-sm mb-6 font-bold">{partnerLeftMsg}</p>
              <button
                onClick={() => { setPartnerLeftMsg(null); navigate('/home'); }}
                className="w-full py-3.5 bg-rose-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all text-xs"
              >
                Back to Home
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- 🔴 MOBILE GAME TOP HUD --- */}
      <div className="w-full bg-neutral-950/80 backdrop-blur-xl border border-rose-500/30 rounded-full p-2 flex justify-between items-center shadow-[0_0_30px_rgba(244,63,94,0.15)] relative z-20">

        {/* Player 1 (You) */}
        <div className={`flex items-center space-x-3 w-1/3 transition-all duration-500 ${isMyTurn ? 'opacity-100 scale-105' : 'opacity-40 grayscale-[30%]'}`}>
          <img src={myData.avatar} className={`w-12 h-12 rounded-full object-cover border-2 ${isMyTurn ? 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)]' : 'border-neutral-700'}`} alt="Me" />
          <div className="text-left hidden sm:block">
            <p className="text-white font-black text-[10px] uppercase tracking-wider truncate w-16">{myData.username}</p>
            {isMyTurn && <p className="text-rose-400 font-black text-[8px] uppercase tracking-widest animate-pulse">Acting</p>}
          </div>
        </div>

        {/* Center VS Element with Heat Level */}
        <div className="flex flex-col items-center justify-center w-1/3">
          <div className="relative flex items-center justify-center">
            <Heart className="w-8 h-8 text-rose-600 animate-pulse fill-current drop-shadow-[0_0_15px_rgba(244,63,94,0.8)]" />
            <span className="absolute text-white text-[9px] font-black italic mt-0.5">VS</span>
          </div>
          <span className={`text-[7px] font-black uppercase tracking-widest mt-1 ${heatColors[currentHeatLevel]}`}>{heatDisplayName}</span>
        </div>

        {/* Player 2 (Partner) */}
        <div className={`flex items-center justify-end space-x-3 w-1/3 transition-all duration-500 ${!isMyTurn ? 'opacity-100 scale-105' : 'opacity-40 grayscale-[30%]'}`}>
          <div className="text-right hidden sm:block">
            <p className="text-white font-black text-[10px] uppercase tracking-wider truncate w-16">{partnerData.username}</p>
            {!isMyTurn && <p className="text-rose-400 font-black text-[8px] uppercase tracking-widest animate-pulse">Acting</p>}
          </div>
          <img src={partnerData.avatar} className={`w-12 h-12 rounded-full object-cover border-2 ${!isMyTurn ? 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)]' : 'border-neutral-700'}`} alt="Partner" />
        </div>
      </div>

      {/* HEAT METER */}
      <div className="w-full px-2 relative z-20 -mt-2 mb-2">
        <div className="flex justify-between items-end mb-1 px-1">
          <span className="text-rose-400 font-black uppercase text-[8px] tracking-[0.2em]">Heat Meter</span>
          <span className="text-white font-black text-[9px]">{heatScore}%</span>
        </div>
        <div className="w-full h-3 bg-neutral-900 border border-neutral-700/50 rounded-full overflow-hidden relative shadow-inner">
          <motion.div 
            className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]"
            initial={{ width: 0 }}
            animate={{ width: `${heatScore}%` }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
          />
        </div>
        <AnimatePresence>
          {heatScore === 100 && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="text-center mt-2"
            >
              <p className="text-red-500 animate-pulse font-black uppercase tracking-widest text-[10px] drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]">
                Maximum Heat Reached...<br/>Boss Dare Unlocked!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* ---------------------------------- */}


      {/* Notifications */}
      <AnimatePresence>
        {penaltyMessage && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="absolute top-16 w-[90%] bg-rose-600 text-white font-black uppercase tracking-widest text-xs text-center py-3 rounded-xl shadow-[0_0_30px_rgba(244,63,94,0.8)] z-50">
            {penaltyMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLASHY DENIED PENALTY */}
      <AnimatePresence>
        {deniedPenalty && (
          <motion.div 
            initial={{ scale: 0.5, opacity: 0, rotate: -10 }} 
            animate={{ scale: 1.1, opacity: 1, rotate: 0 }} 
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
          >
            <div className="absolute inset-0 bg-red-900/60 backdrop-blur-sm"></div>
            <div className="bg-black/90 border-4 border-red-600 p-8 rounded-[3rem] text-center shadow-[0_0_100px_rgba(220,38,38,0.8)] relative z-10 transform -rotate-6">
              <h1 className="text-6xl font-black text-red-500 tracking-widest mb-4 drop-shadow-[0_0_20px_rgba(220,38,38,1)]">DENIED</h1>
              <p className="text-white text-lg font-bold uppercase tracking-widest bg-red-600 py-2 px-6 rounded-full inline-block">{deniedPenalty}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center">
        {refusalStatus === 'denied' && isMyTurn && (
          <p className="text-rose-400 font-black animate-pulse mt-2 uppercase tracking-widest text-sm bg-rose-950/50 px-4 py-1 rounded-full border border-rose-500/30">No Mercy! Do it.</p>
        )}
      </div>

      {/* The Premium Glass Card */}
      <div className="relative w-72 h-[24rem] cursor-pointer" onClick={handleDeckClick}>
        <AnimatePresence mode="wait">
          {!card ? (
            <motion.div key="back" className={`w-full h-full rounded-[2rem] border border-rose-500/30 backdrop-blur-xl bg-black/40 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(244,63,94,0.15)] ${isMyTurn ? 'hover:scale-105 hover:border-rose-500/60' : 'opacity-60'} transition-all duration-300`}>
               <div className="absolute inset-0 bg-gradient-to-br from-rose-900/10 to-transparent rounded-[2rem]"></div>
               <Flame className="w-20 h-20 text-rose-600 mb-6 opacity-90 drop-shadow-[0_0_20px_rgba(244,63,94,1)]" />
               <span className="text-rose-200/60 uppercase tracking-[0.4em] text-xs font-black">
                 {isMyTurn ? "Tap to Reveal" : "Wait for Partner"}
               </span>
            </motion.div>
          ) : card.isSecret ? (
            /* --- SECRET STASH CARD (Ultra-Premium Gold/Purple) --- */
            <motion.div
              key="front-secret"
              initial={{ rotateY: 90, scale: 0.8, opacity: 0 }}
              animate={{ rotateY: 0, scale: 1, opacity: 1 }}
              exit={{ rotateY: -90, scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 14, duration: 0.8 }}
              style={{ perspective: 1200, transformStyle: 'preserve-3d' }}
              className="w-full h-full rounded-[2rem] border-2 border-amber-400 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center relative overflow-hidden bg-gradient-to-b from-amber-950/60 via-purple-950/40 to-black/80"
            >
              {/* Animated shimmer overlay */}
              <motion.div
                className="absolute inset-0 pointer-events-none rounded-[2rem]"
                style={{
                  background: 'linear-gradient(105deg, transparent 40%, rgba(251,191,36,0.12) 45%, rgba(168,85,247,0.08) 55%, transparent 60%)',
                  backgroundSize: '200% 100%'
                }}
                animate={{ backgroundPosition: ['200% 0%', '-200% 0%'] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              />

              {/* Decorative glow blobs */}
              <div className="absolute -top-20 -right-20 w-48 h-48 bg-amber-500/20 blur-[60px] rounded-full pointer-events-none"></div>
              <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-purple-600/20 blur-[60px] rounded-full pointer-events-none"></div>

              {/* Type badge */}
              <div className="text-[10px] uppercase tracking-[0.3em] font-black mb-4 border px-3 py-1.5 rounded-full z-10 text-amber-300 border-amber-400/50 bg-amber-950/50">
                {card.type}
              </div>

              {/* Card text */}
              <p className="text-2xl font-serif leading-snug text-white z-10 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">
                {formatCardText(
                  card.text,
                  isMyTurn ? myData.username : partnerData.username,
                  isMyTurn ? partnerData.username : myData.username
                )}
              </p>

              {/* Secret Stash author tag */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="absolute bottom-5 left-0 right-0 flex justify-center z-10"
              >
                <div className="bg-gradient-to-r from-amber-600/30 to-purple-600/30 border border-amber-500/40 backdrop-blur-md px-4 py-1.5 rounded-full">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]">
                    🤫 Secret Stash: Written by {card.author}
                  </span>
                </div>
              </motion.div>

              {/* Gold glow ring pulse */}
              <motion.div
                className="absolute inset-0 rounded-[2rem] pointer-events-none"
                style={{ boxShadow: '0 0 60px rgba(251,191,36,0.3), inset 0 0 60px rgba(251,191,36,0.05)' }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              />
            </motion.div>
          ) : (
            /* --- NORMAL CARD (existing styling) --- */
            <motion.div key="front" className={`w-full h-full rounded-[2rem] border-2 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center shadow-[0_0_60px_rgba(244,63,94,0.4)] relative overflow-hidden ${card.type === 'Virtual Dare' ? 'border-rose-500 bg-rose-950/50' : card.type === 'Boss Dare' ? 'border-red-600 bg-red-950/80 shadow-[0_0_80px_rgba(220,38,38,0.6)]' : 'border-pink-400 bg-black/60'}`}>
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-rose-600/20 blur-[50px] rounded-full pointer-events-none"></div>
              
              <div className={`text-[10px] uppercase tracking-[0.3em] font-black mb-6 border px-3 py-1.5 rounded-full z-10 ${card.type === 'Virtual Dare' ? 'text-rose-400 border-rose-400/50 bg-rose-950/50' : card.type === 'Boss Dare' ? 'text-red-500 border-red-500/80 bg-red-900/40 drop-shadow-[0_0_5px_rgba(220,38,38,1)] text-xs' : 'text-pink-300 border-pink-300/50 bg-pink-950/50'}`}>
                {card.type}
              </div>
              <p className={`text-2xl font-serif leading-snug text-white z-10 drop-shadow-md ${card.type === 'Boss Dare' ? 'font-black tracking-wide drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]' : ''}`}>
                {formatCardText(
                  card.text,
                  isMyTurn ? myData.username : partnerData.username,
                  isMyTurn ? partnerData.username : myData.username
                )}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dynamic Action Area */}
      <div className="h-32 w-full flex flex-col justify-center px-4">

        {/* ACTIVE PLAYER: No "I Did It" button. Just Refuse & Strip + Status */}
        {isMyTurn && card && !refusalStatus && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col space-y-4">
            <div className="text-center">
              <p className="text-rose-400 animate-pulse text-[10px] uppercase font-black tracking-widest">
                You are at their mercy...<br/>Waiting for judgment.
              </p>
            </div>
            <button onClick={handleRefuseClick} className="w-full py-3.5 bg-neutral-950 text-rose-500 border border-rose-900 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-rose-950 flex items-center justify-center space-x-2 transition-all shadow-[0_0_15px_rgba(244,63,94,0.2)]">
              <AlertTriangle className="w-4 h-4" /> <span>Refuse & Strip</span>
            </button>
          </motion.div>
        )}

        {/* INACTIVE PLAYER (PARTNER): Judgment Controls */}
        {!isMyTurn && card && !refusalStatus && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col space-y-2">
            <button onClick={() => handlePartnerVerdict('success')} className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-black uppercase text-[11px] tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:from-emerald-500 hover:to-teal-500 transition-all flex justify-center items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" /> <span>They nailed it. (Satisfied)</span>
            </button>
            <button onClick={() => handlePartnerVerdict('fail')} className="w-full py-3 bg-neutral-950 border border-red-600 text-red-500 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-950/30 transition-all flex justify-center items-center space-x-2">
              <XCircle className="w-4 h-4" /> <span>Not good enough. Strip.</span>
            </button>
          </motion.div>
        )}

        {isMyTurn && refusalStatus === 'pending_mine' && (
          <div className="text-center text-rose-400 font-black text-xs uppercase tracking-widest animate-pulse">
            Begging for mercy...
          </div>
        )}

        {isMyTurn && refusalStatus === 'denied' && (
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
            <button onClick={() => socket.emit('nextTurn', state.roomCode)} className="w-full py-4 bg-rose-900 text-white border-2 border-rose-500 rounded-xl font-black uppercase text-xs tracking-widest shadow-[0_0_30px_rgba(244,63,94,0.6)]">
              Fine. I Did It.
            </button>
          </motion.div>
        )}

        {!isMyTurn && refusalStatus === 'pending_partners' && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col space-y-3 p-3 bg-rose-950/80 border border-rose-500 rounded-2xl shadow-2xl">
            <p className="text-center font-black text-white mb-1 uppercase text-[10px] tracking-widest">
              {partnerData.username} wants to skip!
            </p>
            <div className="flex space-x-2">
              <button onClick={() => socket.emit('resolveRefusal', { roomCode: state.roomCode, decision: 'strip' })} className="flex-1 py-2 bg-neutral-950 border border-rose-500 text-rose-400 rounded-lg font-black flex items-center justify-center space-x-1 hover:bg-rose-900 transition-colors">
                <CheckCircle2 className="w-3 h-3" /> <span className="text-[10px] uppercase tracking-wider">Mercy</span>
              </button>
              <button onClick={() => socket.emit('resolveRefusal', { roomCode: state.roomCode, decision: 'force' })} className="flex-1 py-2 bg-rose-600 text-white rounded-lg font-black flex items-center justify-center space-x-1 shadow-lg hover:bg-rose-500 transition-colors">
                <XCircle className="w-3 h-3" /> <span className="text-[10px] uppercase tracking-wider">No Mercy</span>
              </button>
            </div>
          </motion.div>
        )}

      </div>

      <button onClick={() => { socket.emit('quitGame', state?.roomCode); navigate('/home'); }} className="absolute -top-2 left-4 text-neutral-500 hover:text-rose-500 flex items-center space-x-1 transition-colors">
        <LogOut className="w-4 h-4" /> <span className="text-[9px] uppercase font-black tracking-widest">Quit</span>
      </button>
    </div>
  );
}