import React, { useRef, useEffect, useState } from 'react';

const AlchemyFlask = ({ 
  liquidColor = '#4A90E2', 
  temperature = 20, 
  isHeating = false, 
  liquidLevel = 0.7,
  bubbleIntensity = 0 
}) => {
  const bubbleCanvasRef = useRef(null);
  const particleCanvasRef = useRef(null);
  const bubblesRef = useRef([]);
  const particlesRef = useRef([]);
  const animationRef = useRef(null);

  // Bubble System
  useEffect(() => {
    const canvas = bubbleCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = 200 * dpr;
    canvas.height = 300 * dpr;
    canvas.style.width = '200px';
    canvas.style.height = '300px';
    ctx.scale(dpr, dpr);

    // Создаём пузыри
    const createBubbles = () => {
      bubblesRef.current = [];
      const bubbleCount = Math.floor(bubbleIntensity * 15);
      
      for (let i = 0; i < bubbleCount; i++) {
        bubblesRef.current.push({
          x: Math.random() * 160 + 20, // Внутри колбы
          y: 300 - (liquidLevel * 200) + Math.random() * 50,
          radius: Math.random() * 6 + 2,
          speed: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.6 + 0.4,
          wobble: Math.random() * Math.PI * 2
        });
      }
    };

    const drawBubble = (bubble) => {
      const gradient = ctx.createRadialGradient(
        bubble.x, bubble.y, 1,
        bubble.x + 2, bubble.y + 2, bubble.radius
      );
      gradient.addColorStop(0, `rgba(255,255,255,${bubble.opacity})`);
      gradient.addColorStop(1, `rgba(173,216,230,0.1)`);
      
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    };

    const animate = () => {
      ctx.clearRect(0, 0, 200, 300);
      
      bubblesRef.current.forEach((bubble, index) => {
        bubble.y -= bubble.speed;
        bubble.x += Math.sin(bubble.wobble + bubble.y * 0.01) * 0.3;
        bubble.wobble += 0.02;
        
        // Если пузырь вышел за границы жидкости
        const liquidTop = 300 - (liquidLevel * 200);
        if (bubble.y < liquidTop) {
          bubble.y = 300 - (liquidLevel * 200) + Math.random() * 20;
          bubble.x = Math.random() * 160 + 20;
        }
        
        drawBubble(bubble);
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };

    createBubbles();
    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [bubbleIntensity, liquidLevel]);

  // Создание частиц при добавлении ингредиента
  const createIngredientParticles = (color) => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const particles = [];
    
    // Создаём частицы в центре колбы
    for (let i = 0; i < 25; i++) {
      particles.push({
        x: 100 + (Math.random() - 0.5) * 40,
        y: 150 + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        color: color,
        life: 1.0,
        decay: 0.015,
        radius: Math.random() * 3 + 1
      });
    }

    const animateParticles = () => {
      ctx.clearRect(0, 0, 200, 300);
      
      particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= particle.decay;
        particle.vx *= 0.98; // Затухание скорости
        particle.vy *= 0.98;
        
        ctx.save();
        ctx.globalAlpha = particle.life;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        if (particle.life <= 0) {
          particles.splice(index, 1);
        }
      });
      
      if (particles.length > 0) {
        requestAnimationFrame(animateParticles);
      }
    };
    
    animateParticles();
  };

  // Экспортируем функцию для внешнего использования
  useEffect(() => {
    if (window.alchemyFlask) {
      window.alchemyFlask.createParticles = createIngredientParticles;
    } else {
      window.alchemyFlask = { createParticles: createIngredientParticles };
    }
  }, []);

  return (
    <div className="alchemy-flask-container">
      <div 
        className="alchemy-flask"
        style={{
          filter: isHeating ? 'drop-shadow(0 0 20px rgba(255, 100, 100, 0.6))' : 'none'
        }}
      >
        {/* Жидкость */}
        <div 
          className="liquid"
          style={{
            background: `linear-gradient(45deg, ${liquidColor}, ${liquidColor}dd, ${liquidColor}aa)`,
            height: `${liquidLevel * 70}%`,
            animation: isHeating ? 'liquidBubble 1s ease-in-out infinite' : 'none'
          }}
        />
        
        {/* Canvas для пузырей */}
        <canvas 
          ref={bubbleCanvasRef}
          className="bubble-canvas"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            zIndex: 2
          }}
        />
        
        {/* Canvas для частиц */}
        <canvas 
          ref={particleCanvasRef}
          width="200"
          height="300"
          className="particle-canvas"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            zIndex: 3
          }}
        />
        
        {/* Блик на стекле */}
        <div className="flask-shine" />
      </div>
      
      {/* Температурный индикатор */}
      <div className="temperature-indicator">
        <div className="temp-gauge">
          <div 
            className="temp-mercury"
            style={{
              height: `${Math.min(100, (temperature - 20) / 180 * 100)}%`,
              background: temperature > 100 
                ? 'linear-gradient(0deg, #ff4444, #ff8844)' 
                : 'linear-gradient(0deg, #4444ff, #44aaff)'
            }}
          />
        </div>
        <div className="temp-value">
          {isHeating ? '🔥' : '❄️'} {temperature}°C
        </div>
      </div>
    </div>
  );
};

export default AlchemyFlask;
