import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import SuspenseTimer from './SuspenseTimer';
import PartnerVerdictSlider from './PartnerVerdictSlider';

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

const getCardBack = (diceNum) => {
  if (diceNum === 1) return 'url(/card-back-1.png)';
  if (diceNum === 2) return 'url(/card-back-2.png)';
  if (diceNum === 3) return 'url(/card-back-3.png)';
  if (diceNum === 4) return 'url(/card-back-4.png)';
  if (diceNum === 5) return 'url(/card-back-5.png)';
  return 'url(/card-back-6.png)';
};

const INTENSITY_COLORS = {
  tease: { bg: 'from-amber-900/60 to-black', border: 'border-amber-500/30', text: 'text-amber-200' },
  flirty: { bg: 'from-rose-900/60 to-black', border: 'border-rose-400/30', text: 'text-rose-200' },
  hot: { bg: 'from-orange-900/60 to-black', border: 'border-orange-500/30', text: 'text-orange-300' },
  steamy: { bg: 'from-red-950/80 to-black', border: 'border-red-500/30', text: 'text-red-300' },
  extreme: { bg: 'from-[#2a0808]/90 to-black', border: 'border-[#7a1b1b]/50', text: 'text-red-400' },
  wildcard: { bg: 'from-yellow-900/60 to-black', border: 'border-yellow-500/30', text: 'text-yellow-200' },
};

