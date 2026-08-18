import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices, Heart, LogOut, CheckCircle2, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import Dice3D from '../components/Dice3D';
import CardSelectionPopup from '../components/PremiumDice/CardSelectionPopup';
import CardRevealPopup from '../components/PremiumDice/CardRevealPopup';
import SolitaireCardBoard from '../components/PremiumDice/SolitaireCardBoard';
import { formatCardText } from '../utils/text';

const FALLBACK_AVATAR = "https://api.dicebear.com/7.x/lorelei/svg?seed=fallback";

const INTENSITY_COLORS = {
  tease: { bg: 'from-violet-950/60 to-black', border: 'border-violet-400', text: 'text-violet-300', glow: 'rgba(139,92,246,0.4)' },
  flirty: { bg: 'from-fuchsia-950/60 to-black', border: 'border-fuchsia-400', text: 'text-fuchsia-300', glow: 'rgba(217,70,239,0.4)' },
  hot: { bg: 'from-pink-950/60 to-black', border: 'border-pink-400', text: 'text-pink-300', glow: 'rgba(236,72,153,0.4)' },
  steamy: { bg: 'from-rose-950/60 to-black', border: 'border-rose-400', text: 'text-rose-300', glow: 'rgba(244,63,94,0.5)' },
  extreme: { bg: 'from-red-950/60 to-black', border: 'border-red-500', text: 'text-red-400', glow: 'rgba(239,68,68,0.5)' },
  wildcard: { bg: 'from-amber-950/60 to-black', border: 'border-amber-400', text: 'text-amber-300', glow: 'rgba(251,191,36,0.5)' },
};

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export default function SpicyDiceBoard({ socket }) {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [turn, setTurn] = useState(state?.turn);
  const [board, setBoard] = useState(state?.board || []);
  const [gameState, setGameState] = useState(null);
  const [diceResult, setDiceResult] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [rollingTarget, setRollingTarget] = useState(null);
  const [revealedTask, setRevealedTask] = useState(null);
  const [revealedSlotId, setRevealedSlotId] = useState(null);
  const [partnerLeftMsg, setPartnerLeftMsg] = useState(null);
  const [deniedPenalty, setDeniedPenalty] = useState(null);
  const [boardExhausted, setBoardExhausted] = useState(false);
  const [showCardPopup, setShowCardPopup] = useState(false);
  const [isDeckReady, setIsDeckReady] = useState(false);

  const myDataSrc = state?.players?.find(p => p.id === socket.id) || { username: 'Me', avatar: FALLBACK_AVATAR };
  const partnerDataSrc = state?.players?.find(p => p.id !== socket.id) || { username: 'Partner', avatar: FALLBACK_AVATAR };
  
  const myData = { ...myDataSrc, username: myDataSrc.username.split(' ')[0] };
  const partnerData = { ...partnerDataSrc, username: partnerDataSrc.username.split(' ')[0] };
  const isMyTurn = turn === socket.id;

  useEffect(() => {
    if (state?.roomCode) socket.emit('rejoinRoom', state.roomCode);

    socket.on('diceRollResult', (data) => {
      setRollingTarget(data.diceResult);
      setIsRolling(true);
    });

    socket.on('diceCardRevealed', ({ slotId, task }) => {
      setRevealedSlotId(slotId);
      setRevealedTask(task);
      setBoard(prev => prev.map(s => s.slotId === slotId ? { ...s, revealed: true, task } : s));
    });

    socket.on('diceTurnUpdated', ({ turn: newTurn, board: newBoard }) => {
      setTurn(newTurn);
      setBoard(newBoard);
      setDiceResult(null);
      setRevealedTask(null);
      setRevealedSlotId(null);
      setShowCardPopup(false);
    });

    socket.on('dicePenalty', ({ targetName }) => {
      setDeniedPenalty(`🔥 DENIED! ${targetName} MUST STRIP! 🔥`);
      setTimeout(() => setDeniedPenalty(null), 4000);
    });

    socket.on('diceBoardExhausted', () => setBoardExhausted(true));

    socket.on('diceNewRoundStarted', ({ turn: newTurn, board: newBoard }) => {
      setIsDeckReady(false);
      setTurn(newTurn);
      setBoard(newBoard);
      setDiceResult(null);
      setRevealedTask(null);
      setRevealedSlotId(null);
      setBoardExhausted(false);
      setShowCardPopup(false);
    });

    socket.on('partnerLeft', (data) => setPartnerLeftMsg(data.message));

    return () => {
      socket.off('diceRollResult');
      socket.off('diceCardRevealed');
      socket.off('diceTurnUpdated');
      socket.off('dicePenalty');
      socket.off('diceBoardExhausted');
      socket.off('diceNewRoundStarted');
      socket.off('partnerLeft');
    };
  }, [socket, state?.roomCode]);

  const handleRollDice = () => {
    if (isMyTurn && !diceResult && !revealedTask && !isRolling) {
      socket.emit('requestDiceRoll', { roomCode: state?.roomCode });
    }
  };

  const handleRollComplete = (finalNumber) => {
    setDiceResult(finalNumber);
    setIsRolling(false);
    setRollingTarget(null);

    // Give the user time to see the rolled dice on the board before obscuring with cards
    setTimeout(() => {
      setShowCardPopup(true);
    }, 1500);
  };

  const handlePickCard = (slotId) => {
    if (isMyTurn && diceResult && !revealedTask) {
      const slot = board.find(s => s.slotId === slotId);
      if (slot && !slot.consumed && slot.diceNumber === diceResult) {
        socket.emit('pickDiceCard', { roomCode: state?.roomCode, slotId });
      }
    }
  };

  const handleVerdict = (decision) => {
    socket.emit('diceVerdict', { roomCode: state?.roomCode, decision });
  };

  if (boardExhausted) {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-sm h-[80vh] px-6 mt-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full bg-gradient-to-b from-purple-950/90 to-black backdrop-blur-xl border-2 border-purple-500 rounded-[3rem] p-10 text-center relative overflow-hidden"
          style={{ boxShadow: '0 0 80px rgba(139,92,246,0.4)' }}
        >
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-amber-600/10 blur-[80px] rounded-full pointer-events-none"></div>
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-rose-600/10 blur-[80px] rounded-full pointer-events-none"></div>

          <Dices className="w-16 h-16 text-amber-500/80 mx-auto mb-6 animate-pulse" style={{ filter: 'drop-shadow(0 0 30px rgba(251,191,36,0.4))' }} />

          <h2 className="text-2xl font-serif text-white font-black tracking-widest uppercase mb-3">
            Board Cleared! 🎲
          </h2>
          <p className="text-amber-200/60 text-sm font-bold mb-8 leading-relaxed">
            All cards have been revealed. Ready for another round?
          </p>

          <div className="space-y-3">
            <button
              onClick={() => socket.emit('diceNewRound', { roomCode: state?.roomCode })}
              className="w-full py-4 bg-gradient-to-r from-amber-700 to-rose-700 text-white rounded-xl font-black uppercase tracking-widest hover:from-amber-600 hover:to-rose-600 transition-all text-sm"
              style={{ boxShadow: '0 0 30px rgba(251,191,36,0.2)' }}
            >
              🎲 New Round
            </button>
            <button
              onClick={() => { socket.emit('quitGame', state?.roomCode); navigate('/home'); }}
              className="w-full py-3 bg-neutral-950 text-purple-400 border border-purple-900 rounded-xl font-black uppercase tracking-widest hover:bg-purple-950/30 transition-all text-xs"
            >
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const remainingCards = board.filter(s => !s.consumed).length;

  return (
    <div className="flex flex-col items-center w-full max-w-sm h-screen space-y-4 relative pt-4 px-2 overflow-hidden">

      <AnimatePresence>
        {partnerLeftMsg && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="bg-neutral-950/95 border border-purple-500 rounded-[2rem] p-8 w-full max-w-sm shadow-[0_0_60px_rgba(139,92,246,0.4)] text-center">
              <Heart className="w-14 h-14 text-purple-500 mx-auto mb-4 opacity-60" />
              <h2 className="text-xl font-serif text-white font-black mb-2 tracking-widest uppercase">Game Over</h2>
              <p className="text-purple-300 text-sm mb-6 font-bold">{partnerLeftMsg}</p>
              <button onClick={() => { setPartnerLeftMsg(null); navigate('/home'); }}
                className="w-full py-3.5 bg-purple-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-purple-500 shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all text-xs">
                Back to Home
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deniedPenalty && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
            animate={{ scale: 1.1, opacity: 1, rotate: 0 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
          >
            <div className="absolute inset-0 bg-purple-900/60 backdrop-blur-sm"></div>
            <div className="bg-black/90 border-4 border-purple-600 p-8 rounded-[3rem] text-center shadow-[0_0_100px_rgba(139,92,246,0.8)] relative z-10 transform -rotate-6">
              <h1 className="text-6xl font-black text-purple-400 tracking-widest mb-4 drop-shadow-[0_0_20px_rgba(139,92,246,1)]">DENIED</h1>
              <p className="text-white text-lg font-bold uppercase tracking-widest bg-purple-600 py-2 px-6 rounded-full inline-block">{deniedPenalty}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Players Bar */}
      <div className="w-full glass-panel rounded-full p-2 flex justify-between items-center relative z-20">
        <div className={`flex items-center space-x-3 w-1/3 transition-all duration-500 ${isMyTurn ? 'opacity-100 scale-105' : 'opacity-40 grayscale-[30%]'}`}>
          <img src={myData.avatar} className={`w-12 h-12 rounded-full object-cover border-2 ${isMyTurn ? 'border-amber-500 shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'border-neutral-700'}`} alt="Me" />
          <div className="text-left hidden sm:block">
            <p className="text-white font-black text-[10px] uppercase tracking-wider truncate w-16">{myData.username}</p>
            {isMyTurn && <p className="text-amber-400/80 font-black text-[8px] uppercase tracking-widest animate-pulse">Acting</p>}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center w-1/3">
          <Dices className="w-6 h-6 text-amber-500/60 animate-pulse" />
          <span className="text-[7px] font-black uppercase tracking-widest mt-1 text-amber-500/60">{remainingCards} left</span>
        </div>

        <div className={`flex items-center justify-end space-x-3 w-1/3 transition-all duration-500 ${!isMyTurn ? 'opacity-100 scale-105' : 'opacity-40 grayscale-[30%]'}`}>
          <div className="text-right hidden sm:block">
            <p className="text-white font-black text-[10px] uppercase tracking-wider truncate w-16">{partnerData.username}</p>
            {!isMyTurn && <p className="text-amber-400/80 font-black text-[8px] uppercase tracking-widest animate-pulse">Acting</p>}
          </div>
          <img src={partnerData.avatar} className={`w-12 h-12 rounded-full object-cover border-2 ${!isMyTurn ? 'border-amber-500 shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'border-neutral-700'}`} alt="Partner" />
        </div>
      </div>

      {/* Solitaire Card Layout directly under HUD */}
      <SolitaireCardBoard board={board} onDeckReady={() => setIsDeckReady(true)} />

      {/* 3D DICE AREA */}
      <div className="w-full flex flex-col items-center justify-center relative flex-1 z-10" style={{ minHeight: '300px' }}>
        <div className="z-10 relative">
          <Dice3D 
            targetNumber={rollingTarget || diceResult} 
            isRolling={isRolling} 
            onRollComplete={handleRollComplete} 
          />
        </div>
        
        {!isRolling && !diceResult && !revealedTask && isMyTurn && isDeckReady && (
          <motion.button 
            onClick={handleRollDice}
            className="absolute bottom-10 z-20 px-10 py-4 bg-gradient-to-r from-amber-700/80 to-rose-800/80 border border-amber-500/30 rounded-full font-black text-amber-100 tracking-widest uppercase text-sm shadow-[0_0_30px_rgba(251,191,36,0.3)] hover:scale-105 transition-transform"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            Roll Dice
          </motion.button>
        )}

        {!isMyTurn && !isRolling && !diceResult && !revealedTask && (
          <span className="absolute bottom-10 z-20 px-8 py-3 rounded-full font-bold text-neutral-400 bg-neutral-900/80 border border-neutral-700 uppercase tracking-widest text-[10px]">
            Waiting for Partner...
          </span>
        )}
        
        <span className="absolute bottom-[-10px] text-[10px] font-black uppercase tracking-widest text-amber-300/40 z-20">
          {isRolling ? 'Rolling...' : diceResult ? `Rolled a ${diceResult}!` : ''}
        </span>
      </div>

      {/* Card Selection Popup */}
      <AnimatePresence>
        {diceResult && showCardPopup && !revealedTask && (
          <CardSelectionPopup 
            diceNumber={diceResult}
            board={board}
            isMyTurn={isMyTurn}
            onSelectCard={handlePickCard}
          />
        )}
      </AnimatePresence>

      {/* Card Reveal Popup Component */}
      <AnimatePresence>
        {revealedTask && (
          <CardRevealPopup 
            cardTask={{
              ...revealedTask,
              text: formatCardText(
                revealedTask.text,
                isMyTurn ? myData.username : partnerData.username,
                isMyTurn ? partnerData.username : myData.username
              )
            }}
            diceNumber={revealedTask.dice_number}
            slotId={revealedSlotId}
            isMyTurn={isMyTurn}
            showVerdictControls={!isMyTurn}
            onVerdict={handleVerdict}
            onTimeout={() => handleVerdict('fail')} // Penalty for timeout
          />
        )}
      </AnimatePresence>

      {/* --- QUIT BUTTON --- */}
      {/* <button onClick={() => { socket.emit('quitGame', state?.roomCode); navigate('/home'); }}
        className="absolute top-6 left-4 text-neutral-500 hover:text-amber-400 flex items-center space-x-1 transition-colors z-50">
        <LogOut className="w-4 h-4" /> <span className="text-[9px] uppercase font-black tracking-widest">Quit</span>
      </button> */}
    </div>
  );
}

