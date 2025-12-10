import React, { useState, useRef, useEffect } from 'react';
import './BalanceButton.css';
import PortalReveal from './PortalReveal';

const BalanceButton = ({ 
  onTap, 
  onComboChange, 
  size = 'normal', 
  progress = 0, 
  accentColor = '#c6f3ff',
  // Portal-in-button props
  portalProgress = 0,
  portalOpen = false,
  onPortalOpen = null
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState([]);
  const [isHovering, setIsHovering] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [comboActive, setComboActive] = useState(false);
  const [orbitAngle, setOrbitAngle] = useState(0);
  const buttonRef = useRef(null);
  const comboTimeoutRef = useRef(null);
  
  const runeSymbols = ['✦', '✧', '⚝', '⚜', '☽', '☾', '⚹', '♱', '♰', '☥'];
  const [currentSymbol, setCurrentSymbol] = useState('✦');
  
  // Rotate symbols periodically
  useEffect(() => {
    const symbolInterval = setInterval(() => {
      if (!isAnimating) {
        const randomIndex = Math.floor(Math.random() * runeSymbols.length);
        setCurrentSymbol(runeSymbols[randomIndex]);
      }
    }, 5000);
    
    return () => clearInterval(symbolInterval);
  }, [isAnimating]);
  
  // Reset combo after inactivity
  useEffect(() => {
    if (tapCount > 0) {
      if (comboTimeoutRef.current) {
        clearTimeout(comboTimeoutRef.current);
      }
      
      comboTimeoutRef.current = setTimeout(() => {
        setTapCount(0);
        setComboActive(false);
      }, 3000);
    }
    
    return () => {
      if (comboTimeoutRef.current) {
        clearTimeout(comboTimeoutRef.current);
      }
    };
  }, [tapCount]);

  // Орбитальные руны вокруг кнопки (GPU-friendly)
  useEffect(() => {
    let rafId;
    const tick = () => {
      setOrbitAngle(prev => (prev + (comboActive ? 1.6 : 0.8)) % 360);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [comboActive]);
  
  const handleTap = () => {
    if (isAnimating) return;
    
    // Keep a very short lock to avoid accidental multi-fire, but allow fast tapping
    setIsAnimating(true);
    
    // Increment tap count for combo
    const newTapCount = tapCount + 1;
    setTapCount(newTapCount);
    
    // Activate combo effect after 5 consecutive taps
    if (newTapCount >= 5 && !comboActive) {
      setComboActive(true);
    }
    
    // Notify parent about combo changes if callback exists
    if (onComboChange && newTapCount >= 5) {
      onComboChange(newTapCount);
    }
    
    // Create particles
    const newParticles = [];
    const particleCount = comboActive ? 20 : 12;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * 360;
      const speed = 2 + Math.random() * 3;
      const size = 5 + Math.random() * 10;
      
      // Use more vibrant colors for combo mode
      const hue = comboActive 
        ? Math.random() * 360 // Full spectrum for combo
        : Math.random() * 30 + 40; // Gold/amber for normal
      
      const saturation = comboActive ? '90%' : '80%';
      const lightness = comboActive ? '60%' : '70%';
      const color = `hsl(${hue}, ${saturation}, ${lightness})`;
      
      newParticles.push({
        id: Date.now() + i,
        angle,
        speed,
        size,
        color,
        x: 0,
        y: 0,
        opacity: 1,
        symbol: Math.random() > 0.6 ? runeSymbols[Math.floor(Math.random() * runeSymbols.length)] : ''
      });
    }
    
    setParticles(newParticles);
    
    // Call the onTap callback with tiered bonus for combo (x2 after 5, x3 after 10)
    if (onTap) {
      const bonusMultiplier = newTapCount >= 10 ? 3 : (newTapCount >= 5 ? 2 : 1);
      onTap(0.01 * bonusMultiplier);
    }

    // Dispatch global event to animate energy orb to balance counter
    try {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) {
        const event = new CustomEvent('energy-collected', {
          detail: {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            amount: 0.01
          }
        });
        window.dispatchEvent(event);
      }
    } catch (_) {}
    
    // Change symbol during animation
    const randomIndex = Math.floor(Math.random() * runeSymbols.length);
    setCurrentSymbol(runeSymbols[randomIndex]);
    
    // Reset quickly to allow rapid tapping
    setTimeout(() => {
      setIsAnimating(false);
      setParticles([]);
    }, 120);
  };
  
  const buttonSizeClass = size === 'large' ? 'mystic-button-large' : '';
  const clampedProgress = Math.max(0, Math.min(1, progress || 0));
  
  return (
    <div 
      className={`mystic-button-container ${size === 'large' ? 'large-container' : ''}`}
      style={{ ['--accent']: accentColor }}
    >
      <button 
        ref={buttonRef}
        className={`mystic-button ${buttonSizeClass} ${isAnimating ? 'animate' : ''} ${comboActive ? 'combo-active' : ''} ${isHovering ? 'hover' : ''}`}
        onClick={handleTap}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onTouchStart={() => setIsHovering(true)}
        onTouchEnd={() => setIsHovering(false)}
        disabled={isAnimating}
        aria-label="Collect mystical energy"
        aria-live="polite"
      >
        {/* Embedded Portal Reveal */}
        <div className="portal-overlay" aria-hidden>
          <PortalReveal 
            isOpen={portalOpen}
            progress={portalProgress}
            accentColor={accentColor}
            size={size === 'large' ? 200 : 110}
            onOpen={() => {
              try { window.dispatchEvent(new Event('portal-opened')); } catch(_) {}
              if (onPortalOpen) onPortalOpen();
            }}
          />
        </div>
        {/* Прогресс-дуга уровня зоны */}
        <div 
          className="progress-ring"
          style={{ ['--progressDeg']: `${clampedProgress * 360}deg` }}
          aria-hidden
        />
        {/* Дуга комбо: растёт от 0 до 120° при 5 и 240° при 10 */}
        {comboActive && (
          <div
            className="combo-ring"
            style={{ ['--comboDeg']: `${Math.min(240, (tapCount % 10) * 24)}deg` }}
            aria-hidden
          />
        )}
        <div className={`mystic-symbol ${size === 'large' ? 'symbol-large' : ''}`}>{currentSymbol}</div>
        <div className="mystic-glow"></div>
        {/* Орбиты с рунами */}
        <div className="orbits" aria-hidden>
          {[0, 1, 2].map(i => (
            <div key={i} className={`orbit orbit-${i + 1}`} style={{ ['--angle']: `${orbitAngle + i * 120}deg` }}>
              <span className="rune">{runeSymbols[(i * 3) % runeSymbols.length]}</span>
            </div>
          ))}
        </div>
        
        {/* Inner circles */}
        <div className="mystic-circle circle-1"></div>
        <div className="mystic-circle circle-2"></div>
        
        {/* Combo indicator */}
        {tapCount > 0 && (
          <div className={`combo-counter ${size === 'large' ? 'counter-large' : ''}`} style={{ opacity: Math.min(tapCount * 0.2, 1) }}>
            {tapCount}x
          </div>
        )}
        
        {/* Particles */}
        {particles.map(particle => (
          <div
            key={particle.id}
            className="mystic-particle"
            style={{
              width: `${particle.size * (size === 'large' ? 1.5 : 1)}px`,
              height: `${particle.size * (size === 'large' ? 1.5 : 1)}px`,
              backgroundColor: particle.symbol ? 'transparent' : particle.color,
              color: particle.color,
              transform: `rotate(${particle.angle}deg) translateY(-${size === 'large' ? 80 : 50}px)`,
              opacity: particle.opacity,
              fontSize: `${particle.size * (size === 'large' ? 1.8 : 1.2)}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '--angle': `${particle.angle}deg`
            }}
          >
            {particle.symbol}
          </div>
        ))}
      </button>
      
      {/* Tap hint - only show for normal size */}
      {size !== 'large' && (
        <div className="tap-hint">
          {comboActive ? 'Комбо активировано! x2' : 'Нажимай для сбора энергии'}
        </div>
      )}
    </div>
  );
};

export default BalanceButton;