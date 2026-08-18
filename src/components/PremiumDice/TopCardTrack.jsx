import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, EyeOff, Flame, Droplet, Key, HeartPulse } from 'lucide-react';

const icons = [Lock, EyeOff, Flame, Droplet, Key, HeartPulse];

export default function TopCardTrack({ cards, activeDiceNumber }) {
  return (
    <div className="w-full flex justify-center items-center py-4 px-2 overflow-hidden bg-gradient-to-b from-black/80 to-transparent">
      <div className="flex space-x-3 sm:space-x-4">
        <AnimatePresence>
          {cards.map((card, index) => {
            const isTarget = activeDiceNumber === (index + 1);
            const Icon = icons[index % icons.length];

            // If it's the target and we are revealing, hide it from the track
            // It will animate in the CardRevealPopup
            if (isTarget) return null;

            return (
              <motion.div
                key={card.id || index}
                layoutId={`card-container-${index + 1}`}
                initial={{ opacity: 0, y: -20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  scale: [1, 1.02, 1],
                  boxShadow: [
                    '0 0 10px rgba(0,0,0,0.5)',
                    '0 0 20px rgba(139,92,246,0.2)',
                    '0 0 10px rgba(0,0,0,0.5)'
                  ]
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  scale: { repeat: Infinity, duration: 3 + (index * 0.2), ease: "easeInOut" },
                  boxShadow: { repeat: Infinity, duration: 3 + (index * 0.2), ease: "easeInOut" },
                  layout: { duration: 0.5, type: 'spring' }
                }}
                className="w-12 h-16 sm:w-16 sm:h-24 rounded-lg bg-gradient-to-br from-neutral-800 to-black border border-neutral-700/50 flex items-center justify-center relative overflow-hidden"
              >
                {/* Leather texture overlay */}
                <div className="absolute inset-0 bg-noise opacity-30"></div>
                
                {/* Icon */}
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-500/50 z-10" strokeWidth={1.5} />
                
                {/* Subtle glass reflection */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent z-20 pointer-events-none rounded-lg"></div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
