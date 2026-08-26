import React, { useEffect } from 'react';
import './BurnTransition.css';

export default function BurnTransition({ children, isBurning, onComplete }) {
  
  useEffect(() => {
    if (isBurning) {
      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 1500); 
      return () => clearTimeout(timer);
    }
  }, [isBurning, onComplete]);

  return (
    <div className={`burn-container relative w-full h-full overflow-hidden ${isBurning ? 'is-burning' : ''}`}
         style={{ borderRadius: 'inherit' }}>
      
      {/* 
        MASK LAYER:
        White-to-black burn mask sits BEHIND the original card.
        Only rendered when burning, so it doesn't interfere with normal display.
      */}
      {isBurning && (
        <div className="mask-wrapper">
          <div className="layer-burn" />
        </div>
      )}
      
      {/* 
        ORIGINAL CARD LAYER:
        mix-blend-mode: darken is ONLY applied when burning.
        Before burning, the card renders completely normally.
      */}
      <div 
        className="layer-original absolute inset-0 w-full h-full"
        style={isBurning ? { mixBlendMode: 'darken' } : {}}
      >
        {children}
      </div>

      {/* 
        EFFECT LAYERS:
        Glowing fire edges and floating ashes.
        Only rendered when burning.
      */}
      {isBurning && (
        <div className="mask-wrapper pointer-events-none">
          <div className="layer-burnline" />
          <div className="layer-ash" />
          <div className="layer-ash-outer" />
        </div>
      )}
    </div>
  );
}
