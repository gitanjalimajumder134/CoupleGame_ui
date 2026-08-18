import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SuspenseTimer from './SuspenseTimer';
import PartnerVerdictSlider from './PartnerVerdictSlider';
import { Lock, EyeOff, Flame, Droplet, Key, HeartPulse, CheckCircle2, XCircle } from 'lucide-react';

const icons = [Lock, EyeOff, Flame, Droplet, Key, HeartPulse];

const INTENSITY_COLORS = {
  tease: { bg: 'from-amber-900/60 to-black', border: 'border-amber-500/30', text: 'text-amber-200', glow: 'cozy-glow-amber' },
  flirty: { bg: 'from-rose-900/60 to-black', border: 'border-rose-400/30', text: 'text-rose-200', glow: 'cozy-glow-rose' },
  hot: { bg: 'from-orange-900/60 to-black', border: 'border-orange-500/30', text: 'text-orange-300', glow: 'cozy-glow-amber' },
  steamy: { bg: 'from-red-950/80 to-black', border: 'border-red-500/30', text: 'text-red-300', glow: 'cozy-glow-rose' },
  extreme: { bg: 'from-[#2a0808]/90 to-black', border: 'border-[#7a1b1b]/50', text: 'text-red-400', glow: 'cozy-glow-rose' },
  wildcard: { bg: 'from-yellow-900/60 to-black', border: 'border-yellow-500/30', text: 'text-yellow-200', glow: 'cozy-glow-amber' },
};

const getCardBack = (diceNum) => {
  if (diceNum === 1) return 'url(/card-back-1.png)';
  if (diceNum === 2) return 'url(/card-back-2.png)';
  if (diceNum === 3) return 'url(/card-back-3.png)';
  if (diceNum === 4) return 'url(/card-back-4.png)';
  if (diceNum === 5) return 'url(/card-back-5.png)';
  return 'url(/card-back-6.png)';
};

export default function CardRevealPopup({ 
  cardTask, 
  diceNumber, 
  slotId,
  isMyTurn,
  showVerdictControls,
  onTimeout, 
  onVerdict 
}) {
  const Icon = icons[(diceNumber - 1) % icons.length] || Lock;
  const colors = INTENSITY_COLORS[cardTask?.intensity] || INTENSITY_COLORS.flirty;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4">
      {/* Heavy Backdrop Blur */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-3xl z-0" 
      />

      {/* The 3D Card Container */}
      <div style={{ perspective: 1500 }} className="z-10 w-full max-w-sm aspect-[2.5/3.5] relative mt-10">
        <motion.div
          layoutId={`card-${slotId}`}
          initial={{ rotateY: 0, scale: 0.8 }}
          animate={{ rotateY: 180, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
          style={{ transformStyle: 'preserve-3d' }}
          className="w-full h-full relative"
        >
          {/* FRONT OF CARD (Visually the Back of the card before flip) */}
          <div 
            className="absolute inset-0 backface-hidden rounded-2xl bg-cover bg-center border border-neutral-700 glass-panel flex flex-col items-center justify-center overflow-hidden"
            style={{ backfaceVisibility: 'hidden', backgroundImage: getCardBack(diceNumber) }}
          >
            <div className="absolute inset-0 bg-noise opacity-30"></div>
            <Icon className="w-16 h-16 text-neutral-500 opacity-50 z-10" strokeWidth={1} />
            <div className="absolute bottom-6 text-[10px] font-black text-neutral-600 tracking-[0.3em] uppercase z-10">
              Target Acquired
            </div>
          </div>

          {/* BACK OF CARD (Visually the Front containing the Task, rotated 180 initially) */}
          <div 
            className={`absolute inset-0 backface-hidden rounded-2xl bg-gradient-to-br ${colors.bg} border-2 ${colors.border} flex flex-col items-center justify-center p-6 text-center overflow-hidden ${colors.glow}`}
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="absolute inset-0 bg-noise opacity-20"></div>
            
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none transform -rotate-45 scale-150">
              <span className="text-8xl font-black text-white tracking-tighter">ACTIVE</span>
            </div>

            {/* Embers/Particles Effect (CSS representation) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
               {/* Just a simple visual noise or radial gradient for now */}
               <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 blur-[40px] rounded-full"></div>
               <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-rose-500/10 blur-[50px] rounded-full"></div>
            </div>

            <div className={`text-[9px] uppercase tracking-[0.3em] font-black mb-6 border px-4 py-1.5 rounded-full z-10 ${colors.text} border-current bg-black/40`}>
              {cardTask?.intensity}
            </div>

            <p className="text-2xl font-serif leading-snug text-white z-10 drop-shadow-md">
              {cardTask?.text}
            </p>

            {/* The Suspense Timer Frame */}
            {isMyTurn && (
               <SuspenseTimer duration={30} onTimeout={onTimeout} />
            )}
          </div>
        </motion.div>
      </div>

      {/* Action Controls Area */}
      <div className="z-10 mt-10 w-full max-w-xs h-32 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {isMyTurn && (
            <motion.div key="acting" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 1 } }} className="text-center absolute top-0 mt-[-40px]">
               <p className="text-amber-400/80 text-[10px] font-black uppercase tracking-widest animate-pulse">
                Perform the task before time runs out.
              </p>
            </motion.div>
          )}

          {showVerdictControls && (
            <motion.div key="judging" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 1 } }} className="w-full">
              <PartnerVerdictSlider onVerdict={onVerdict} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
