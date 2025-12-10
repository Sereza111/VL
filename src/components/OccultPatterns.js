import React, { useEffect, useRef } from 'react';
import 'css-doodle';
import anime from 'animejs/lib/anime.js';
import './OccultPatterns.css';

// Цветовая палитра из требований
const COLOR_PALETTE = {
  darkPurple: '#3C2F4F',    // Тёмно-фиолетовый — основной фон
  beigeParchment: '#E8D3A9', // Бежево-пергаментный — текст, акценты
  darkTurquoise: '#1A3C34',  // Тёмный бирюзовый — светлячки, свечение
  inkyBlue: '#1B263B',       // Чернильный синий — тени, контуры
  moonBlue: '#A8C7FA',       // Голубоватый оттенок луны
};

// Шаблоны оккультных узоров
const OCCULT_PATTERNS = {
  pentagram: `
    :doodle {
      @grid: 1x1 / 100%;
      --rotate: @r(0, 360)deg;
    }
    
    background: @pick(${COLOR_PALETTE.beigeParchment}, ${COLOR_PALETTE.darkTurquoise}, ${COLOR_PALETTE.moonBlue});
    -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 5L61 40H97L68 62L79 97L50 75L21 97L32 62L3 40H39L50 5Z' fill='%23000'/%3E%3C/svg%3E") no-repeat center;
    mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 5L61 40H97L68 62L79 97L50 75L21 97L32 62L3 40H39L50 5Z' fill='%23000'/%3E%3C/svg%3E") no-repeat center;
    transform: rotate(var(--rotate));
    opacity: @r(.2, .5);
  `,
  
  moon: `
    :doodle {
      @grid: 1x1 / 100%;
      --phase: @r(0, 100);
      --rotate: @r(0, 360)deg;
    }
    
    background: ${COLOR_PALETTE.beigeParchment};
    -webkit-mask: @svg(
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="black" />
        <circle cx="calc(50% - var(--phase) * 0.5%)" cy="50" r="48" fill="white" />
      </svg>
    );
    mask: @svg(
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="black" />
        <circle cx="calc(50% - var(--phase) * 0.5%)" cy="50" r="48" fill="white" />
      </svg>
    );
    transform: rotate(var(--rotate));
    opacity: @r(.2, .5);
  `,
  
  rune: `
    :doodle {
      @grid: 1x1 / 100%;
      --rotate: @r(0, 360)deg;
      --rune: @pick(
        "M20,10 L80,10 L80,90 L20,90 Z M50,10 L50,90",
        "M20,10 L80,10 L50,90 Z M50,10 L50,50",
        "M20,50 L80,50 M20,10 L20,90 M80,10 L80,90",
        "M20,10 L80,90 M80,10 L20,90",
        "M50,10 L20,90 L80,90 Z",
        "M20,10 L80,10 M20,90 L80,90 M20,10 L20,90 M80,10 L80,90"
      );
    }
    
    background: @pick(${COLOR_PALETTE.beigeParchment}, ${COLOR_PALETTE.moonBlue});
    -webkit-mask: @svg(
      <svg viewBox="0 0 100 100">
        <path d="var(--rune)" stroke="black" stroke-width="8" fill="none" />
      </svg>
    );
    mask: @svg(
      <svg viewBox="0 0 100 100">
        <path d="var(--rune)" stroke="black" stroke-width="8" fill="none" />
      </svg>
    );
    transform: rotate(var(--rotate));
    opacity: @r(.2, .5);
  `,
  
  circle: `
    :doodle {
      @grid: 1x1 / 100%;
      --rotate: @r(0, 360)deg;
    }
    
    background: @pick(${COLOR_PALETTE.beigeParchment}, ${COLOR_PALETTE.darkTurquoise}, ${COLOR_PALETTE.moonBlue});
    -webkit-mask: @svg(
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" stroke="black" stroke-width="8" fill="none" />
        <circle cx="50" cy="50" r="20" stroke="black" stroke-width="4" fill="none" />
        <line x1="50" y1="10" x2="50" y2="90" stroke="black" stroke-width="2" />
        <line x1="10" y1="50" x2="90" y2="50" stroke="black" stroke-width="2" />
      </svg>
    );
    mask: @svg(
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" stroke="black" stroke-width="8" fill="none" />
        <circle cx="50" cy="50" r="20" stroke="black" stroke-width="4" fill="none" />
        <line x1="50" y1="10" x2="50" y2="90" stroke="black" stroke-width="2" />
        <line x1="10" y1="50" x2="90" y2="50" stroke="black" stroke-width="2" />
      </svg>
    );
    transform: rotate(var(--rotate));
    opacity: @r(.2, .5);
  `
};

