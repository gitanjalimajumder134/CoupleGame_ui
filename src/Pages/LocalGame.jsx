import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { recordUsedQuestion } from '../utils/history';
import { formatCardText } from '../utils/text';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, AlertTriangle, XCircle, CheckCircle2, ArrowRight, Heart, LogOut, Sparkles, Zap } from 'lucide-react';

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
  };

  const handleRefuse = () => setJudgmentMode(true);  

  const handleJudgment = (decision) => {
    setJudgmentMode(false);
    if (decision === 'strip') {
      setPenaltyMessage(`🔥 ${activePlayer.name} was shown mercy and stripped! 🔥`);
      setTimeout(() => {
        setPenaltyMessage('');
        nextTurn();
      }, 4000);
    } else {
      setRefusalDenied(true); 
    }
  };

  // Get current heat display info
  const heatDisplayName = currentHeatLevel.charAt(0).toUpperCase() + currentHeatLevel.slice(1);
  const heatColors = {
    sparks: 'text-pink-400',
    flames: 'text-red-500',
    wildfire: 'text-orange-500'
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
            onClick={() => navigate('/home')}
            className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-black uppercase tracking-widest shadow-[0_0_30px_rgba(249,115,22,0.6)] hover:from-orange-500 hover:to-red-500 transition-all text-sm"
          >
            {cfg.acceptText}
          </button>
        </motion.div>
      </div>
    );
  }

  // --- ESCALATION DECISION MODAL ---
  if (showEscalation) {
    const cfg = ESCALATION_CONFIG[currentHeatLevel];
    const EscIcon = cfg.icon;
    const deciderPlayer = deciderPlayerNum === 1 ? player1 : player2;
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-sm h-[80vh] px-6 mt-10">
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
      </div>
    );
  }

  // --- TRANSITION SCREEN (PASS THE PHONE) ---
  if (isTransitioning) {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-sm h-[80vh] text-center space-y-8 px-6 bg-black/40 backdrop-blur-xl rounded-[3rem] border border-rose-500/30 shadow-[0_0_50px_rgba(244,63,94,0.2)] mt-10">
        <ArrowRight className="w-20 h-20 text-rose-500 animate-bounce drop-shadow-[0_0_15px_rgba(244,63,94,0.8)]" />
        
        {justEscalated && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-rose-950/80 border border-rose-500 p-5 rounded-3xl animate-pulse shadow-[0_0_40px_rgba(244,63,94,0.5)] w-full">
            <h3 className="text-2xl font-black text-rose-400 uppercase tracking-widest mb-2">🔥 Level Up! 🔥</h3>
            <p className="text-white text-sm font-bold uppercase tracking-wider leading-relaxed">
              Now entering the <br/> <span className="text-rose-400 text-lg font-black">{heatDisplayName}</span> stage.
            </p>
          </motion.div>
        )}

        <div>
          <h2 className="text-3xl font-serif text-white font-black tracking-widest uppercase">Pass the Device</h2>
          <p className="text-rose-300/80 text-sm mt-4 uppercase tracking-widest font-bold">
            Hand it over to <span className="text-white text-lg block mt-2">{activePlayer.name}</span>
          </p>
        </div>
        <button onClick={() => { setIsTransitioning(false); setJustEscalated(false); }} className="w-full py-4 bg-rose-600 text-white font-black uppercase tracking-widest rounded-xl shadow-[0_0_30px_rgba(244,63,94,0.6)] hover:bg-rose-500 transition-all">
          I am {activePlayer.name}, Start!
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-sm space-y-6 relative pt-4 px-2">
      
      {/* --- 🔴 THE PREMIUM MOBILE HUD --- */}
      <div className="w-full bg-neutral-950/80 backdrop-blur-xl border border-rose-500/30 rounded-full p-2 flex justify-between items-center shadow-[0_0_30px_rgba(244,63,94,0.15)] relative z-20">
        
        {/* Player 1 (Left) */}
        <div className={`flex items-center space-x-3 w-1/3 transition-all duration-500 ${activePlayerNum === 1 ? 'opacity-100 scale-105' : 'opacity-40 grayscale-[30%]'}`}>
          <img src={player1.avatar} className={`w-12 h-12 rounded-full object-cover border-2 ${activePlayerNum === 1 ? 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)]' : 'border-neutral-700'}`} alt="P1" />
          <div className="text-left hidden sm:block">
            <p className="text-white font-black text-[10px] uppercase tracking-wider truncate w-16">{player1.name}</p>
            {activePlayerNum === 1 && <p className="text-rose-400 font-black text-[8px] uppercase tracking-widest animate-pulse">Acting</p>}
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

        {/* Player 2 (Right) */}
        <div className={`flex items-center justify-end space-x-3 w-1/3 transition-all duration-500 ${activePlayerNum === 2 ? 'opacity-100 scale-105' : 'opacity-40 grayscale-[30%]'}`}>
          <div className="text-right hidden sm:block">
            <p className="text-white font-black text-[10px] uppercase tracking-wider truncate w-16">{player2.name}</p>
            {activePlayerNum === 2 && <p className="text-rose-400 font-black text-[8px] uppercase tracking-widest animate-pulse">Acting</p>}
          </div>
          <img src={player2.avatar} className={`w-12 h-12 rounded-full object-cover border-2 ${activePlayerNum === 2 ? 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)]' : 'border-neutral-700'}`} alt="P2" />
        </div>
      </div>

      {/* SETTINGS DISPLAY */}
      <div className="w-full px-4 relative z-20 -mt-4 mb-2 flex justify-center space-x-2">
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


      {/* Penalty Notifications */}
      <AnimatePresence>
        {penaltyMessage && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
            className="absolute top-16 w-[90%] bg-rose-600 text-white font-black uppercase tracking-widest text-xs text-center py-3 rounded-xl shadow-[0_0_30px_rgba(244,63,94,0.8)] z-50">
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
        {refusalDenied && (
          <p className="text-rose-400 font-black animate-pulse mt-2 uppercase tracking-widest text-sm bg-rose-950/50 px-4 py-1 rounded-full border border-rose-500/30">No Mercy! Do it.</p>
        )}
      </div>

      {/* The Premium Glass Card */}
      <div className="relative w-72 h-[24rem] cursor-pointer" onClick={handleDrawCard}>
        <AnimatePresence mode="wait">
          {!card ? (
            <motion.div key="back" className={`w-full h-full rounded-[2rem] border border-rose-500/30 backdrop-blur-xl bg-black/40 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(244,63,94,0.15)] hover:scale-105 hover:border-rose-500/60 transition-all duration-300`}>
               <div className="absolute inset-0 bg-gradient-to-br from-rose-900/10 to-transparent rounded-[2rem]"></div>
               <Flame className={`w-20 h-20 text-rose-600 mb-6 opacity-90 drop-shadow-[0_0_20px_rgba(244,63,94,1)] ${loading ? 'animate-spin' : 'animate-pulse'}`} />
               <span className="text-rose-200/60 uppercase tracking-[0.4em] text-xs font-black h-4 flex items-center justify-center">
                 {loading ? (
                   <span className="flex space-x-1 text-base">
                     <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }}>.</motion.span>
                     <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}>.</motion.span>
                     <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}>.</motion.span>
                   </span>
                 ) : (
                   "Tap to Reveal"
                 )}
               </span>
            </motion.div>
          ) : (
            <motion.div key="front" className={`w-full h-full rounded-[2rem] border-2 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center shadow-[0_0_60px_rgba(244,63,94,0.4)] relative overflow-hidden ${card.type === 'Virtual Dare' ? 'border-rose-500 bg-rose-950/50' : card.type === 'Boss Dare' ? 'border-red-600 bg-red-950/80 shadow-[0_0_80px_rgba(220,38,38,0.6)]' : 'border-pink-400 bg-black/60'}`}>
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-rose-600/20 blur-[50px] rounded-full pointer-events-none"></div>
              
              <div className={`text-[10px] uppercase tracking-[0.3em] font-black mb-6 border px-3 py-1.5 rounded-full z-10 ${card.type === 'Virtual Dare' ? 'text-rose-400 border-rose-400/50 bg-rose-950/50' : card.type === 'Boss Dare' ? 'text-red-500 border-red-500/80 bg-red-900/40 drop-shadow-[0_0_5px_rgba(220,38,38,1)] text-xs' : 'text-pink-300 border-pink-300/50 bg-pink-950/50'}`}>
                {card.type}
              </div>
              <p className={`text-2xl font-serif leading-snug text-white z-10 drop-shadow-md ${card.type === 'Boss Dare' ? 'font-black tracking-wide drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]' : ''}`}>
                {formatCardText(
                  card.text, 
                  activePlayerNum === 1 ? player1.name : player2.name,
                  activePlayerNum === 1 ? player2.name : player1.name
                )}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dynamic Action Area */}
      <div className="h-auto w-full flex flex-col justify-center px-4 pb-4">
        
        {/* Active Player Controls - Only Refuse */}
        {card && !judgmentMode && !refusalDenied && (
          <div className="space-y-4">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col space-y-4">
              <button onClick={handleRefuse} className="w-full py-2.5 bg-neutral-950 text-rose-500 border border-rose-900 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-950 flex items-center justify-center space-x-2 transition-all shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                <AlertTriangle className="w-4 h-4" /> <span>Refuse & Strip</span>
              </button>
            </motion.div>

            {/* PARTNER VERIFICATION SECTION */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="pt-2 border-t border-rose-900/50">
              <div className="text-center mb-3">
                <p className="text-rose-400 font-black text-[10px] uppercase tracking-widest">
                  Partner Verification
                </p>
                <p className="text-white/60 text-[9px] uppercase font-bold tracking-widest">
                  Hand phone to {inactivePlayer.name}
                </p>
              </div>
              <div className="flex flex-col space-y-2">
                <button onClick={() => handlePartnerVerdict('success')} className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-black uppercase text-[11px] tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:from-emerald-500 hover:to-teal-500 transition-all flex justify-center items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4" /> <span>They nailed it. (Satisfied)</span>
                </button>
                <button onClick={() => handlePartnerVerdict('fail')} className="w-full py-3 bg-neutral-950 border border-red-600 text-red-500 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-950/30 transition-all flex justify-center items-center space-x-2">
                  <XCircle className="w-4 h-4" /> <span>Not good enough. Strip.</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Refused & Denied (No Mercy) */}
        {refusalDenied && (
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
            <button onClick={nextTurn} className="w-full py-4 bg-rose-900 text-white border-2 border-rose-500 rounded-xl font-black uppercase text-xs tracking-widest shadow-[0_0_30px_rgba(244,63,94,0.6)]">
              Fine. I Completed It.
            </button>
          </motion.div>
        )}

        {/* Judgment Mode (Partner decides) */}
        {judgmentMode && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col space-y-3 p-3 bg-rose-950/80 border border-rose-500 rounded-2xl shadow-2xl">
            <p className="text-center font-black text-white mb-1 uppercase text-[10px] tracking-widest animate-pulse">
              {inactivePlayer.name}, show mercy?
            </p>
            <div className="flex space-x-2">
              <button onClick={() => handleJudgment('strip')} className="flex-1 py-2 bg-neutral-950 border border-rose-500 text-rose-400 rounded-lg font-black flex items-center justify-center space-x-1 hover:bg-rose-900 transition-colors">
                <CheckCircle2 className="w-3 h-3" /> <span className="text-[10px] uppercase tracking-wider">Mercy</span>
              </button>
              <button onClick={() => handleJudgment('force')} className="flex-1 py-2 bg-rose-600 text-white rounded-lg font-black flex items-center justify-center space-x-1 shadow-lg hover:bg-rose-500 transition-colors">
                <XCircle className="w-3 h-3" /> <span className="text-[10px] uppercase tracking-wider">No Mercy</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>

      <button onClick={() => navigate('/home')} className="absolute -top-2 left-4 text-neutral-500 hover:text-rose-500 flex items-center space-x-1 transition-colors">
        <LogOut className="w-4 h-4" /> <span className="text-[9px] uppercase font-black tracking-widest">Quit Game</span>
      </button>
    </div>
  );
}