import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Heart, Sparkles, Zap, Lock } from 'lucide-react';
import { formatCardText } from '../../utils/text';

// Helper to get category styles (Phase 5)
const getCategoryStyles = (category) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('sparks')) {
    return {
      name: 'Sparks',
      colors: {
        glow: 'rgba(236, 72, 153, 0.5)',
        border: 'border-pink-500/50',
        bg: 'from-pink-950/80 to-[#0a0a0a]',
        text: 'text-pink-400',
        particles: 'bg-pink-500',
      },
      icon: Sparkles
    };
  }
  if (cat.includes('flames')) {
    return {
      name: 'Flames',
      colors: {
        glow: 'rgba(239, 68, 68, 0.6)',
        border: 'border-red-500/50',
        bg: 'from-red-950/80 to-[#0a0a0a]',
        text: 'text-red-500',
        particles: 'bg-red-500',
      },
      icon: Flame
    };
  }
  if (cat.includes('wildfire') || cat.includes('boss')) {
    return {
      name: 'Wildfire',
      colors: {
        glow: 'rgba(255, 215, 0, 0.5)', // Gold glow for wild
        border: 'border-[#FFD700]/50', // Gold border
        bg: 'from-black via-[#1a0000] to-black', // Deep black + crimson
        text: 'text-[#FFD700]',
        particles: 'bg-[#FFD700]',
      },
      icon: Zap
    };
  }
  // Default / Romance
  return {
    name: category || 'Romance',
    colors: {
      glow: 'rgba(244, 63, 94, 0.5)',
      border: 'border-rose-500/50',
      bg: 'from-rose-950/80 to-[#050505]',
      text: 'text-rose-400',
      particles: 'bg-rose-400',
    },
    icon: Heart
  };
};

