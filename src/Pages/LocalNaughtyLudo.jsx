import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { recordUsedQuestion } from '../utils/history';
import { formatCardText } from '../utils/text';
import { ArrowLeft, Dices, User2, Heart, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Dice3D from '../components/Dice3D';
import SuspenseTimer from '../components/PremiumDice/SuspenseTimer';

// Soft pastel shades for the 5 colors
const COLORS = [
  'bg-yellow-200 border-yellow-300 text-yellow-800', // 0
  'bg-orange-200 border-orange-300 text-orange-800', // 1
  'bg-pink-200 border-pink-300 text-pink-800',       // 2
  'bg-emerald-200 border-emerald-300 text-emerald-800', // 3
  'bg-indigo-200 border-indigo-300 text-indigo-800'  // 4
];

const CARD_DECKS = [
  { id: 'yellow', name: 'Flirty', color: 'bg-yellow-200 border-yellow-400', count: 4, index: 0 },
  { id: 'orange', name: 'Spicy', color: 'bg-orange-200 border-orange-400', count: 4, index: 1 },
  { id: 'pink', name: 'Romantic', color: 'bg-pink-200 border-pink-400', count: 4, index: 2 },
  { id: 'emerald', name: 'Wild', color: 'bg-emerald-200 border-emerald-400', count: 4, index: 3 },
  { id: 'indigo', name: 'Intimate', color: 'bg-indigo-200 border-indigo-400', count: 4, index: 4 }
];

const BOARD_LAYOUTS = [
  // Layout 1: Pristine non-overlapping design
  {
    snakes: {
      98: { tail: 39, curve: 0.25 },
      89: { tail: 12, curve: -0.2 },
      64: { tail: 26, curve: 0.2 },
      73: { tail: 33, curve: -0.15 },
      47: { tail: 15, curve: 0.25 }
    },
    ladders: {
      2: 22,
      21: 59,
      8: 28,
      31: 51,
      75: 95
    }
  },
  // Layout 2: Perfectly zoned paths
  {
    snakes: {
      97: { tail: 46, curve: 0.25 },
      86: { tail: 24, curve: -0.2 },
      79: { tail: 22, curve: 0.15 },
      69: { tail: 9, curve: -0.15 },
      55: { tail: 35, curve: 0.25 }
    },
    ladders: {
      4: 25,
      13: 34,
      43: 63,
      50: 70,
      72: 92
    }
  }
];

const generateBoardFeatures = () => {
  const index = Math.floor(Math.random() * BOARD_LAYOUTS.length);
  return BOARD_LAYOUTS[index];
};

// 4 tiles for each color:
// Yellow (0): 5, 20, 45, 80
// Orange (1): 11, 36, 61, 91
// Pink (2): 17, 42, 67, 82
// Emerald (3): 23, 53, 78, 93
// Indigo (4): 29, 49, 74, 99
const DARE_TILES = [5, 20, 45, 80, 11, 36, 61, 91, 17, 42, 67, 82, 23, 53, 78, 93, 29, 49, 74, 99];

// Helper to get 0-100 coordinate for SVG
const getTileCenter = (tileNumber) => {
  const index = tileNumber - 1;
  const row = Math.floor(index / 10);
  const col = row % 2 === 0 ? index % 10 : 9 - (index % 10);
  const cx = col * 10 + 5;
  const cy = (9 - row) * 10 + 5;
  return { x: cx, y: cy };
};

export default function LocalNaughtyLudo({ socket }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [player1, setPlayer1] = useState(null);
  const [player2, setPlayer2] = useState(null);
  const [activePlayerNum, setActivePlayerNum] = useState(1);
  const [positions, setPositions] = useState({ 1: 1, 2: 1 });
  
  const [snakes, setSnakes] = useState({});
  const [ladders, setLadders] = useState({});

  useEffect(() => {
    const features = generateBoardFeatures();
    setSnakes(features.snakes);
    setLadders(features.ladders);
  }, []);
  
  const [isRolling, setIsRolling] = useState(false);
  const [rollingTarget, setRollingTarget] = useState(null);
  const [isMoving, setIsMoving] = useState(false);
  
  const [showDarePopup, setShowDarePopup] = useState(false);
  const [currentDare, setCurrentDare] = useState(null);
  const [dareContext, setDareContext] = useState(null);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    if (!location.state || !location.state.player1 || !location.state.player2) {
      navigate('/home', { replace: true });
      return;
    }
    
    const p1 = location.state.player1;
    const p2 = location.state.player2;
    
    setPlayer1({ ...p1, name: (p1.name || 'Player 1').split(' ')[0], avatar: p1.avatar || '/assets/girl1.jpg' });
    setPlayer2({ ...p2, name: (p2.name || 'Player 2').split(' ')[0], avatar: p2.avatar || '/assets/boy1.jpg' });
  }, [navigate, location.state]);

  useEffect(() => {
    socket.on('localDiceCardDrawn', (task) => {
      setCurrentDare(task);
      if (task?.id) recordUsedQuestion(task.id);
      setShowDarePopup(true);
    });
    return () => socket.off('localDiceCardDrawn');
  }, [socket]);

  const board = [];
  for (let r = 9; r >= 0; r--) {
    const rowTiles = [];
    for (let c = 0; c < 10; c++) {
      const rowStart = r * 10;
      const tileNumber = rowStart + (r % 2 === 0 ? c + 1 : 10 - c);
      rowTiles.push(tileNumber);
    }
    board.push(rowTiles);
  }

  const handleRollClick = () => {
    if (isRolling || isMoving || showDarePopup || winner) return;
    const result = Math.floor(Math.random() * 6) + 1;
    setRollingTarget(result);
    setIsRolling(true);
  };

  const handleRollComplete = async (result) => {
    setIsRolling(false);
    await moveToken(activePlayerNum, positions[activePlayerNum], result);
  };

  const moveToken = async (player, start, steps) => {
    setIsMoving(true);
    let current = start;
    const target = Math.min(start + steps, 100);

    for (let i = current + 1; i <= target; i++) {
      setPositions(prev => ({ ...prev, [player]: i }));
      await new Promise(r => setTimeout(r, 250));
    }

    if (snakes[target]) {
      const tail = snakes[target].tail;
      await new Promise(r => setTimeout(r, 600)); 
      setPositions(prev => ({ ...prev, [player]: tail }));
      await new Promise(r => setTimeout(r, 800)); 
      checkDareAndEndTurn(player, tail, 'snake');
    } else if (ladders[target]) {
      await new Promise(r => setTimeout(r, 600)); 
      setPositions(prev => ({ ...prev, [player]: ladders[target] }));
      await new Promise(r => setTimeout(r, 800)); 
      checkDareAndEndTurn(player, ladders[target], 'ladder');
    } else {
      checkDareAndEndTurn(player, target, 'normal');
    }
  };

  const LOCAL_DARE_FALLBACKS = [
    { id: 'f1', intensity: 'Hot 🔥', text: 'Give your partner a 15-second sensual neck massage.' },
    { id: 'f2', intensity: 'Spicy 🌶️', text: 'Whisper your dirtiest secret into your partner\'s ear.' },
    { id: 'f3', intensity: 'Wild ⚡', text: 'Give your partner a passionate 10-second kiss anywhere they choose.' },
    { id: 'f4', intensity: 'Flirty 😘', text: 'Stare into your partner\'s eyes for 20 seconds without blinking or laughing.' },
    { id: 'f5', intensity: 'Intimate ❤️', text: 'Trace your fingers gently down your partner\'s arm and whisper what you love about them.' },
    { id: 'f6', intensity: 'Extreme 💥', text: 'Let your partner give you any custom dare of their choice!' }
  ];

  const triggerDareCard = (ctx) => {
    setDareContext(ctx);
    // Guarantee immediate popup with fallback dare
    const fallbackTask = LOCAL_DARE_FALLBACKS[Math.floor(Math.random() * LOCAL_DARE_FALLBACKS.length)];
    setCurrentDare(fallbackTask);
    setShowDarePopup(true);

    // Try drawing DB dare via socket if available
    try {
      if (socket) {
        socket.emit('drawLocalDiceCard', { diceNumber: Math.floor(Math.random() * 6) + 1 });
      }
    } catch (e) {
      console.warn('Socket emit error:', e);
    }
  };

  const checkDareAndEndTurn = (player, finalPos, eventType = 'normal') => {
    if (finalPos === 100) {
      setWinner(player === 1 ? player1.name : player2.name);
      setIsMoving(false);
      return;
    }

    const activeP = player === 1 ? player1 : player2;
    const partnerP = player === 1 ? player2 : player1;

    if (eventType === 'ladder') {
      triggerDareCard({
        type: 'ladder',
        title: 'Ladder Advantage! 🪜',
        subtitle: `You have the advantage! ${activeP.name}, give ${partnerP.name} a dare:`,
        giver: activeP.name,
        receiver: partnerP.name,
        borderColor: 'border-amber-500/60',
        glowColor: 'shadow-[0_0_50px_rgba(245,158,11,0.4)]',
        bgGradient: 'from-amber-950/90 via-neutral-900 to-black',
        btnStyle: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:from-amber-400 hover:to-yellow-400 shadow-[0_0_20px_rgba(245,158,11,0.5)]'
      });
    } else if (eventType === 'snake') {
      triggerDareCard({
        type: 'snake',
        title: 'Snake Trap! 🐍',
        subtitle: `${partnerP.name} gets to give ${activeP.name} a dare for sliding down!`,
        giver: partnerP.name,
        receiver: activeP.name,
        borderColor: 'border-emerald-500/60',
        glowColor: 'shadow-[0_0_50px_rgba(16,185,129,0.4)]',
        bgGradient: 'from-emerald-950/90 via-neutral-900 to-black',
        btnStyle: 'bg-gradient-to-r from-emerald-600 to-green-500 text-white hover:from-emerald-500 hover:to-green-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
      });
    } else if (DARE_TILES.includes(finalPos)) {
      triggerDareCard({
        type: 'tile',
        title: 'Dare Tile! 🔥',
        subtitle: `${partnerP.name} challenges ${activeP.name} with a dare:`,
        giver: partnerP.name,
        receiver: activeP.name,
        borderColor: 'border-rose-500/60',
        glowColor: 'shadow-[0_0_50px_rgba(244,63,94,0.4)]',
        bgGradient: 'from-rose-950/90 via-neutral-900 to-black',
        btnStyle: 'bg-red-600 text-white hover:bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
      });
    } else {
      endTurn();
    }
  };

  const endTurn = () => {
    setActivePlayerNum(prev => prev === 1 ? 2 : 1);
    setIsMoving(false);
  };

  const handleDareComplete = () => {
    setShowDarePopup(false);
    setCurrentDare(null);
    setDareContext(null);
    endTurn();
  };

  if (!player1 || !player2) return null;

  return (
    <div className="flex flex-col items-center w-full min-h-[100dvh] space-y-1 sm:space-y-2 relative pt-1 sm:pt-2 px-1 overflow-y-auto overflow-x-hidden bg-black/60 backdrop-blur-3xl rounded-none pb-2">
      <div className="w-full max-w-2xl flex justify-between items-center z-20 px-2 shrink-0">
        <button onClick={() => navigate('/home', { replace: true })} className="p-2 bg-neutral-900/50 rounded-full text-neutral-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg sm:text-xl font-black text-white uppercase tracking-widest drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]">Naughty Ludo</h1>
        <div className="w-9 h-9" />
      </div>

      <div className="w-full max-w-2xl glass-panel rounded-full p-1.5 flex justify-between items-center relative z-20 border border-white/10 bg-white/5 shrink-0">
        <div className={`flex items-center space-x-2 w-1/3 transition-all duration-500 ${activePlayerNum === 1 ? 'opacity-100 scale-105' : 'opacity-40 grayscale-[30%]'}`}>
          <img src={player1.avatar} className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full object-cover border-2 ${activePlayerNum === 1 ? 'border-amber-500 shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'border-neutral-700'}`} alt="P1" />
          <div className="text-left hidden sm:block">
            <p className="text-white font-black text-[10px] uppercase tracking-wider truncate w-16">{player1.name}</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center w-1/3">
          <Dices className="w-5 h-5 text-amber-500/60" />
        </div>
        <div className={`flex items-center justify-end space-x-2 w-1/3 transition-all duration-500 ${activePlayerNum === 2 ? 'opacity-100 scale-105' : 'opacity-40 grayscale-[30%]'}`}>
          <div className="text-right hidden sm:block">
            <p className="text-white font-black text-[10px] uppercase tracking-wider truncate w-16">{player2.name}</p>
          </div>
          <img src={player2.avatar} className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full object-cover border-2 ${activePlayerNum === 2 ? 'border-amber-500 shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'border-neutral-700'}`} alt="P2" />
        </div>
      </div>

      {/* Card Decks Section (Animated) */}
      <div className="w-full max-w-[320px] sm:max-w-[450px] flex justify-between items-end px-1 sm:px-2 h-12 sm:h-16 z-20 shrink-0 mt-1">
        {CARD_DECKS.map((deck, i) => (
          <div key={deck.id} className="flex flex-col items-center relative w-[18%]">
            <div className="relative w-6 h-9 sm:w-9 sm:h-12">
              {Array.from({ length: deck.count }).map((_, cIdx) => (
                <motion.div
                  key={cIdx}
                  initial={{ y: -500, opacity: 0, rotate: (Math.random() - 0.5) * 60 }}
                  animate={{ y: 0, opacity: 1, rotate: cIdx % 2 === 0 ? -4 : 4 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 120, 
                    damping: 15, 
                    delay: 0.2 + (i * 0.15) + (cIdx * 0.08) 
                  }}
                  className={`absolute top-0 left-0 w-full h-full rounded sm:rounded-md border-2 shadow-[0_4px_10px_rgba(0,0,0,0.4)] ${deck.color}`}
                  style={{ top: `${cIdx * -2.5}px`, left: `${cIdx * 1}px`, zIndex: cIdx }}
                >
                   <div className="w-full h-full border border-black/10 rounded-sm" />
                </motion.div>
              ))}
            </div>
            <span className="text-[6px] sm:text-[8px] font-black text-white/50 uppercase mt-1 sm:mt-2 tracking-widest">{deck.name}</span>
          </div>
        ))}
      </div>

      {/* The Board (Maximized to fill the screen width) */}
      <div className="w-full flex-1 relative flex flex-col justify-center items-center py-1 px-1 min-h-[250px]">
        <div 
          className="w-full max-w-[96vw] sm:max-w-[600px] aspect-square bg-white/5 p-1 sm:p-2 rounded-xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] relative mx-auto transition-all duration-300"
        >
          
          {/* THE TILES */}
          <div className="grid grid-rows-10 w-full h-full relative z-0 rounded-xl overflow-hidden shadow-inner border border-white/20">
            {board.map((row, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-10 w-full h-full">
                {row.map((tileNumber) => {
                  const isDare = DARE_TILES.includes(tileNumber);
                  const colorClass = COLORS[tileNumber % 5];
                  return (
                    <div key={tileNumber} className={`relative flex items-center justify-center ${colorClass} shadow-[inset_0_0_8px_rgba(0,0,0,0.05)] border-[0.5px] border-black/5`}>
                      <span className="absolute top-0.5 left-0.5 sm:left-1 text-[5px] sm:text-[7px] font-black opacity-40">{tileNumber}</span>
                      {isDare && <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 opacity-60 mix-blend-multiply" fill="currentColor" />}
                      
                      {positions[1] === tileNumber && (
                        <motion.div layoutId="token-1" className="absolute w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white bg-blue-600 z-30 shadow-[0_4px_10px_rgba(0,0,0,0.5)] -translate-x-1 sm:-translate-x-1.5" transition={{ type: 'spring', stiffness: 300, damping: 25 }} />
                      )}
                      {positions[2] === tileNumber && (
                        <motion.div layoutId="token-2" className="absolute w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white bg-rose-600 z-30 shadow-[0_4px_10px_rgba(0,0,0,0.5)] translate-x-1 sm:translate-x-1.5" transition={{ type: 'spring', stiffness: 300, damping: 25 }} />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* SVG OVERLAY FOR SNAKES AND LADDERS */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="1" dy="1.5" stdDeviation="1" floodOpacity="0.5" />
              </filter>
              <linearGradient id="woodGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#d97706" />
                <stop offset="50%" stopColor="#b45309" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
              <linearGradient id="snakeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="50%" stopColor="#16a34a" />
                <stop offset="100%" stopColor="#14532d" />
              </linearGradient>
            </defs>

            {/* Draw Ladders */}
            {Object.entries(ladders).map(([start, end]) => {
              const startPos = getTileCenter(parseInt(start));
              const endPos = getTileCenter(end);
              const dx = endPos.x - startPos.x;
              const dy = endPos.y - startPos.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
              
              const railThickness = 1.2;
              const rungThickness = 0.8;
              const rungSpacing = 3.5;
              const railSpread = 2; // Distance from center
              
              return (
                <g key={`ladder-${start}`} transform={`translate(${startPos.x}, ${startPos.y}) rotate(${angle})`}>
                  {/* Left Rail */}
                  <rect x="0" y={-railSpread} width={dist} height={railThickness} fill="url(#woodGrad)" filter="url(#dropShadow)" rx={railThickness/2} />
                  {/* Right Rail */}
                  <rect x="0" y={railSpread - railThickness} width={dist} height={railThickness} fill="url(#woodGrad)" filter="url(#dropShadow)" rx={railThickness/2} />
                  {/* Rungs */}
                  {Array.from({ length: Math.floor(dist / rungSpacing) }).map((_, i) => (
                    <rect key={i} x={i * rungSpacing + (rungSpacing/2)} y={-railSpread + railThickness - 0.2} width={rungThickness} height={railSpread * 2 - railThickness + 0.4} fill="url(#woodGrad)" filter="url(#dropShadow)" rx="0.2" />
                  ))}
                </g>
              );
            })}

            {/* Draw Snakes */}
            {Object.entries(snakes).map(([head, snakeData]) => {
              const headPos = getTileCenter(parseInt(head));
              const tailPos = getTileCenter(snakeData.tail);
              const customCurve = snakeData.curve || 0.25;
              
              // Shift the head and tail slightly inward to prevent the head/tongue 
              // from poking outside the game board edges (e.g., tile 94 at the top).
              const dx_full = tailPos.x - headPos.x;
              const dy_full = tailPos.y - headPos.y;
              const dist_full = Math.sqrt(dx_full * dx_full + dy_full * dy_full);
              
              const shrinkHead = 4; // Head + tongue extends about 4-5 units, so we pull it back
              const shrinkTail = 1; 
              
              const hx = headPos.x + (dx_full / dist_full) * shrinkHead;
              const hy = headPos.y + (dy_full / dist_full) * shrinkHead;
              
              const tx = tailPos.x - (dx_full / dist_full) * shrinkTail;
              const ty = tailPos.y - (dy_full / dist_full) * shrinkTail;
              
              const dx = tx - hx;
              const dy = ty - hy;
              
              // S-curve using Cubic Bezier
              const nx = -dy;
              const ny = dx;
              
              const clamp = (val) => Math.max(3, Math.min(97, val));
              
              const cx1 = clamp(hx + dx * 0.33 + nx * customCurve);
              const cy1 = clamp(hy + dy * 0.33 + ny * customCurve);
              
              const cx2 = clamp(hx + dx * 0.66 - nx * customCurve);
              const cy2 = clamp(hy + dy * 0.66 - ny * customCurve);
              
              const d = `M ${hx} ${hy} C ${cx1} ${cy1} ${cx2} ${cy2} ${tx} ${ty}`;
              
              // Angle for the head
              const dirX = cx1 - hx;
              const dirY = cy1 - hy;
              const headAngle = (Math.atan2(dirY, dirX) * 180) / Math.PI;
              
              return (
                <g key={`snake-${head}`}>
                  {/* Snake Body Outline / Shadow */}
                  <path d={d} fill="none" stroke="#064e3b" strokeWidth="2.5" strokeLinecap="round" filter="url(#dropShadow)" />
                  
                  {/* Snake Main Body Gradient */}
                  <path d={d} fill="none" stroke="url(#snakeGrad)" strokeWidth="2.0" strokeLinecap="round" />
                  
                  {/* Snake Belly Highlight */}
                  <path d={d} fill="none" stroke="#4ade80" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />
                  
                  {/* Snake Spots */}
                  <path d={d} fill="none" stroke="#14532d" strokeWidth="2.0" strokeDasharray="1.5 3.5" strokeLinecap="round" opacity="0.7" />
                  
                  {/* Tail Taper */}
                  <circle cx={tx} cy={ty} r="0.8" fill="#16a34a" />
                  <circle cx={tx} cy={ty} r="0.4" fill="#14532d" />
                  
                  {/* Custom Drawn Snake Head */}
                  <g transform={`translate(${hx}, ${hy}) rotate(${headAngle + 180})`}>
                    {/* Head Base */}
                    <ellipse cx="1.0" cy="0" rx="2.0" ry="1.4" fill="url(#snakeGrad)" filter="url(#dropShadow)" />
                    <ellipse cx="1.0" cy="0" rx="2.0" ry="1.4" fill="transparent" stroke="#064e3b" strokeWidth="0.3" />
                    
                    {/* Eyes */}
                    <circle cx="1.6" cy="-0.7" r="0.5" fill="white" />
                    <circle cx="1.6" cy="0.7" r="0.5" fill="white" />
                    <circle cx="1.8" cy="-0.7" r="0.25" fill="black" />
                    <circle cx="1.8" cy="0.7" r="0.25" fill="black" />
                    
                    {/* Forked Tongue */}
                    <path d="M 3 0 L 4.5 0 M 4.5 0 L 5.2 -0.5 M 4.5 0 L 5.2 0.5" stroke="#ef4444" strokeWidth="0.25" fill="none" strokeLinecap="round" />
                  </g>
                </g>
              );
            })}
          </svg>
          {/* Dice placed ON the board */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40 scale-75 sm:scale-100">
             <Dice3D targetNumber={rollingTarget || 1} isRolling={isRolling} onRollComplete={handleRollComplete} />
          </div>
        </div>
      </div>

      {/* Action Area */}
      <div className="w-full flex flex-col items-center justify-center pb-1 sm:pb-4 z-20 relative shrink-0 min-h-[50px] sm:min-h-[70px]">
        {!isRolling && !isMoving && !showDarePopup && !winner && (
          <button 
            onClick={handleRollClick} 
            className="px-6 py-1.5 sm:px-8 sm:py-3 bg-gradient-to-b from-amber-400 to-amber-600 text-black text-sm sm:text-base font-black uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(251,191,36,0.6)] hover:scale-105 active:scale-95 transition-all z-10"
          >
            Roll Dice
          </button>
        )}
      </div>

      {/* Dare Popup */}
      <AnimatePresence>
        {showDarePopup && currentDare && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <div className={`bg-gradient-to-b ${dareContext?.bgGradient || 'from-neutral-900 to-black'} border-2 ${dareContext?.borderColor || 'border-red-500/50'} p-6 rounded-3xl w-full max-w-sm text-center ${dareContext?.glowColor || 'shadow-[0_0_50px_rgba(239,68,68,0.3)]'}`}>
              
              {dareContext?.type === 'ladder' ? (
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-3 text-3xl shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-bounce">
                  🪜
                </div>
              ) : dareContext?.type === 'snake' ? (
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-3 text-3xl shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-bounce">
                  🐍
                </div>
              ) : (
                <Flame className="w-12 h-12 text-red-500 mx-auto mb-3 animate-pulse" />
              )}

              <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-1">
                {dareContext?.title || 'Dare Tile!'}
              </h2>

              <p className="text-xs font-bold text-amber-200/90 mb-3 px-2 leading-relaxed">
                {dareContext?.subtitle || 'Complete your dare!'}
              </p>

              <div className="inline-block px-3 py-1 bg-black/50 text-white/80 text-[10px] uppercase tracking-widest rounded-full mb-4 font-bold border border-white/20">
                {currentDare.intensity || 'Spicy Dare'}
              </div>

              <div className="bg-black/50 border border-white/10 p-4 rounded-2xl mb-4 backdrop-blur-sm">
                <p className="text-white text-sm sm:text-base font-serif leading-relaxed">
                  {formatCardText(
                    currentDare.text || currentDare.question,
                    activePlayerNum === 1 ? player1.name : player2.name,
                    activePlayerNum === 1 ? player2.name : player1.name
                  )}
                </p>
              </div>
              
              <SuspenseTimer duration={30} onTimeout={() => {}} />

              <button 
                onClick={handleDareComplete}
                className={`mt-6 w-full py-3 font-black uppercase tracking-widest rounded-xl transition-all ${dareContext?.btnStyle || 'bg-red-600 text-white hover:bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]'}`}
              >
                Complete & End Turn
              </button>
            </div>
          </motion.div>
        )}

        {/* Winner Popup */}
        {winner && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <div className="bg-gradient-to-b from-yellow-900 to-black border-2 border-yellow-500 p-8 rounded-3xl w-full max-w-sm text-center shadow-[0_0_80px_rgba(234,179,8,0.4)]">
              <span className="text-6xl block mb-4">🏆</span>
              <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-2">{winner}</h2>
              <p className="text-yellow-400 font-bold uppercase tracking-widest mb-8">Wins the Game!</p>
              <button 
                onClick={() => {
                  setPositions({ 1: 1, 2: 1 });
                  setActivePlayerNum(1);
                  setWinner(null);
                  const features = generateBoardFeatures();
                  setSnakes(features.snakes);
                  setLadders(features.ladders);
                }}
                className="w-full py-4 bg-yellow-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-yellow-400 transition-colors shadow-[0_0_20px_rgba(234,179,8,0.6)]"
              >
                Play Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
