import React, { useEffect, useRef, useState } from 'react';
import anime from 'animejs/lib/anime.js';
import GenerativeIcon from '../../components/GenerativeIcon';
import './mini.css';

// Tap-timing crystal mining: hit the pulse at the sweet spot to get shards
const CrystalMine = ({ onClose, onMine, baseReward = 0.03, maxAttempts = 5 }) => {
  const barRef = useRef(null);
  const markerRef = useRef(null);
  const [direction, setDirection] = useState(1);
  const [pos, setPos] = useState(0.1);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const tick = () => {
      setPos(prev => {
        let np = prev + 0.009 * direction;
        if (np >= 0.98) { np = 0.98; setDirection(-1); }
        if (np <= 0.02) { np = 0.02; setDirection(1); }
        return np;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [direction]);

  const handleHit = () => {
    if (attempts >= maxAttempts) return;
    
    // Ideal zone is center 0.45 - 0.55
    const dist = Math.abs(pos - 0.5);
    let mult = 0;
    if (dist < 0.02) mult = 3;
    else if (dist < 0.06) mult = 2;
    else if (dist < 0.12) mult = 1;
    setScore(s => s + mult);
    setAttempts(a => a + 1);
    
    if (markerRef.current) {
      anime({ targets: markerRef.current, scale: [1, 1.2, 1], duration: 260, easing: 'easeOutQuad' });
    }
    // Impact flash
    const bar = barRef.current;
    if (bar) {
      anime({ targets: bar, background: ['rgba(60,47,79,0.6)','rgba(168,199,250,0.35)','rgba(60,47,79,0.6)'], duration: 300, easing: 'easeOutSine' });
    }
  };

  const handleClaim = () => {
    const reward = baseReward * (1 + score * 0.2);
    if (onMine) onMine(reward);
  };

  return (
    <div className="mini-overlay" onClick={onClose}>
      <div className="mini-panel" onClick={(e) => e.stopPropagation()}>
        <div className="mini-header">
          <GenerativeIcon name="crystal" size={20} />
          <span>Кристальная жила</span>
        </div>
        <div className="mini-body">
          <div className="mine">
            <div className="bar" ref={barRef}>
              <div className="sweet sweet-1" />
              <div className="sweet sweet-2" />
              <div className="marker" ref={markerRef} style={{ left: `${pos*100}%` }} />
            </div>
            <button className="btn primary" onClick={handleHit} disabled={attempts >= maxAttempts}>
              {attempts >= maxAttempts ? 'Попытки закончились' : `Ударить (${attempts}/${maxAttempts})`}
            </button>
          </div>
          <div className="mini-actions">
            <button className="btn" onClick={onClose}>Закрыть</button>
            <button className="btn primary" onClick={handleClaim}>Забрать кристаллы (счёт: {score})</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CrystalMine);


