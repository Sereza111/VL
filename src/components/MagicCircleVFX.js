import React, { useEffect, useRef } from 'react';

const MagicCircleVFX = ({ show = false, color = '#A8C7FA', duration = 1200 }) => {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let t0 = 0;
    let running = false;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const render = (time) => {
      if (!running) return;
      if (!t0) t0 = time;
      const elapsed = time - t0;
      const p = Math.min(1, elapsed / duration);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const baseR = Math.min(cx, cy) * 0.35;
      // Outer fading circle
      ctx.save();
      ctx.globalAlpha = 0.6 * (1 - p);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, baseR * (0.9 + p * 0.2), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      // Rotating runes
      const rings = 3;
      for (let r = 0; r < rings; r++) {
        const rr = baseR * (0.4 + r * 0.2);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(((r % 2 === 0 ? 1 : -1) * time) / 1200);
        ctx.globalAlpha = 0.9 - r * 0.25;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < 12; i++) {
          const a0 = (i / 12) * Math.PI * 2;
          ctx.moveTo(Math.cos(a0) * (rr - 6), Math.sin(a0) * (rr - 6));
          ctx.lineTo(Math.cos(a0) * (rr + 6), Math.sin(a0) * (rr + 6));
        }
        ctx.stroke();
        ctx.restore();
      }
      if (p < 1) rafRef.current = requestAnimationFrame(render);
    };
    const start = () => {
      running = true;
      t0 = 0;
      rafRef.current = requestAnimationFrame(render);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    window.addEventListener('resize', resize);
    resize();
    if (show) start(); else stop();
    return () => { window.removeEventListener('resize', resize); stop(); };
  }, [show, color, duration]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ position:'fixed', inset:0, zIndex: 900, pointerEvents:'none' }}
      aria-hidden
    />
  );
};

export default React.memo(MagicCircleVFX);


