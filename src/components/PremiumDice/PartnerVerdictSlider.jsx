import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { Check, X } from 'lucide-react';

export default function PartnerVerdictSlider({ onVerdict }) {
  const containerRef = useRef(null);
  const x = useMotionValue(0);
  const controls = useAnimation();
  const [verdictTriggered, setVerdictTriggered] = useState(false);

  // Dynamic backgrounds based on drag position
  // 0 is center. -100 is left (Reject). 100 is right (Approve).
  const background = useTransform(
    x,
    [-100, 0, 100],
    [
      "rgba(225, 29, 72, 0.4)", // Crimson Red
      "rgba(40, 30, 20, 0.4)",  // Neutral Glass
      "rgba(251, 191, 36, 0.4)" // Amber Gold
    ]
  );

  const borderColor = useTransform(
    x,
    [-100, 0, 100],
    [
      "rgba(225, 29, 72, 0.5)", // Red
      "rgba(255, 255, 255, 0.1)", // Neutral
      "rgba(251, 191, 36, 0.5)" // Amber
    ]
  );

  const shadow = useTransform(
    x,
    [-100, 0, 100],
    [
      "0 0 30px rgba(225, 29, 72, 0.6)",
      "0 10px 30px rgba(0, 0, 0, 0.5)",
      "0 0 30px rgba(251, 191, 36, 0.6)"
    ]
  );

  // Knob Icon opacities
  const leftOpacity = useTransform(x, [-50, 0], [1, 0.2]);
  const rightOpacity = useTransform(x, [0, 50], [0.2, 1]);

  const handleDragEnd = (event, info) => {
    if (verdictTriggered) return;

    const offset = info.offset.x;
    
    // Threshold to trigger verdict (adjust based on container width)
    if (offset > 80) {
      setVerdictTriggered(true);
      onVerdict('success');
    } else if (offset < -80) {
      setVerdictTriggered(true);
      onVerdict('fail');
    }
  };

  return (
    <div className="w-full flex flex-col items-center mt-4 relative z-50">
      <p className="text-[10px] uppercase font-black tracking-[0.2em] text-neutral-400 mb-3">
        Partner's Verdict
      </p>

      <motion.div
        ref={containerRef}
        style={{ background, borderColor, boxShadow: shadow }}
        className="w-full max-w-[280px] h-16 rounded-full border backdrop-blur-md relative flex items-center justify-center overflow-hidden transition-colors"
      >
        {/* Track Labels */}
        <div className="absolute left-4 z-0">
          <motion.div style={{ opacity: leftOpacity }}>
             <X className="w-5 h-5 text-red-500" />
          </motion.div>
        </div>
        <div className="absolute right-4 z-0">
          <motion.div style={{ opacity: rightOpacity }}>
             <Check className="w-5 h-5 text-amber-500" />
          </motion.div>
        </div>

        {/* The Draggable Knob */}
        <motion.div
          drag="x"
          dragConstraints={{ left: -100, right: 100 }}
          dragElastic={0.2}
          dragSnapToOrigin={!verdictTriggered}
          onDragEnd={handleDragEnd}
          style={{ x }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-14 h-14 bg-gradient-to-br from-neutral-800 to-black border border-neutral-600 rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.5)] z-10 flex items-center justify-center cursor-grab active:cursor-grabbing"
        >
          {/* Knob Grip Lines */}
          <div className="flex space-x-1">
            <div className="w-0.5 h-4 bg-neutral-500 rounded-full"></div>
            <div className="w-0.5 h-4 bg-neutral-500 rounded-full"></div>
            <div className="w-0.5 h-4 bg-neutral-500 rounded-full"></div>
          </div>
        </motion.div>

        {/* Shimmer Effect on Knob Track */}
        <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none rounded-full"></div>
      </motion.div>
      
      <div className="flex justify-between w-full max-w-[280px] mt-2 px-2">
         <span className="text-[8px] uppercase tracking-widest text-red-400 font-bold">Penalty</span>
         <span className="text-[8px] uppercase tracking-widest text-amber-400 font-bold">Satisfied</span>
      </div>
    </div>
  );
}
