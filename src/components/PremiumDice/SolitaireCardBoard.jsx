import React, { useMemo, useState, useEffect } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import { Lock, EyeOff, Flame, Droplet, Key, HeartPulse } from 'lucide-react';
import { playCardSnapSound } from '../../utils/audioEngine';

const icons = [Lock, EyeOff, Flame, Droplet, Key, HeartPulse];
const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export default function SolitaireCardBoard({ board, onDeckReady, activePopupDiceNumber }) {
  // Organize board into 6 columns
  const columns = useMemo(() => {
    const cols = [];
    for (let diceNumber = 1; diceNumber <= 6; diceNumber++) {
      cols.push({
        diceNumber,
        cards: board.filter(s => s.diceNumber === diceNumber && !s.consumed)
      });
    }
    return cols;
  }, [board]);

  // Find the highest dealIndex present on the board (used to unlock the board after the last card lands)
  const maxDealIndex = useMemo(() => {
    let max = -1;
    columns.forEach((col, colIndex) => {
      col.cards.forEach((_, i) => {
        const d = i * 6 + colIndex;
        if (d > max) max = d;
      });
    });
    return max;
  }, [columns]);

  const [isDealing, setIsDealing] = useState(true);
  const [isStacked, setIsStacked] = useState(true);

  const getCardBack = (diceNum) => {
    if (diceNum === 1) return 'url(/card-back-1.png)';
    if (diceNum === 2) return 'url(/card-back-2.png)';
    if (diceNum === 3) return 'url(/card-back-3.png)';
    if (diceNum === 4) return 'url(/card-back-4.png)';
    if (diceNum === 5) return 'url(/card-back-5.png)';
    return 'url(/card-back-6.png)';
  };

  // 1. Always spread on mount (handles Local mode where the board remounts every turn)
  useEffect(() => {
    setIsStacked(true);
    setIsDealing(true);
    const t = setTimeout(() => setIsStacked(false), 50);
    return () => clearTimeout(t);
  }, []);

  // 2. Also spread if a completely new 36-card board is passed in (handles Online mode round restarts)
  useEffect(() => {
    if (board.filter(s => !s.consumed).length === 36) {
      setIsStacked(true);
      setIsDealing(true);
      const t = setTimeout(() => setIsStacked(false), 50);
      return () => clearTimeout(t);
    }
  }, [board]);

  // Create a perfectly ordered array for the Stack to ensure Card 1 is on top.
  const sortedStack = useMemo(() => {
    const stack = [];
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 6; col++) {
        const card = columns[col]?.cards[row];
        if (card) stack.push({ card, dealIndex: row * 6 + col });
      }
    }
    return stack;
  }, [columns]);

  return (
      <div className="w-full flex justify-center mt-2 z-10 px-2 overflow-visible relative flex-1 min-h-[40vh]">
        
        {/* The Grid */}
        <div className="flex justify-center gap-1 sm:gap-2 w-full max-w-3xl h-full">
          {columns.map((col, colIndex) => {
            return (
              <div key={col.diceNumber} className="relative w-[58px] sm:w-[84px] h-full flex flex-col items-center">
                
                {col.cards.length === 0 && (
                  <div className="relative aspect-[2.5/3.5] w-[58px] sm:w-[84px] rounded-xl border-2 border-neutral-800/30 border-dashed flex items-center justify-center opacity-30">
                    <span className="text-[10px] font-black text-neutral-600">{DICE_FACES[col.diceNumber - 1]}</span>
                  </div>
                )}

                {!isStacked && col.cards.map((slot, i) => {
                  const isTopCard = i === col.cards.length - 1;
                  const dealIndex = i * 6 + colIndex;

                  return (
                    <motion.div
                      key={`spread-${slot.slotId}`}
                      layoutId={activePopupDiceNumber === col.diceNumber ? undefined : `card-${slot.slotId}`}
                      transition={{
                        layout: {
                          type: 'spring',
                          stiffness: 300,  // High stiffness for fast, snappy flight
                          damping: 24,     // Moderate damping for a tight, controlled bounce (prevents clipping)
                          mass: 0.8,
                          delay: dealIndex * 0.15 
                        }
                      }}
                      onLayoutAnimationComplete={() => {
                        // playCardSnapSound();
                        if (dealIndex === maxDealIndex) { // The last remaining card lands
                          setIsDealing(false);
                          if (onDeckReady) onDeckReady();
                        }
                      }}
                      whileHover={!isDealing && isTopCard ? { y: -10, scale: 1.05, zIndex: 50 } : {}}
                      className={`absolute aspect-[2.5/3.5] w-[58px] sm:w-[84px] rounded-xl border flex flex-col items-center justify-center shadow-[0_15px_30px_rgba(0,0,0,0.8)] transition-colors duration-500 ${
                        !isDealing && isTopCard 
                          ? 'border-amber-500/30 hover:border-amber-400/60 hover:shadow-[0_0_25px_rgba(251,191,36,0.15)] cursor-pointer' 
                          : 'border-white/5 pointer-events-none'
                      }`}
                      style={{
                        top: `${i * 12}px`, // Cascading overlap offset
                        zIndex: i
                      }}
                    >
                      <div className="absolute inset-0 rounded-xl bg-cover bg-center pointer-events-none" style={{ backgroundImage: getCardBack(col.diceNumber) }}></div>
                      <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none rounded-xl border border-white/5"></div>
                      <div className={`absolute inset-[2px] border rounded-lg pointer-events-none ${isTopCard ? 'border-amber-500/20' : 'border-white/5'}`}></div>
                    </motion.div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* The Physical Stack (Bottom Right Origin) */}
        {isStacked && (
          <div className="absolute bottom-[-10px] right-2 sm:right-10 w-[58px] sm:w-[84px] aspect-[2.5/3.5] pointer-events-none z-50">
            {sortedStack.map(({ card, dealIndex }) => (
              <motion.div
                key={`stack-${card.slotId}`}
                layoutId={`card-${card.slotId}`}
                className="absolute inset-0 rounded-xl border border-white/5 shadow-[0_5px_15px_rgba(0,0,0,0.5)]"
                style={{
                  bottom: `${(35 - dealIndex) * 0.5}px`, // Gives the deck 3D thickness
                  right: `${(35 - dealIndex) * 0.3}px`,
                  zIndex: 36 - dealIndex // Card 1 is on top!
                }}
              >
                <div className="absolute inset-0 rounded-xl bg-cover bg-center pointer-events-none" style={{ backgroundImage: getCardBack(card.diceNumber) }}></div>
                <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none rounded-xl border border-white/5"></div>
              </motion.div>
            ))}
          </div>
        )}

      </div>
  );
}
