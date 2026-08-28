import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, AlertTriangle, XCircle, CheckCircle2, Heart, LogOut, Sparkles, Zap, Lock } from 'lucide-react';
import { formatCardText } from '../utils/text';
import CinematicDeck from '../components/game/CinematicDeck';
import BurnTransition from '../components/PremiumDice/BurnTransition';

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
  const [isBurning, setIsBurning] = useState(false);
  const [pendingBurnAction, setPendingBurnAction] = useState(null);

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
    setIsBurning(true);
    setPendingBurnAction(() => () => {
      socket.emit('partnerVerdict', { roomCode: state.roomCode, decision });
    });
  };

  const handleFineIDidIt = () => {
    setIsBurning(true);
    setPendingBurnAction(() => () => {
      socket.emit('nextTurn', state.roomCode);
    });
  };

  const handleResolveRefusal = (decision) => {
    setIsBurning(true);
    setPendingBurnAction(() => () => {
      socket.emit('resolveRefusal', { roomCode: state.roomCode, decision });
    });
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
            onClick={() => { socket.emit('quitGame', state?.roomCode); navigate('/home', { replace: true }); }}
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
    <div className="w-full min-h-[100dvh] bg-black text-white relative flex flex-col overflow-x-hidden">
      
      {/* Global Atmosphere Elements */}
      <div className="intimacy-vignette" />
      <div className="lux-light-leak" style={{ top: '-10%', left: '-20%', '--leak-color': 'rgba(239,68,68,0.15)', '--dur': '25s' }} />
      <div className="lux-light-leak" style={{ bottom: '-10%', right: '-20%', '--leak-color': 'rgba(236,72,153,0.1)', '--dur': '30s' }} />

      <div className="flex-1 w-full max-w-sm mx-auto flex flex-col relative z-10 pt-safe-top pb-safe-bottom">
        
        {/* ========================================= */}
        {/* TOP SECTION: Controls, HUD, Heat Meter      */}
        {/* ========================================= */}
        <div className="w-full px-4 pt-4 flex flex-col space-y-4 shrink-0">
          
          {/* QUIT BUTTON */}
          <div className="w-full flex justify-start">
            <button onClick={() => { socket.emit('quitGame', state?.roomCode); navigate('/home', { replace: true }); }} className="text-white/40 hover:text-rose-500 flex items-center space-x-1.5 transition-colors bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 hover:border-rose-500/50 shadow-lg">
              <LogOut className="w-3 h-3" /> <span className="text-[9px] uppercase font-black tracking-widest">Quit</span>
            </button>
          </div>

          {/* --- 🔴 YOU ❤️ PARTNER COMPOSITION --- */}
          <div className="w-full flex justify-between items-center relative z-20 mt-2">
            {/* Subtle connecting line */}
            <div className="absolute top-1/2 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-rose-500/20 to-transparent -z-10" />
            
            {/* Player 1 (You) */}
            <div className={`flex flex-col items-center space-y-2 transition-all duration-700 ${isMyTurn ? 'opacity-100 scale-105' : 'opacity-40 grayscale-[50%]'}`}>
              <div className={`relative p-1 rounded-full ${isMyTurn ? 'lux-edge-glow shadow-[0_0_20px_rgba(244,63,94,0.4)]' : 'border border-neutral-800'}`}>
                <img src={myData.avatar} className="w-12 h-12 rounded-full object-cover" alt="Me" />
              </div>
              <div className="text-center">
                <p className="text-white font-black text-[9px] uppercase tracking-[0.2em]">{myData.username}</p>
              </div>
            </div>

            {/* Center Heartbeat & Status */}
            <div className="flex flex-col items-center justify-center">
              <Heart className="w-6 h-6 text-rose-600 animate-heartbeat-glow drop-shadow-[0_0_15px_rgba(244,63,94,0.8)] fill-current" />
              <span className={`text-[7px] font-black uppercase tracking-[0.3em] mt-2 ${heatColors[currentHeatLevel]}`}>{heatDisplayName}</span>
              <p className="text-rose-300/80 font-bold text-[8px] uppercase tracking-widest mt-1">
                {isMyTurn ? `Your Turn ❤️` : `Their Turn 👀`}
              </p>
            </div>

            {/* Player 2 (Partner) */}
            <div className={`flex flex-col items-center space-y-2 transition-all duration-700 ${!isMyTurn ? 'opacity-100 scale-105' : 'opacity-40 grayscale-[50%]'}`}>
              <div className={`relative p-1 rounded-full ${!isMyTurn ? 'lux-edge-glow shadow-[0_0_20px_rgba(244,63,94,0.4)]' : 'border border-neutral-800'}`}>
                <img src={partnerData.avatar} className="w-12 h-12 rounded-full object-cover" alt="Partner" />
              </div>
              <div className="text-center">
                <p className="text-white font-black text-[9px] uppercase tracking-[0.2em]">{partnerData.username}</p>
              </div>
            </div>
          </div>

          {/* HEAT METER */}
          <div className="w-full relative z-20 mt-2">
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
        </div>

        {/* ========================================= */}
        {/* CENTER SECTION: Naughty Deck              */}
        {/* ========================================= */}
        <div className="flex-1 w-full flex items-center justify-center min-h-[460px] py-4">
          <div className="w-[300px] h-[440px] relative">
            <BurnTransition
              isBurning={isBurning}
              onComplete={() => {
                setIsBurning(false);
                if (pendingBurnAction) {
                  pendingBurnAction();
                  setPendingBurnAction(null);
                }
              }}
            >
              <CinematicDeck 
                card={card}
                loading={false}
                isMyTurn={isMyTurn}
                onDraw={handleDeckClick}
                activePlayerName={isMyTurn ? myData.username : partnerData.username}
                inactivePlayerName={isMyTurn ? partnerData.username : myData.username}
                heatLevel={currentHeatLevel}
              />
            </BurnTransition>
          </div>
        </div>

        {/* ========================================= */}
        {/* BOTTOM SECTION: Interaction Controls      */}
        {/* ========================================= */}
        <div className="w-full px-4 pb-6 shrink-0 z-30 min-h-[160px] flex flex-col justify-end">
          
          <div className="text-center mb-2">
            {refusalStatus === 'denied' && isMyTurn && (
              <p className="text-rose-400 font-black animate-pulse uppercase tracking-widest text-sm bg-rose-950/50 px-4 py-1 rounded-full border border-rose-500/30 inline-block">No Mercy! Do it.</p>
            )}
            {isMyTurn && refusalStatus === 'pending_mine' && (
              <p className="text-rose-400 font-black text-[10px] uppercase tracking-[0.2em] animate-pulse">Begging for mercy...</p>
            )}
          </div>

          {/* ACTIVE PLAYER: REFUSE */}
          {isMyTurn && card && !refusalStatus && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex justify-center mb-6">
              <button onClick={handleRefuseClick} className="px-6 py-2.5 bg-black/40 backdrop-blur-md text-rose-500 border border-rose-900/50 rounded-full font-black uppercase text-[9px] tracking-[0.2em] hover:bg-rose-950/50 flex items-center justify-center space-x-2 transition-all shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                <AlertTriangle className="w-3 h-3" /> <span>Refuse & Strip</span>
              </button>
            </motion.div>
          )}

          {/* INACTIVE PLAYER (PARTNER): Judgment Controls */}
          {!isMyTurn && card && !refusalStatus && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="pt-4 border-t border-neutral-800">
              <div className="text-center mb-4">
                <p className="text-rose-400/80 font-black text-[9px] uppercase tracking-[0.3em]">
                  Judgment Time
                </p>
                <p className="text-white/40 text-[8px] uppercase font-bold tracking-widest mt-1">
                  Did {partnerData.username} do it?
                </p>
              </div>
              <div className="flex flex-col space-y-3">
                <button onClick={() => handlePartnerVerdict('success')} className="w-full py-3.5 bg-gradient-to-r from-emerald-600/90 to-teal-600/90 backdrop-blur-md text-white rounded-full font-black uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:from-emerald-500 hover:to-teal-500 transition-all flex justify-center items-center space-x-2 border border-emerald-500/50">
                  <CheckCircle2 className="w-4 h-4" /> <span>They nailed it. (Satisfied)</span>
                </button>
                <button onClick={() => handlePartnerVerdict('fail')} className="w-full py-3.5 bg-black/60 backdrop-blur-md border border-red-900/50 text-red-500 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-red-950/40 transition-all flex justify-center items-center space-x-2">
                  <XCircle className="w-4 h-4" /> <span>Not good enough. Strip.</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Refused & Denied (No Mercy) */}
          {isMyTurn && refusalStatus === 'denied' && (
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
              <button onClick={handleFineIDidIt} className="w-full py-4 bg-gradient-to-r from-rose-900 to-red-900 text-white border border-rose-500/50 rounded-full font-black uppercase text-xs tracking-widest shadow-[0_0_30px_rgba(244,63,94,0.3)] mt-4 flex justify-center items-center space-x-2">
                <span>Fine. I Did It.</span> <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* Judgment Mode (Partner decides) */}
          {!isMyTurn && refusalStatus === 'pending_partners' && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col space-y-4 p-5 bg-black/60 backdrop-blur-xl border border-rose-900/50 rounded-3xl shadow-2xl mt-4">
              <p className="text-center font-black text-white mb-2 uppercase text-[10px] tracking-[0.2em] animate-pulse">
                {partnerData.username} wants to skip!
              </p>
              <div className="flex space-x-3">
                <button onClick={() => handleResolveRefusal('strip')} className="flex-1 py-3 bg-black/40 border border-emerald-900/50 text-emerald-400 rounded-full font-black flex items-center justify-center space-x-1 hover:bg-emerald-950/40 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <CheckCircle2 className="w-3 h-3" /> <span className="text-[9px] uppercase tracking-widest">Mercy</span>
                </button>
                <button onClick={() => handleResolveRefusal('force')} className="flex-1 py-3 bg-gradient-to-r from-rose-600/90 to-red-600/90 text-white rounded-full font-black flex items-center justify-center space-x-1 shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:from-rose-500 border border-rose-500/50 transition-colors">
                  <XCircle className="w-3 h-3" /> <span className="text-[9px] uppercase tracking-widest">No Mercy</span>
                </button>
              </div>
            </motion.div>
          )}

        </div>
      </div>

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
                onClick={() => { setPartnerLeftMsg(null); navigate('/home', { replace: true }); }}
                className="w-full py-3.5 bg-rose-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all text-xs"
              >
                Back to Home
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Notifications overlaying everything */}
      <AnimatePresence>
        {penaltyMessage && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 w-[90%] max-w-sm bg-rose-600 text-white font-black uppercase tracking-widest text-xs text-center py-3 rounded-xl shadow-[0_0_30px_rgba(244,63,94,0.8)] z-[200]">
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
    </div>
  );
}