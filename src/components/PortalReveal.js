import React, { useEffect, useRef, useState, useCallback } from 'react';
import anime from 'animejs/lib/anime.js';
import AdvancedPortalManager from './AdvancedPortalManager';

// Enhanced Portal Reveal with cinematic transitions
const PortalReveal = ({
  isOpen = false,
  progress = 0,
  onOpen = null,
  onComplete = null,
  accentColor = '#A8C7FA',
  size = 260,
  className = '',
  clickPosition = null,
  enableCinematicMode = true,
  fallbackToSimple = false
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [localProgress, setLocalProgress] = useState(progress);
  const [showAdvancedPortal, setShowAdvancedPortal] = useState(false);
  const [clickPos, setClickPos] = useState(clickPosition);
  const rafRef = useRef(0);

  useEffect(() => {
    setLocalProgress(progress);
  }, [progress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let t = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const render = () => {
      const w = size;
      const h = size;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      ctx.clearRect(0, 0, w, h);

      // Portal ring - proper proportions
      const maxR = Math.min(w, h) * 0.35;
      const r = 12 + localProgress * maxR;

      // Dark center with mystical glow
      ctx.save();
      const centerGrad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, r);
      centerGrad.addColorStop(0, 'rgba(60,47,79,0.9)');
      centerGrad.addColorStop(0.7, 'rgba(27,38,59,0.6)');
      centerGrad.addColorStop(1, 'rgba(26,60,52,0.3)');
      ctx.fillStyle = centerGrad;
      ctx.beginPath();
      ctx.arc(w/2, h/2, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Mystical runes around the portal
      const runes = ['✦', '☽', '⚝', '⚜', '☾', '✧', '⚹', '♱'];
      ctx.save();
      ctx.translate(w/2, h/2);
      for (let i = 0; i < runes.length; i++) {
        const angle = (i / runes.length) * Math.PI * 2 + t * 0.3;
        const runeR = r + 15;
        const x = Math.cos(angle) * runeR;
        const y = Math.sin(angle) * runeR;
        ctx.fillStyle = `hsla(210, 80%, 70%, ${0.4 + localProgress * 0.6})`;
        ctx.font = '14px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(runes[i], x, y);
      }
      ctx.restore();

      // Portal energy waves
      if (localProgress > 0.3) {
        for (let wave = 0; wave < 3; wave++) {
          ctx.save();
          ctx.globalAlpha = 0.3 * localProgress;
          ctx.strokeStyle = '#A8C7FA';
          ctx.lineWidth = 1;
          const waveR = r * (0.8 + wave * 0.1) + Math.sin(t * 2 + wave) * 3;
          ctx.beginPath();
          ctx.arc(w/2, h/2, waveR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      t += 0.02;
      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [size, accentColor, localProgress]);

  // Обработчик клика для определения позиции
  const handlePortalClick = useCallback((event) => {
    if (enableCinematicMode && !fallbackToSimple && isOpen && localProgress >= 0.8) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const x = event.clientX;
        const y = event.clientY;
        setClickPos({ x, y });
        setShowAdvancedPortal(true);
        
        // Воспроизводим событие для других компонентов
        window.dispatchEvent(new CustomEvent('portal-opened', { 
          detail: { x, y, source: 'PortalReveal' } 
        }));
      }
    } else if (onOpen && localProgress >= 1) {
      onOpen();
    }
  }, [enableCinematicMode, fallbackToSimple, isOpen, localProgress, onOpen]);

  // Обработчик завершения портальных эффектов
  const handleAdvancedPortalComplete = useCallback((result) => {
    if (onComplete) {
      onComplete(result);
    }
    if (onOpen) {
      onOpen(result);
    }
  }, [onComplete, onOpen]);

  // Обработчик закрытия продвинутого портала
  const handleAdvancedPortalClose = useCallback(() => {
    setShowAdvancedPortal(false);
    setLocalProgress(0); // Сбрасываем прогресс для повторного использования
  }, []);

  useEffect(() => {
    if (isOpen && onOpen && localProgress >= 1 && !enableCinematicMode) {
      onOpen();
    }
  }, [isOpen, localProgress, onOpen, enableCinematicMode]);

  // Animate progress when isOpen toggles true
  useEffect(() => {
    if (!isOpen) return;
    
    anime({
      targets: { p: localProgress },
      p: 1,
      duration: enableCinematicMode ? 2000 : 1600, // Дольше для кинематографического режима
      easing: enableCinematicMode ? 'easeOutCubic' : 'easeInOutQuad',
      update: (anim) => setLocalProgress(anim.animations[0].currentValue),
      complete: () => {
        if (!enableCinematicMode && onOpen) {
          onOpen();
        }
        // В кинематографическом режиме ждем клика пользователя
      }
    });
  }, [isOpen, enableCinematicMode, onOpen]);

  return (
    <>
      <div 
        ref={containerRef} 
        className={`portal-reveal ${className} ${enableCinematicMode ? 'cinematic-mode' : ''}`} 
        style={{ 
          position: 'relative',
          cursor: (enableCinematicMode && isOpen && localProgress >= 0.8) ? 'pointer' : 'default'
        }}
        onClick={handlePortalClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handlePortalClick(e);
          }
        }}
        tabIndex={isOpen && localProgress >= 0.8 ? 0 : -1}
        role={enableCinematicMode ? "button" : undefined}
        aria-label={enableCinematicMode ? "Открыть портал в алхимическую лабораторию" : undefined}
      >
        <canvas ref={canvasRef} />
        
        {/* Индикатор готовности к клику в кинематографическом режиме */}
        {enableCinematicMode && isOpen && localProgress >= 0.8 && !showAdvancedPortal && (
          <div 
            className="portal-click-indicator"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: accentColor,
              fontSize: '14px',
              textAlign: 'center',
              textShadow: '0 0 10px currentColor',
              animation: 'portalPulse 2s ease-in-out infinite',
              pointerEvents: 'none',
              zIndex: 10
            }}
          >
            ✦ Нажмите для входа ✦
          </div>
        )}
      </div>
      
      {/* Продвинутый портальный менеджер */}
      {showAdvancedPortal && (
        <AdvancedPortalManager
          isOpen={showAdvancedPortal}
          clickPosition={clickPos}
          onClose={handleAdvancedPortalClose}
          onComplete={handleAdvancedPortalComplete}
        />
      )}
      
      {/* CSS для анимации индикатора */}
      <style jsx>{`
        @keyframes portalPulse {
          0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
        }
        
        .portal-reveal.cinematic-mode:hover {
          filter: brightness(1.1);
        }
        
        .portal-reveal.cinematic-mode:focus-visible {
          outline: 2px solid ${accentColor};
          outline-offset: 3px;
        }
        
        .portal-click-indicator {
          font-family: serif;
          font-weight: bold;
          letter-spacing: 2px;
        }
        
        @media (max-width: 768px) {
          .portal-click-indicator {
            font-size: 12px;
          }
        }
      `}</style>
    </>
  );
};

export default React.memo(PortalReveal);


