import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { recordUsedQuestion } from '../utils/history';
import { formatCardText } from '../utils/text';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Dices, Heart, LogOut, CheckCircle2, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import Dice3D from '../components/Dice3D';
import CardSelectionPopup from '../components/PremiumDice/CardSelectionPopup';
import SolitaireCardBoard from '../components/PremiumDice/SolitaireCardBoard';

const FALLBACK_P2_AVATAR = "https://api.dicebear.com/7.x/micah/svg?seed=Leo&backgroundColor=e2e8f0";

const INTENSITY_COLORS = {
  tease: { bg: 'from-violet-950/60 to-black', border: 'border-violet-400', text: 'text-violet-300', glow: 'rgba(139,92,246,0.4)' },
  flirty: { bg: 'from-fuchsia-950/60 to-black', border: 'border-fuchsia-400', text: 'text-fuchsia-300', glow: 'rgba(217,70,239,0.4)' },
  hot: { bg: 'from-pink-950/60 to-black', border: 'border-pink-400', text: 'text-pink-300', glow: 'rgba(236,72,153,0.4)' },
  steamy: { bg: 'from-rose-950/60 to-black', border: 'border-rose-400', text: 'text-rose-300', glow: 'rgba(244,63,94,0.5)' },
  extreme: { bg: 'from-red-950/60 to-black', border: 'border-red-500', text: 'text-red-400', glow: 'rgba(239,68,68,0.5)' },
  wildcard: { bg: 'from-amber-950/60 to-black', border: 'border-amber-400', text: 'text-amber-300', glow: 'rgba(251,191,36,0.5)' },
};

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

function generateLocalBoard() {
  const board = [];
  let slotCounter = 0;
  for (let diceNum = 1; diceNum <= 6; diceNum++) {
    for (let i = 0; i < 6; i++) {
      board.push({ slotId: slotCounter++, diceNumber: diceNum, task: null, revealed: false, consumed: false });
    }
  }
  return board;
}