export default function CinematicDeck({ 
  card, 
  loading, 
  isMyTurn, 
  onDraw, 
  activePlayerName, 
  inactivePlayerName,
  heatLevel
}) {
  const [step, setStep] = useState('intro'); // 'intro' -> 'idle' -> 'anticipation' -> 'reveal'
  const [introPhase, setIntroPhase] = useState(0); 
  const [showLightSweep, setShowLightSweep] = useState(false);
  const styles = getCategoryStyles(card?.type || heatLevel);
  const Icon = styles.icon;

  // Cinematic Intro Sequence
  useEffect(() => {
    if (step === 'intro') {
      const sequence = async () => {
        await new Promise(r => setTimeout(r, 800));
        setIntroPhase(1); // Red glow + particles
        await new Promise(r => setTimeout(r, 1200));
        setIntroPhase(2); // Card emerges
        await new Promise(r => setTimeout(r, 1000));
        setIntroPhase(3); // Light sweep
        await new Promise(r => setTimeout(r, 1200));
        setIntroPhase(4); // Text 1
        await new Promise(r => setTimeout(r, 2000));
        setIntroPhase(5); // Text 2
        await new Promise(r => setTimeout(r, 1000));
        setStep('idle');
      };
      sequence();
    }
  }, [step]);

  // Reset state when a new card arrives or turn changes
  useEffect(() => {
    if (!card && step === 'reveal') {
      setStep('idle');
    }
  }, [card]);

  const handleDeckClick = () => {
    if (!isMyTurn || loading || step === 'intro') return;

    if (step === 'idle') {
      setStep('reveal');
      setShowLightSweep(true);
      setTimeout(() => setShowLightSweep(false), 1500);
      if (!card) {
        onDraw(); 
      }
    }
  };

  const displayCard = card || {
    type: 'Revealing...',
    text: 'Uncovering your challenge...',
    isSecret: false,
    author: null
  };

  return (
    <div className="relative w-[300px] h-[440px] perspective-[2000px] flex justify-center items-center">
      
      {/* ── AMBIENT PARTICLES (Phase 1) ── */}
      <AnimatePresence>
        {(introPhase >= 1 || step !== 'intro') && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-0 pointer-events-none"
          >
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className={`ambient-particle-lux ${styles.colors.particles}`}
                style={{
                  width: `${Math.random() * 6 + 2}px`,
                  height: `${Math.random() * 6 + 2}px`,
                  left: '50%',
                  top: '50%',
                  transform: `translate(${(Math.random() - 0.5) * 400}px, ${(Math.random() - 0.5) * 500}px)`,
                  '--dur': `${Math.random() * 6 + 4}s`,
                  '--del': `${Math.random() * 2}s`,
                  '--max-op': Math.random() * 0.5 + 0.1
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── THE DECK (Background Stack) ── */}
      <AnimatePresence>
        {step === 'idle' && introPhase >= 2 && (
          <motion.div 
            className="absolute inset-0 w-full h-full animate-deck-float z-10"
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 1.5, ease: [0.23, 1, 0.32, 1] } }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
          >
            <div className="absolute inset-0 bg-black rounded-[2rem] border border-[#2a0812] transform translate-y-5 translate-x-3 rotate-3 shadow-[0_20px_40px_rgba(0,0,0,0.8)] opacity-40 lux-card-texture" />
            <div className="absolute inset-0 bg-[#0a0204] rounded-[2rem] border border-[#3a0b18] transform translate-y-2 -translate-x-1 -rotate-1 shadow-[0_20px_40px_rgba(0,0,0,0.8)] opacity-60 lux-card-texture" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── THE ACTIVE CARD ── */}
      <AnimatePresence mode="wait">
        
        {/* STATE 1: IDLE (Card Back) */}
        {step === 'idle' || step === 'intro' ? (
          introPhase >= 2 && (
            <motion.div
              key="card-back"
              onClick={handleDeckClick}
              initial={{ rotateY: 0, y: 100, scale: 0.8, opacity: 0 }}
              animate={{ 
                rotateY: 0,
                y: 0, 
                scale: 1,
                opacity: 1,
                boxShadow: `0 20px 40px rgba(0,0,0,0.8)`
              }}
              exit={{ 
                rotateY: -180, 
                scale: 1.1,
                y: -10,
                transition: { duration: 1.2, ease: [0.23, 1, 0.32, 1] } 
              }}
              whileTap={isMyTurn && step === 'idle' ? { scale: 0.96, transition: { duration: 0.1 } } : {}}
              transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
              style={{ transformStyle: 'preserve-3d' }}
              className={`absolute inset-0 w-full h-full rounded-[2rem] border z-20 overflow-hidden ${
                isMyTurn ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'
              } border-[#4a0d1e]`}
            >
              
              {/* Phase 3: The Signature First Card Design */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a050a] to-black flex flex-col items-center justify-center p-6 text-center lux-card-texture" style={{ backfaceVisibility: 'hidden' }}>
                
                {/* Intro Light Sweep */}
                {introPhase === 3 && <div className="lux-specular" />}
                
                <div className="absolute inset-0 border-[1px] border-[#4a0d1e]/30 rounded-[2rem] m-2" />
                <div className="absolute inset-0 border-[1px] border-[#4a0d1e]/10 rounded-[2rem] m-4" />

                <motion.div 
                  className={`w-24 h-24 mb-10 flex items-center justify-center rounded-full border border-[#4a0d1e]/50 bg-black/40 shadow-inner`}
                  animate={step === 'idle' ? { scale: [1, 1.05, 1], boxShadow: ['0 0 0 rgba(244,63,94,0)', '0 0 30px rgba(244,63,94,0.3)', '0 0 0 rgba(244,63,94,0)'] } : {}}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Icon className="w-10 h-10 text-rose-700" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }} />
                </motion.div>
                
                <div className="z-10 flex flex-col items-center">
                  {step === 'intro' ? (
                    <div className="h-16 flex items-center justify-center">
                      <AnimatePresence mode="wait">
                        {introPhase === 4 && (
                          <motion.div key="text1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 1 }}>
                            <p className="font-serif italic text-rose-300/80 text-lg">Tonight is yours.</p>
                          </motion.div>
                        )}
                        {introPhase === 5 && (
                          <motion.div key="text2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 1 }}>
                            <p className="font-serif font-bold text-rose-400 text-sm uppercase tracking-widest">Ready to get a little naughty?</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
                      <h3 className="text-2xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-b from-[#FFD700] to-[#b39700] tracking-widest uppercase mb-3 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">Naughty Deck</h3>
                      <p className="text-[9px] text-rose-500/80 uppercase tracking-[0.4em] font-black animate-pulse">
                        {isMyTurn ? "Tap to Reveal" : `Waiting for ${activePlayerName}`}
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        ) : (
          /* STATE 3: REVEAL (Card Front) */
          <motion.div
            key="card-front"
            initial={{ rotateY: 180, scale: 1.1, y: -30, z: 100, opacity: 0 }}
            animate={{ 
              rotateY: 0, 
              scale: 1, 
              y: 0, 
              z: 0,
              opacity: 1,
              boxShadow: `0 30px 60px ${styles.colors.glow}, inset 0 0 20px rgba(0,0,0,0.8)`
            }}
            exit={{ opacity: 0, y: -50, scale: 0.9, transition: { duration: 0.5 } }}
            transition={{ duration: 1.2, type: 'spring', stiffness: 80, damping: 15 }}
            style={{ transformStyle: 'preserve-3d' }}
            className={`absolute inset-0 w-full h-full rounded-[2rem] border border-[#ffffff20] z-30 overflow-hidden lux-card-texture`}
          >
            {/* The Specular Light Sweep Glare (Phase 4) */}
            {showLightSweep && <div className="lux-specular" />}

            <div className={`absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br ${styles.colors.bg} mix-blend-multiply`} style={{ backfaceVisibility: 'hidden' }}>
              
              {/* Internal Vignette/Shadows */}
              <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.9)] pointer-events-none" />

              {/* Secret/Boss Lock Icon overlay */}
              {displayCard.isSecret && (
                <Lock className="absolute top-6 right-6 w-5 h-5 text-[#FFD700]/50" />
              )}

              {/* Progressive Text Reveal Container */}
              <div className="w-full flex flex-col items-center z-10">
                
                {/* Category Badge */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className={`text-[9px] uppercase tracking-[0.4em] font-black mb-8 px-5 py-2 rounded-full border ${styles.colors.border} ${styles.colors.text} bg-black/60 shadow-[0_0_20px_${styles.colors.glow}]`}
                >
                  {displayCard.type || styles.name}
                </motion.div>

                {/* Challenge Typography (Phase 4) */}
                <motion.div
                  initial={{ opacity: 0, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  transition={{ delay: 0.8, duration: 1 }}
                >
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mb-4">Your Challenge...</p>
                  <p className={`text-2xl font-serif leading-relaxed text-white/90 drop-shadow-[0_2px_10px_rgba(0,0,0,1)] w-full ${displayCard.type === 'Boss Dare' || displayCard.type === 'Wildfire' ? 'font-black text-[#FFD700]' : ''}`}>
                    {formatCardText(displayCard.text, activePlayerName, inactivePlayerName)}
                  </p>
                </motion.div>

                {/* Secret Stash Author */}
                {displayCard.author && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
                    className="mt-10 bg-black/40 border border-[#FFD700]/30 px-4 py-1.5 rounded-full"
                  >
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#FFD700]">
                      Secret by {displayCard.author}
                    </span>
                  </motion.div>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
