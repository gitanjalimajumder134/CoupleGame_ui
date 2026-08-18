import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function SuspenseTimer({ duration = 30, onTimeout, startDelay = 1500 }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [started, setStarted] = useState(false);

  // Wait for the flip animation to finish before starting the countdown
  useEffect(() => {
    const delayTimer = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(delayTimer);
  }, [startDelay]);

  useEffect(() => {
    if (!started) return;
    if (timeLeft <= 0) {
      onTimeout();
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [started, timeLeft, onTimeout]);

  const percentage = (timeLeft / duration) * 100;
  
  // Color transitions from violet/blue to red as time runs out
  const isUrgent = percentage < 25;
  const strokeColor = isUrgent ? '#E11D48' : '#8B5CF6'; 
  const dropShadow = isUrgent ? 'drop-shadow(0 0 15px #E11D48)' : 'drop-shadow(0 0 10px #8B5CF6)';

  return (
    <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden z-20">
      {/* Background track */}
      <div className="absolute inset-0 border-2 border-white/5 rounded-2xl" />
      
      {/* SVG Border Animation */}
      <svg className="absolute inset-0 w-full h-full" style={{ filter: dropShadow }}>
        <rect
          x="1" y="1"
          width="calc(100% - 2px)" height="calc(100% - 2px)"
          rx="15" ry="15"
          fill="none"
          stroke={strokeColor}
          strokeWidth="3"
          pathLength="100"
          strokeDasharray="100"
          strokeDashoffset={100 - percentage}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>

      {/* Heartbeat Pulse when urgent */}
      {isUrgent && (
        <motion.div 
          className="absolute inset-0 border-4 border-red-500/30 rounded-2xl"
          animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.02, 1] }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
        />
      )}

    </div>
  );
}