export default function LocalSpicyDice({ socket }) {
  const { state } = useLocation();
  const navigate = useNavigate();

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

  const [activePlayerNum, setActivePlayerNum] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true); // Default to true to enforce a user click on load
  const [board, setBoard] = useState(() => generateLocalBoard());
  const [diceResult, setDiceResult] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [rollingTarget, setRollingTarget] = useState(null);
  const [revealedTask, setRevealedTask] = useState(null);
  const [revealedSlotId, setRevealedSlotId] = useState(null);
  const [isDeckReady, setIsDeckReady] = useState(false);
  const [deniedPenalty, setDeniedPenalty] = useState(null);
  const [boardExhausted, setBoardExhausted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCardPopup, setShowCardPopup] = useState(false);

  const activePlayer = activePlayerNum === 1 ? player1 : player2;
  const inactivePlayer = activePlayerNum === 1 ? player2 : player1;

  useEffect(() => {
    socket.on('localDiceCardDrawn', (task) => {
      setRevealedTask(task);
      setLoading(false);
      if (task?.id) recordUsedQuestion(task.id);
      if (revealedSlotId !== null) {
        setBoard(prev => prev.map(s => s.slotId === revealedSlotId ? { ...s, revealed: true, task } : s));
      }
    });
    return () => { socket.off('localDiceCardDrawn'); };
  }, [socket, revealedSlotId]);

  const handleRollDice = () => {
    if (diceResult || revealedTask || isRolling) return;
    setIsRolling(true);

    let result = Math.floor(Math.random() * 6) + 1;
    // Ensure there's at least one matching unconsumed card
    const hasMatch = board.some(s => s.diceNumber === result && !s.consumed);
    if (!hasMatch) {
      const available = [...new Set(board.filter(s => !s.consumed).map(s => s.diceNumber))];
      if (available.length > 0) {
        result = available[Math.floor(Math.random() * available.length)];
      }
    }

    setRollingTarget(result);
  };

  const handleRollComplete = (finalNumber) => {
    setDiceResult(finalNumber);
    setIsRolling(false);
    setRollingTarget(null);

    setTimeout(() => {
      setShowCardPopup(true);
    }, 1500);
  };

  const handlePickCard = (slotId) => {
    if (!diceResult || revealedTask || loading) return;
    const slot = board.find(s => s.slotId === slotId);
    if (!slot || slot.consumed || slot.diceNumber !== diceResult) return;

    setRevealedSlotId(slotId);
    setLoading(true);
    socket.emit('drawLocalDiceCard', { diceNumber: slot.diceNumber });
  };

  const nextTurn = () => {
    // Mark consumed
    if (revealedSlotId !== null) {
      setBoard(prev => prev.map(s => s.slotId === revealedSlotId ? { ...s, consumed: true } : s));
    }

    // Check exhaustion
    const remaining = board.filter(s => !s.consumed).length - 1; // minus the one we just consumed
    if (remaining <= 0) {
      setBoardExhausted(true);
      return;
    }

    setDiceResult(null);
    setRevealedTask(null);
    setRevealedSlotId(null);
    setShowCardPopup(false);
    setActivePlayerNum(activePlayerNum === 1 ? 2 : 1);
    setIsTransitioning(true);
  };

  const handlePartnerVerdict = (decision) => {
    if (decision === 'success') {
      nextTurn();
    } else if (decision === 'fail') {
      setDeniedPenalty(`🔥 DENIED! ${activePlayer.name} MUST STRIP! 🔥`);
      setTimeout(() => {
        setDeniedPenalty(null);
        nextTurn();
      }, 4000);
    }
  };

  const handleNewRound = () => {
    setIsDeckReady(false);
    setBoard(generateLocalBoard());
    setDiceResult(null);
    setRollingTarget(null);
    setRevealedTask(null);
    setRevealedSlotId(null);
    setBoardExhausted(false);
    setShowCardPopup(false);
    setActivePlayerNum(Math.random() < 0.5 ? 1 : 2);
    setIsTransitioning(true);
  };

  if (boardExhausted) {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-sm h-[80vh] px-6 mt-10">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          className="w-full bg-gradient-to-b from-purple-950/90 to-black backdrop-blur-xl border-2 border-purple-500 rounded-[3rem] p-10 text-center relative overflow-hidden"
          style={{ boxShadow: '0 0 80px rgba(139,92,246,0.4)' }}>
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-amber-600/10 blur-[80px] rounded-full pointer-events-none"></div>
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-rose-600/10 blur-[80px] rounded-full pointer-events-none"></div>
          <Dices className="w-16 h-16 text-amber-500/80 mx-auto mb-6 animate-pulse" style={{ filter: 'drop-shadow(0 0 30px rgba(251,191,36,0.4))' }} />
          <h2 className="text-2xl font-serif text-white font-black tracking-widest uppercase mb-3">Board Cleared! 🎲</h2>
          <p className="text-amber-200/60 text-sm font-bold mb-8 leading-relaxed">All cards have been revealed. Ready for another round?</p>
          <div className="space-y-3">
            <button onClick={handleNewRound} className="w-full py-4 bg-gradient-to-r from-amber-700 to-rose-700 text-white rounded-xl font-black uppercase tracking-widest hover:from-amber-600 hover:to-rose-600 transition-all text-sm" style={{ boxShadow: '0 0 30px rgba(251,191,36,0.2)' }}>
              🎲 New Round
            </button>
            <button onClick={() => navigate('/home')} className="w-full py-3 bg-neutral-950 text-purple-400 border border-purple-900 rounded-xl font-black uppercase tracking-widest hover:bg-purple-950/30 transition-all text-xs">
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isTransitioning) {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-sm h-[80vh] text-center space-y-8 px-6 bg-black/40 backdrop-blur-xl rounded-[3rem] border border-amber-500/30 shadow-[0_0_50px_rgba(251,191,36,0.2)] mt-10">
        <ArrowRight className="w-20 h-20 text-amber-500 animate-bounce drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]" />
        <div>
          <h2 className="text-3xl font-serif text-white font-black tracking-widest uppercase">Pass the Device</h2>
          <p className="text-amber-300/80 text-sm mt-4 uppercase tracking-widest font-bold">
            Hand it over to <span className="text-white text-lg block mt-2">{activePlayer.name}</span>
          </p>
        </div>
        <button onClick={() => setIsTransitioning(false)}
          className="w-full py-4 bg-amber-600 text-white font-black uppercase tracking-widest rounded-xl shadow-[0_0_30px_rgba(251,191,36,0.6)] hover:bg-amber-500 transition-all">
          I am {activePlayer.name}, Start!
        </button>
      </div>
    );
  }

  const remainingCards = board.filter(s => !s.consumed).length;

  return (
    <div className="flex flex-col items-center w-full max-w-sm h-screen space-y-4 relative pt-4 px-2 overflow-hidden">
      <AnimatePresence>
        {deniedPenalty && (
          <motion.div initial={{ scale: 0.5, opacity: 0, rotate: -10 }} animate={{ scale: 1.1, opacity: 1, rotate: 0 }} exit={{ scale: 1.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-purple-900/60 backdrop-blur-sm"></div>
            <div className="bg-black/90 border-4 border-purple-600 p-8 rounded-[3rem] text-center shadow-[0_0_100px_rgba(139,92,246,0.8)] relative z-10 transform -rotate-6">
              <h1 className="text-6xl font-black text-purple-400 tracking-widest mb-4 drop-shadow-[0_0_20px_rgba(139,92,246,1)]">DENIED</h1>
              <p className="text-white text-lg font-bold uppercase tracking-widest bg-purple-600 py-2 px-6 rounded-full inline-block">{deniedPenalty}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full glass-panel rounded-full p-2 flex justify-between items-center relative z-20">
        <div className={`flex items-center space-x-3 w-1/3 transition-all duration-500 ${activePlayerNum === 1 ? 'opacity-100 scale-105' : 'opacity-40 grayscale-[30%]'}`}>
          <img src={player1.avatar} className={`w-12 h-12 rounded-full object-cover border-2 ${activePlayerNum === 1 ? 'border-amber-500 shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'border-neutral-700'}`} alt="P1" />
          <div className="text-left hidden sm:block">
            <p className="text-white font-black text-[10px] uppercase tracking-wider truncate w-16">{player1.name}</p>
            {activePlayerNum === 1 && <p className="text-amber-400/80 font-black text-[8px] uppercase tracking-widest animate-pulse">Acting</p>}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center w-1/3">
          <Dices className="w-6 h-6 text-amber-500/60 animate-pulse" />
          <span className="text-[7px] font-black uppercase tracking-widest mt-1 text-amber-500/60">{remainingCards} left</span>
        </div>

        <div className={`flex items-center justify-end space-x-3 w-1/3 transition-all duration-500 ${activePlayerNum === 2 ? 'opacity-100 scale-105' : 'opacity-40 grayscale-[30%]'}`}>
          <div className="text-right hidden sm:block">
            <p className="text-white font-black text-[10px] uppercase tracking-wider truncate w-16">{player2.name}</p>
            {activePlayerNum === 2 && <p className="text-amber-400/80 font-black text-[8px] uppercase tracking-widest animate-pulse">Acting</p>}
          </div>
          <img src={player2.avatar} className={`w-12 h-12 rounded-full object-cover border-2 ${activePlayerNum === 2 ? 'border-amber-500 shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'border-neutral-700'}`} alt="P2" />
        </div>
      </div>

      <LayoutGroup>
        <SolitaireCardBoard board={board} onDeckReady={() => setIsDeckReady(true)} activePopupDiceNumber={showCardPopup ? diceResult : null} />

        <div className="w-full flex flex-col items-center justify-center relative flex-1 z-10" style={{ minHeight: '300px' }}>
          <div className="z-10 relative">
            <Dice3D targetNumber={rollingTarget || diceResult} isRolling={isRolling} onRollComplete={handleRollComplete} />
          </div>
          {!isRolling && !diceResult && !revealedTask && isDeckReady && (
            <motion.button onClick={handleRollDice} className="absolute bottom-10 z-20 px-10 py-4 bg-gradient-to-r from-amber-700/80 to-rose-800/80 border border-amber-500/30 rounded-full font-black text-amber-100 tracking-widest uppercase text-sm shadow-[0_0_30px_rgba(251,191,36,0.3)] hover:scale-105 transition-transform" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              Roll Dice
            </motion.button>
          )}
          <span className="absolute bottom-[-10px] text-[10px] font-black uppercase tracking-widest text-amber-300/40 z-20">
            {isRolling ? 'Rolling...' : diceResult ? `Rolled a ${diceResult}!` : ''}
          </span>
        </div>

        <AnimatePresence>
          {diceResult && showCardPopup && (
            <CardSelectionPopup 
              diceNumber={diceResult} 
              board={board} 
              isMyTurn={true} 
              onSelectCard={handlePickCard}
              revealedTask={revealedTask ? {
                ...revealedTask,
                text: formatCardText(
                  revealedTask.text,
                  activePlayer.name,
                  inactivePlayer.name
                )
              } : null}
              revealedSlotId={revealedSlotId}
              loading={loading}
              showVerdictControls={true}
              onVerdict={handlePartnerVerdict}
              onTimeout={() => handlePartnerVerdict('fail')}
            />
          )}
        </AnimatePresence>
      </LayoutGroup>

      {/* <button onClick={() => navigate('/home')} className="absolute top-6 left-4 text-neutral-500 hover:text-amber-400 flex items-center space-x-1 transition-colors z-50">
        <LogOut className="w-4 h-4" /> <span className="text-[9px] uppercase font-black tracking-widest">Quit</span>
      </button> */}
    </div>
  );
}