export default function CardSelectionPopup({ 
  diceNumber, board, onSelectCard, isMyTurn,
  revealedTask, revealedSlotId, loading,
  showVerdictControls, onVerdict, onTimeout
}) {
  const group = board.filter(s => s.diceNumber === diceNumber);
  const diceSymbol = DICE_FACES[diceNumber - 1];
  const isRevealing = revealedSlotId !== null;
  const colors = revealedTask ? (INTENSITY_COLORS[revealedTask.intensity] || INTENSITY_COLORS.flirty) : null;

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-end p-4 pb-20">
      {/* Backdrop Blur — stays consistent, no color change */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-md z-0" 
      />

      {/* Header Text */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="absolute top-20 z-10 w-full text-center"
      >
        <h2 className="text-3xl text-amber-400 font-serif mb-2 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]">
           Rolled a {diceNumber} {diceSymbol}
        </h2>
        <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">
           {revealedTask 
             ? "Perform the task before time runs out!" 
             : loading 
               ? "Drawing card..." 
               : isMyTurn ? "Select a card to play" : "Partner is selecting a card..."}
        </p>
      </motion.div>

      {/* Verdict Controls — appear at the bottom after task is revealed */}
      <AnimatePresence>
        {revealedTask && showVerdictControls && (
          <motion.div 
            key="verdict-area"
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0, transition: { delay: 1.2 } }} 
            exit={{ opacity: 0 }}
            className="absolute bottom-6 z-30 w-full max-w-xs px-4"
          >
            <PartnerVerdictSlider onVerdict={onVerdict} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hand of Cards Fan */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        exit="hidden"
        className="relative z-10 w-full h-[300px] flex items-end justify-center"
      >
        {group.map((slot, index) => {
          const isConsumed = slot.consumed;
          const isSelected = slot.slotId === revealedSlotId;
          
          // Fan layout math
          const totalCards = group.length;
          const offset = index - (totalCards - 1) / 2;
          const rotation = offset * 12;
          const xPos = offset * 45;
          const yPos = Math.abs(offset) * 8;

          // ── VARIANTS: Handled dynamically for selected vs non-selected ──
          const cardVariants = {
            hidden: { y: 0, x: 0, rotate: 0, opacity: 0, scale: 0.8 },
            show: { 
              y: isSelected ? -150 : yPos,
              x: isSelected ? 0 : xPos, 
              rotate: isSelected ? 0 : rotation, 
              opacity: isRevealing && !isSelected ? 0.25 : 1,
              scale: isSelected ? 1.45 : (isRevealing && !isSelected ? 0.9 : 1),
              zIndex: isSelected ? 50 : (isConsumed ? 0 : index + 10),
              transition: { type: 'spring', damping: 25, stiffness: 100 }
            }
          };

          // ── SELECTED CARD: Rises from bottom with a bottom-to-top flip ──
          if (isSelected) {
            return (
              <motion.div
                key={slot.slotId}
                layoutId={`card-${slot.slotId}`}
                variants={cardVariants}
                className="absolute aspect-[2/3.2] w-28 sm:w-36"
                style={{ transformOrigin: 'center center', perspective: 1500 }}
              >
                {/* Inner 3D flip — flips immediately while rising, no delay */}
                  <motion.div
                    initial={{ rotateX: 0 }}
                    animate={{ rotateX: -180 }}
                    transition={{
                      duration: 1.4,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                    style={{ transformStyle: 'preserve-3d' }}
                    className="w-full h-full relative"
                  >
                    {/* FRONT — Card Back Image (visible before flip) */}
                    <div
                      className="absolute inset-0 rounded-2xl bg-cover bg-center border-2 border-amber-500/50 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)]"
                      style={{ backfaceVisibility: 'hidden', backgroundImage: getCardBack(diceNumber) }}
                    >
                      <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none"></div>
                      <div className="absolute inset-[2px] border border-white/10 rounded-lg pointer-events-none"></div>
                      {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>

                    {/* BACK — Task Content (flipped on X-axis, so rotateX: 180) */}
                    <div 
                      className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${colors?.bg || 'from-neutral-900 to-black'} border-2 ${colors?.border || 'border-neutral-700'} flex flex-col items-center justify-center p-3 text-center overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.9)]`}
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateX(180deg)' }}
                    >
                      <div className="absolute inset-0 bg-noise opacity-20"></div>
                      <div className="absolute -top-16 -right-16 w-32 h-32 bg-amber-500/10 blur-[30px] rounded-full pointer-events-none"></div>
                      <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-rose-500/10 blur-[40px] rounded-full pointer-events-none"></div>

                      {revealedTask && (
                        <>
                          <div className={`text-[7px] uppercase tracking-[0.2em] font-black mb-2 border px-2 py-0.5 rounded-full z-10 ${colors.text} border-current bg-black/40`}>
                            {revealedTask.intensity}
                          </div>
                          <p className="text-xs sm:text-sm font-serif leading-snug text-amber-300 z-10 drop-shadow-md px-1">
                            "{revealedTask.text}"
                          </p>
                          {isMyTurn && (
                            <SuspenseTimer duration={30} onTimeout={onTimeout} />
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
              </motion.div>
            );
          }

          // ── NON-SELECTED CARDS: Stay in fan, dim when a card is picked ──
          return (
            <motion.div
              key={slot.slotId}
              layoutId={`card-${slot.slotId}`}
              variants={cardVariants}
              onClick={() => {
                if (!isConsumed && isMyTurn && !isRevealing) onSelectCard(slot.slotId);
              }}
              whileHover={!isConsumed && isMyTurn && !isRevealing ? { y: -40, x: xPos, rotate: 0, scale: 1.15, zIndex: 50 } : {}}
              whileTap={!isConsumed && isMyTurn && !isRevealing ? { scale: 0.95 } : {}}
              className={`absolute aspect-[2/3.2] w-28 sm:w-36 rounded-2xl flex flex-col items-center justify-center overflow-hidden transition-colors duration-300 shadow-[0_15px_40px_rgba(0,0,0,0.8)] ${
                isConsumed 
                  ? 'opacity-40 grayscale border border-neutral-800 cursor-not-allowed z-0'
                  : `border-2 border-neutral-700/50 ${isMyTurn && !isRevealing ? 'cursor-pointer hover:border-amber-500 hover:shadow-[0_0_40px_rgba(251,191,36,0.4)] z-10' : 'pointer-events-none z-10'}`
              }`}
              style={{
                zIndex: isConsumed ? 0 : index + 10,
                transformOrigin: 'bottom center'
              }}
            >
              {/* Premium Image Background */}
              <div 
                className="absolute inset-0 bg-cover bg-center pointer-events-none rounded-2xl"
                style={{ backgroundImage: getCardBack(diceNumber) }}
              ></div>
              
              {/* Subtle noise and border */}
              <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none"></div>
              <div className="absolute inset-[2px] border border-white/10 rounded-lg pointer-events-none"></div>

              {isConsumed ? (
                <>
                  <div className="absolute inset-0 bg-black/70 z-10"></div>
                  <CheckCircle2 className="w-10 h-10 text-neutral-500 z-20" />
                </>
              ) : null}
              
              {/* Minimal Card Number Identifier (bottom corner) */}
              <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-[8px] font-black text-neutral-400 tracking-widest backdrop-blur-sm z-20 border border-neutral-700">
                {diceNumber}-{index + 1}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