const OccultPatterns = ({ patternCount = 20, position = 'bottom' }) => {
  const containerRef = useRef(null);
  const doodlesRef = useRef([]);
  
  // Функция для создания случайного узора
  const getRandomPattern = () => {
    const patterns = Object.values(OCCULT_PATTERNS);
    return patterns[Math.floor(Math.random() * patterns.length)];
  };
  
  // Функция для создания CSS-стилей для узора
  const getPatternStyle = (index) => {
    const size = 30 + Math.random() * 50; // Размер от 30px до 80px
    const posX = Math.random() * 100; // Позиция X от 0% до 100%
    
    // Позиция Y в зависимости от параметра position
    let posY;
    if (position === 'top') {
      posY = Math.random() * 30; // От 0% до 30% сверху
    } else if (position === 'bottom') {
      posY = 70 + Math.random() * 30; // От 70% до 100% снизу
    } else {
      posY = Math.random() * 100; // По всему экрану
    }
    
    return {
      position: 'absolute',
      left: `${posX}%`,
      top: `${posY}%`,
      width: `${size}px`,
      height: `${size}px`,
      zIndex: -1,
      opacity: 0.2 + Math.random() * 0.3, // Начальная прозрачность от 0.2 до 0.5
      transform: `rotate(${Math.random() * 360}deg)`,
      transition: 'all 20s ease-in-out'
    };
  };
  
  // Эффект для создания и анимации узоров
  useEffect(() => {
    // Создаем узоры
    const doodles = [];
    
    for (let i = 0; i < patternCount; i++) {
      const doodleEl = document.createElement('css-doodle');
      doodleEl.innerHTML = getRandomPattern();
      
      // Применяем стили
      const style = getPatternStyle(i);
      Object.assign(doodleEl.style, style);
      
      // Добавляем в контейнер
      containerRef.current.appendChild(doodleEl);
      doodles.push(doodleEl);
    }
    
    doodlesRef.current = doodles;
    
    // Запускаем анимацию
    animatePatterns();
    
    // Интервал для периодического обновления узоров
    const interval = setInterval(() => {
      animatePatterns();
    }, 20000);
    
    // Очистка при размонтировании
    return () => {
      clearInterval(interval);
      doodles.forEach(doodle => {
        if (doodle.parentNode) {
          doodle.parentNode.removeChild(doodle);
        }
      });
    };
  }, [patternCount, position]);
  
  // Функция для анимации узоров
  const animatePatterns = () => {
    const doodles = doodlesRef.current;
    
    doodles.forEach((doodle, index) => {
      // Обновляем узор с вероятностью 30%
      if (Math.random() < 0.3) {
        doodle.innerHTML = getRandomPattern();
      }
      
      // Анимируем с помощью anime.js
      anime({
        targets: doodle,
        opacity: [
          { value: 0.2 + Math.random() * 0.3, duration: 10000, easing: 'easeInOutSine' },
          { value: 0.2 + Math.random() * 0.3, duration: 10000, easing: 'easeInOutSine' }
        ],
        rotate: `${Math.random() * 360}deg`,
        translateX: `${(Math.random() - 0.5) * 20}px`,
        translateY: `${(Math.random() - 0.5) * 20}px`,
        scale: [
          { value: 0.8 + Math.random() * 0.4, duration: 10000, easing: 'easeInOutSine' },
          { value: 0.8 + Math.random() * 0.4, duration: 10000, easing: 'easeInOutSine' }
        ],
        duration: 20000,
        easing: 'easeInOutSine',
        delay: index * 100
      });
    });
  };
  
  return (
    <div 
      ref={containerRef} 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        zIndex: -1, 
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
    />
  );
};

export default OccultPatterns; 