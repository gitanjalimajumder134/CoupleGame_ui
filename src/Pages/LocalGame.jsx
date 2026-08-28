import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { recordUsedQuestion } from '../utils/history';
import { formatCardText } from '../utils/text';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, AlertTriangle, XCircle, CheckCircle2, ArrowRight, Heart, LogOut, Sparkles, Zap } from 'lucide-react';
import CinematicDeck from '../components/game/CinematicDeck';
import BurnTransition from '../components/PremiumDice/BurnTransition';

const FALLBACK_P2_AVATAR = "https://api.dicebear.com/7.x/micah/svg?seed=Leo&backgroundColor=e2e8f0";

// --- ESCALATION CONFIG ---
const ESCALATION_CONFIG = {
  sparks: {
    threshold: [7, 8],
    retryAfter: 10,
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
    threshold: [10, 12],
    retryAfter: 12,
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
    threshold: [12, 15],
    retryAfter: null,
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

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function LocalGame({ socket }) {
  const { state } = useLocation();
  const navigate = useNavigate();
  
  // Get Player 1's real avatar from Local Storage
  const localUser = JSON.parse(localStorage.getItem('ignite_user') || '{}');

  const [player1] = useState({ 
    name: (state?.player1?.name || localUser.name || 'Player 1').split(' ')[0], 
    gender: state?.player1?.gender || 'F',
    avatar: state?.player1?.avatar || localUser.avatar || "https://api.dicebear.com/7.x/lorelei/svg?seed=Mia&backgroundColor=ffc0cb"
  });
  
  const [player2] = useState({ 
    name: (state?.player2?.name || 'Player 2').split(' ')[0], 
    gender: state?.player2?.gender || 'M',
    avatar: state?.player2?.avatar || FALLBACK_P2_AVATAR
  });

  // Game States
  const [activePlayerNum, setActivePlayerNum] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false); 
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isBurning, setIsBurning] = useState(false);
  const [pendingBurnAction, setPendingBurnAction] = useState(null);
  
  const [judgmentMode, setJudgmentMode] = useState(false);
  const [refusalDenied, setRefusalDenied] = useState(false);
  const [penaltyMessage, setPenaltyMessage] = useState('');
  const [deniedPenalty, setDeniedPenalty] = useState(null);

  // --- ESCALATION STATE ---
  const [currentHeatLevel, setCurrentHeatLevel] = useState(state?.startingIntimacy || 'sparks');
  const [cardsDrawn, setCardsDrawn] = useState(0);
  const [escalationThreshold, setEscalationThreshold] = useState(() => {
    const initLevel = state?.startingIntimacy || 'sparks';
    const cfg = ESCALATION_CONFIG[initLevel];
    return randomBetween(cfg.threshold[0], cfg.threshold[1]);
  });
  const [showEscalation, setShowEscalation] = useState(false);
  const [deciderPlayerNum, setDeciderPlayerNum] = useState(1);
  const [showGameOver, setShowGameOver] = useState(false);
  const [justEscalated, setJustEscalated] = useState(false);
  
  const [heatScore, setHeatScore] = useState(0);

  // --- SMART SCORING HISTORY ---
  const [history, setHistory] = useState({
    topics: [],
    items: [],
    moods: []
  });

  // --- NEW: Local Deck from API ---
  const [localDeck, setLocalDeck] = useState(state?.preloadedQuestions || { sparks: [], flames: [], wildfire: [] });

  const activePlayer = activePlayerNum === 1 ? player1 : player2;
  const inactivePlayer = activePlayerNum === 1 ? player2 : player1;

  useEffect(() => {
    socket.on('localCardDrawn', (drawnCard) => {
      setCard(drawnCard);
      setLoading(false);
    });

    return () => { socket.off('localCardDrawn'); };
  }, [socket]);

  // Scroll to top on state changes to ensure the viewport is always correctly positioned
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [card, isTransitioning, showEscalation, showGameOver]);

  const handleDrawCard = () => {
    if (!card && !loading) {
      setLoading(true);
      
      const currentStageDeck = localDeck[currentHeatLevel] || [];

      if (currentStageDeck.length > 0) {
        // --- SMART SCORING ALGORITHM (Phase 4) ---
        
        // 1. Calculate Target Intensity based on game progress
        let targetIntensity = 5;
        const currentThreshold = ESCALATION_CONFIG[currentHeatLevel]?.threshold[0] || 10;
        const progress = Math.min(1, cardsDrawn / currentThreshold);

        if (currentHeatLevel === 'sparks') {
          targetIntensity = 1 + (progress * 3); // 1 to 4
        } else if (currentHeatLevel === 'flames') {
          targetIntensity = 5 + (progress * 2); // 5 to 7
        } else if (currentHeatLevel === 'wildfire') {
          targetIntensity = 8 + (progress * 2); // 8 to 10
        }

        // 2. Calculate Target Energy
        let targetEnergy = 'calm';
        if (currentHeatLevel === 'sparks') {
           targetEnergy = Math.random() > 0.3 ? 'playful' : 'calm';
        } else if (currentHeatLevel === 'flames') {
           targetEnergy = Math.random() > 0.5 ? 'sensual' : 'aggressive';
        } else if (currentHeatLevel === 'wildfire') {
           targetEnergy = Math.random() > 0.3 ? 'aggressive' : 'sensual';
        }

        // 3. Score all available questions
        const scoredDeck = currentStageDeck.map(q => {
           let score = 100;

           // Intensity Match Penalty (-5 pts per diff)
           const intensityDiff = Math.abs((q.intensity || 5) - targetIntensity);
           score -= (intensityDiff * 5); 

           // Energy Match Bonus (+20 max)
           if (q.energy === targetEnergy) score += 20;

           // History Penalty (-50 max) to force extreme variety
           if (history.topics.includes(q.topic)) score -= 30;
           if (q.items && q.items.length > 0 && history.items.includes(q.items[0])) score -= 15;
           if (q.mood && q.mood.some(m => history.moods.includes(m))) score -= 10;

           return { ...q, score };
        });

        // 4. Sort descending and pick randomly from Top 3 for variance
        scoredDeck.sort((a, b) => b.score - a.score);
        const topCandidates = scoredDeck.slice(0, 3);
        const bestCard = topCandidates[Math.floor(Math.random() * topCandidates.length)];
        const bestCardIndex = currentStageDeck.findIndex(q => q.id === bestCard.id);

        const drawnCard = currentStageDeck[bestCardIndex];
        
        // Map fields if necessary to match old format
        const mappedCard = {
          id: drawnCard.id,
          type: drawnCard.category,
          text: drawnCard.question
        };

        // Update Smart Scoring History
        setHistory(prev => ({
           topics: [drawnCard.topic, ...prev.topics].slice(0, 3),
           items: drawnCard.items && drawnCard.items.length > 0 ? [drawnCard.items[0], ...prev.items].slice(0, 3) : prev.items,
           moods: drawnCard.mood ? [...drawnCard.mood, ...prev.moods].slice(0, 3) : prev.moods
        }));

        // Remove from the current stage's deck so it isn't drawn again
        setLocalDeck(prev => ({
          ...prev,
          [currentHeatLevel]: prev[currentHeatLevel].filter((_, i) => i !== bestCardIndex)
        }));
        
        recordUsedQuestion(drawnCard.id);
        
        setCard(mappedCard);
        setLoading(false);
      } else {
        // If the API returned 0 questions (e.g. strict filters), show a fallback card
        setCard({
          id: 'error_empty',
          type: 'Deck Empty',
          text: 'No cards match your current mood or filters! Go back to the lobby and try different settings.'
        });
        setLoading(false);
      }
    }
  };

  const nextTurn = () => {
    const newCount = cardsDrawn + 1;
    setCardsDrawn(newCount);

    // Check escalation threshold
    if (newCount >= escalationThreshold) {
      const cfg = ESCALATION_CONFIG[currentHeatLevel];
      
      if (currentHeatLevel === 'wildfire') {
        // Wildfire ending
        setShowGameOver(true);
        return;
      }
      
      if (cfg && cfg.nextLevel && localDeck[cfg.nextLevel] && localDeck[cfg.nextLevel].length > 0) {
        // Pick random decider
        setDeciderPlayerNum(Math.random() < 0.5 ? 1 : 2);
        setShowEscalation(true);
        return;
      }
    }

    // Normal turn advance
    setCard(null);
    setRefusalDenied(false);
    setActivePlayerNum(activePlayerNum === 1 ? 2 : 1);
    setIsTransitioning(true); 
  };

  const handleEscalationAccept = () => {
    const cfg = ESCALATION_CONFIG[currentHeatLevel];
    const newLevel = cfg.nextLevel;
    setCurrentHeatLevel(newLevel);
    setCardsDrawn(0);
    const newCfg = ESCALATION_CONFIG[newLevel];
    setEscalationThreshold(randomBetween(newCfg.threshold[0], newCfg.threshold[1]));
    setShowEscalation(false);
    // Continue turn
    setCard(null);
    setRefusalDenied(false);
    setActivePlayerNum(activePlayerNum === 1 ? 2 : 1);
    setJustEscalated(true);
    setIsTransitioning(true);
  };

  const handleEscalationDecline = () => {
    const cfg = ESCALATION_CONFIG[currentHeatLevel];
    setCardsDrawn(0);
    setEscalationThreshold(cfg.retryAfter);
    setShowEscalation(false);
    // Continue turn
    setCard(null);
    setRefusalDenied(false);
    setActivePlayerNum(activePlayerNum === 1 ? 2 : 1);
    setIsTransitioning(true);
  };

  const handlePartnerVerdict = (decision) => {
    const wasBossDare = card && card.type === 'Boss Dare';
    
    setIsBurning(true);
    setPendingBurnAction(() => () => {
      if (decision === 'success') {
        if (wasBossDare) {
          setHeatScore(0);
        } else {
          setHeatScore(prev => Math.min(100, prev + 20));
        }
        nextTurn();
      } else if (decision === 'fail') {
        if (wasBossDare) {
          setHeatScore(0);
        } else {
          setHeatScore(prev => Math.max(0, prev - 10));
        }
        setDeniedPenalty(`🔥 DENIED! ${activePlayer.name} MUST STRIP! 🔥`);
        // Wait 4 seconds for penalty animation, then auto-advance
        setTimeout(() => {
          setDeniedPenalty(null);
          nextTurn();
        }, 4000);
      }
    });
  };

  const handleRefuse = () => setJudgmentMode(true);  

  const handleJudgment = (decision) => {
    setJudgmentMode(false);
    
    if (decision === 'strip') {
      setIsBurning(true);
      setPendingBurnAction(() => () => {
        setPenaltyMessage(`🔥 ${activePlayer.name} was shown mercy and stripped! 🔥`);
        setTimeout(() => {
          setPenaltyMessage('');
          nextTurn();
        }, 4000);
      });
    } else {
      setRefusalDenied(true); 
    }
  };

  const handleRefusalDeniedComplete = () => {
    setIsBurning(true);
    setPendingBurnAction(() => () => {
      nextTurn();
    });
  };

  // Get current heat display info
  const heatDisplayName = currentHeatLevel.charAt(0).toUpperCase() + currentHeatLevel.slice(1);
  const heatColors = {
    sparks: 'text-pink-400',
    flames: 'text-red-500',
    wildfire: 'text-orange-500'
  };

  // --- WILDFIRE GAME OVER MODAL ---
  const renderGameOver = () => {
    const cfg = ESCALATION_CONFIG.wildfire;
    const GameOverIcon = cfg.icon;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`w-full bg-gradient-to-b ${cfg.bgGradient} backdrop-blur-xl border-2 ${cfg.borderColor} rounded-[3rem] p-10 text-center shadow-[0_0_80px_${cfg.glowColor}] relative overflow-hidden`}
      >
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-orange-600/20 blur-[80px] rounded-full pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-red-600/20 blur-[80px] rounded-full pointer-events-none"></div>
        
        <GameOverIcon className={`w-16 h-16 ${cfg.iconColor} mx-auto mb-6 animate-pulse drop-shadow-[0_0_30px_${cfg.glowColor}]`} />
        
        <h2 className="text-2xl font-serif text-white font-black tracking-widest uppercase mb-3">
          {cfg.title}
        </h2>
        <p className="text-orange-200/80 text-sm font-bold mb-8 leading-relaxed">
          {cfg.subtitle}
        </p>
        
        <button
          onClick={() => navigate('/home', { replace: true })}
          className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-black uppercase tracking-widest shadow-[0_0_30px_rgba(249,115,22,0.6)] hover:from-orange-500 hover:to-red-500 transition-all text-sm"
        >
          {cfg.acceptText}
        </button>
      </motion.div>
    );
  };

  // --- ESCALATION DECISION MODAL ---
  const renderEscalation = () => {
    const cfg = ESCALATION_CONFIG[currentHeatLevel];
    const EscIcon = cfg.icon;
    const deciderPlayer = deciderPlayerNum === 1 ? player1 : player2;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        className={`w-full bg-gradient-to-b ${cfg.bgGradient} backdrop-blur-xl border-2 ${cfg.borderColor} rounded-[3rem] p-8 text-center shadow-[0_0_60px_${cfg.glowColor}] relative overflow-hidden`}
      >
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-rose-600/15 blur-[80px] rounded-full pointer-events-none"></div>
        
        <p className="text-[10px] uppercase tracking-[0.3em] font-black text-white/40 mb-4">
          {deciderPlayer.name}'s Decision
        </p>

        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <EscIcon className={`w-14 h-14 ${cfg.iconColor} mx-auto mb-5 drop-shadow-[0_0_25px_${cfg.glowColor}]`} />
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
            className={`w-full py-4 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-xl font-black uppercase tracking-widest shadow-[0_0_25px_${cfg.glowColor}] hover:from-rose-500 hover:to-red-500 transition-all text-xs`}
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
      </motion.div>
    );
  };

  // --- TRANSITION SCREEN (PASS THE PHONE) ---
  const renderTransitionScreen = () => {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center w-full text-center relative px-4"
      >
        {/* Background Glow */}
        <motion.div 
          animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 bg-rose-600/20 blur-[100px] rounded-full pointer-events-none"
        />

        {justEscalated && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 bg-gradient-to-b from-rose-950/80 to-black/80 border border-rose-500/40 p-5 rounded-3xl shadow-[0_0_30px_rgba(244,63,94,0.3)] w-full relative z-10"
          >
            <h3 className="text-xl font-black text-rose-400 uppercase tracking-widest mb-1 drop-shadow-md">🔥 Level Up! 🔥</h3>
            <p className="text-white/80 text-xs font-bold uppercase tracking-wider">
              Entering the <span className="text-rose-400 text-sm font-black drop-shadow-sm">{heatDisplayName}</span> stage
            </p>
          </motion.div>
        )}

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
          className="relative z-10"
        >
          <h2 className="text-[28px] leading-tight font-serif text-white font-black tracking-wide drop-shadow-[0_0_20px_rgba(244,63,94,0.6)]">
            That was interesting... 👀
          </h2>
        </motion.div>

        {/* Handoff Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.8 }}
          className="mt-5 mb-8 space-y-1 relative z-10"
        >
          <p className="text-rose-300/90 text-sm font-bold tracking-widest uppercase drop-shadow-md">
            Your turn is over. ❤️
          </p>
          <p className="text-white/50 text-[10px] uppercase tracking-[0.25em] font-black">
            Pass the phone to {activePlayer.name}
          </p>
        </motion.div>

        {/* Avatar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5, type: 'spring', damping: 15 }}
          className="relative mb-8 z-10"
        >
          {/* Glowing rings */}
          <div className="absolute -inset-4 border border-rose-500/30 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
          <div className="absolute -inset-2 border-2 border-rose-500/50 rounded-full animate-pulse" />
          
          <img 
            src={activePlayer.avatar} 
            alt={activePlayer.name}
            className="w-24 h-24 rounded-full object-cover border-[3px] border-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.8)] relative z-10"
          />
        </motion.div>

        {/* Player Name & Deck text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="mb-10 relative z-10"
        >
          <h3 className="text-2xl font-black text-white uppercase tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            {activePlayer.name}
          </h3>
          <p className="text-rose-400/80 text-[10px] font-black uppercase tracking-[0.3em] mt-2 drop-shadow-sm">
            The deck is waiting...
          </p>
        </motion.div>

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2, type: 'spring', damping: 20 }}
          className="w-full relative z-20"
        >
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setIsTransitioning(false); setJustEscalated(false); }}
            className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs relative overflow-hidden group shadow-[0_0_40px_rgba(220,38,38,0.5)] border border-rose-400/50"
            style={{
              background: 'linear-gradient(135deg, #be123c, #e11d48)'
            }}
          >
            <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-700 ease-in-out pointer-events-none" />
            <span className="relative text-white drop-shadow-md">I'M {activePlayer.name} — LET'S GO 🔥</span>
          </motion.button>
        </motion.div>
      </motion.div>
    );
  };

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
            <button onClick={() => navigate('/home', { replace: true })} className="text-white/40 hover:text-rose-500 flex items-center space-x-1.5 transition-colors bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 hover:border-rose-500/50 shadow-lg">
              <LogOut className="w-3 h-3" /> <span className="text-[9px] uppercase font-black tracking-widest">Quit</span>
            </button>
          </div>

          {/* --- 🔴 YOU ❤️ PARTNER COMPOSITION --- */}
          <div className="w-full flex justify-between items-center relative z-20 mt-2">
            {/* Subtle connecting line */}
            <div className="absolute top-1/2 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-rose-500/20 to-transparent -z-10" />
            
            {/* Player 1 (Left) */}
            <div className={`flex flex-col items-center space-y-2 transition-all duration-700 ${activePlayerNum === 1 ? 'opacity-100 scale-105' : 'opacity-40 grayscale-[50%]'}`}>
              <div className={`relative p-1 rounded-full ${activePlayerNum === 1 ? 'lux-edge-glow shadow-[0_0_20px_rgba(244,63,94,0.4)]' : 'border border-neutral-800'}`}>
                <img src={player1.avatar} className="w-12 h-12 rounded-full object-cover" alt="P1" />
              </div>
              <div className="text-center">
                <p className="text-white font-black text-[9px] uppercase tracking-[0.2em]">{player1.name}</p>
              </div>
            </div>

            {/* Center Heartbeat & Status */}
            <div className="flex flex-col items-center justify-center">
              <Heart className="w-6 h-6 text-rose-600 animate-heartbeat-glow drop-shadow-[0_0_15px_rgba(244,63,94,0.8)] fill-current" />
              <span className={`text-[7px] font-black uppercase tracking-[0.3em] mt-2 ${heatColors[currentHeatLevel]}`}>{heatDisplayName}</span>
              <p className="text-rose-300/80 font-bold text-[8px] uppercase tracking-widest mt-1">
                {activePlayerNum === 1 ? `Your Turn ❤️` : `Their Turn 👀`}
              </p>
            </div>

            {/* Player 2 (Right) */}
            <div className={`flex flex-col items-center space-y-2 transition-all duration-700 ${activePlayerNum === 2 ? 'opacity-100 scale-105' : 'opacity-40 grayscale-[50%]'}`}>
              <div className={`relative p-1 rounded-full ${activePlayerNum === 2 ? 'lux-edge-glow shadow-[0_0_20px_rgba(244,63,94,0.4)]' : 'border border-neutral-800'}`}>
                <img src={player2.avatar} className="w-12 h-12 rounded-full object-cover" alt="P2" />
              </div>
              <div className="text-center">
                <p className="text-white font-black text-[9px] uppercase tracking-[0.2em]">{player2.name}</p>
              </div>
            </div>
          </div>

          {/* SETTINGS DISPLAY */}
          <div className="w-full relative z-20 flex justify-center space-x-2 mt-2">
            <span className="bg-black/50 border border-[#54152A]/50 text-white/50 text-[8px] uppercase tracking-widest font-black py-1 px-2 rounded-full">
              Turn Order: {state?.turnOrder || 'Alternate'}
            </span>
            {state?.timer > 0 && (
              <span className="bg-black/50 border border-[#54152A]/50 text-white/50 text-[8px] uppercase tracking-widest font-black py-1 px-2 rounded-full">
                Timer: {state?.timer}s
              </span>
            )}
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
          <div className="w-[300px] sm:w-[320px] relative flex items-center justify-center">
            <AnimatePresence mode="wait">
              {showGameOver ? (
                <motion.div key="game-over" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
                  {renderGameOver()}
                </motion.div>
              ) : showEscalation ? (
                <motion.div key="escalation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
                  {renderEscalation()}
                </motion.div>
              ) : isTransitioning ? (
                <motion.div key="transition" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
                  {renderTransitionScreen()}
                </motion.div>
              ) : (
                <motion.div key="deck" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-[440px]">
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
                      loading={loading}
                      isMyTurn={true} // In local game, it's always "my turn" because device is shared
                      onDraw={handleDrawCard}
                      activePlayerName={activePlayer.name}
                      inactivePlayerName={inactivePlayer.name}
                      heatLevel={currentHeatLevel}
                    />
                  </BurnTransition>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ========================================= */}
        {/* BOTTOM SECTION: Interaction Controls      */}
        {/* ========================================= */}
        <div className="w-full px-4 pb-6 shrink-0 z-30 min-h-[160px] flex flex-col justify-end">
          
          <div className="text-center mb-2">
            {refusalDenied && (
              <p className="text-rose-400 font-black animate-pulse uppercase tracking-widest text-sm bg-rose-950/50 px-4 py-1 rounded-full border border-rose-500/30 inline-block">No Mercy! Do it.</p>
            )}
          </div>

          {/* ACTIVE PLAYER: REFUSE */}
          {card && !judgmentMode && !refusalDenied && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex justify-center mb-6">
              <button onClick={handleRefuse} className="px-6 py-2.5 bg-black/40 backdrop-blur-md text-rose-500 border border-rose-900/50 rounded-full font-black uppercase text-[9px] tracking-[0.2em] hover:bg-rose-950/50 flex items-center justify-center space-x-2 transition-all shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                <AlertTriangle className="w-3 h-3" /> <span>Refuse & Strip</span>
              </button>
            </motion.div>
          )}

          {/* PARTNER VERIFICATION SECTION */}
          {card && !judgmentMode && !refusalDenied && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="pt-4 border-t border-neutral-800">
              <div className="text-center mb-4">
                <p className="text-rose-400/80 font-black text-[9px] uppercase tracking-[0.3em]">
                  Partner Verification
                </p>
                <p className="text-white/40 text-[8px] uppercase font-bold tracking-widest mt-1">
                  Hand phone to {inactivePlayer.name}
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
          {refusalDenied && (
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
              <button onClick={handleRefusalDeniedComplete} className="w-full py-4 bg-gradient-to-r from-rose-900 to-red-900 text-white border border-rose-500/50 rounded-full font-black uppercase text-xs tracking-widest shadow-[0_0_30px_rgba(244,63,94,0.3)] mt-4 flex justify-center items-center space-x-2">
                <span>Fine. I Completed It.</span> <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* Judgment Mode (Partner decides) */}
          {judgmentMode && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col space-y-4 p-5 bg-black/60 backdrop-blur-xl border border-rose-900/50 rounded-3xl shadow-2xl mt-4">
              <p className="text-center font-black text-white mb-2 uppercase text-[10px] tracking-[0.2em] animate-pulse">
                {inactivePlayer.name}, show mercy?
              </p>
              <div className="flex space-x-3">
                <button onClick={() => handleJudgment('strip')} className="flex-1 py-3 bg-black/40 border border-emerald-900/50 text-emerald-400 rounded-full font-black flex items-center justify-center space-x-1 hover:bg-emerald-950/40 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <CheckCircle2 className="w-3 h-3" /> <span className="text-[9px] uppercase tracking-widest">Mercy</span>
                </button>
                <button onClick={() => handleJudgment('force')} className="flex-1 py-3 bg-gradient-to-r from-rose-600/90 to-red-600/90 text-white rounded-full font-black flex items-center justify-center space-x-1 shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:from-rose-500 border border-rose-500/50 transition-colors">
                  <XCircle className="w-3 h-3" /> <span className="text-[9px] uppercase tracking-widest">No Mercy</span>
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      
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