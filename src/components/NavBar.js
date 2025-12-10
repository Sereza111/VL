// src/components/NavBar.js
import React, { useState, useEffect, useRef } from 'react';
import anime from 'animejs/lib/anime.js';

// Цветовая палитра из требований
const COLOR_PALETTE = {
  darkPurple: '#3C2F4F',    // Тёмно-фиолетовый — основной фон
  beigeParchment: '#E8D3A9', // Бежево-пергаментный — текст, акценты
  darkTurquoise: '#1A3C34',  // Тёмный бирюзовый — светлячки, свечение
  inkyBlue: '#1B263B',       // Чернильный синий — тени, контуры
  moonBlue: '#A8C7FA',       // Голубоватый оттенок луны
};

const NavBar = React.memo(({ currentScreen, setScreen }) => {
  const [hoveredButton, setHoveredButton] = useState(null);
  const buttonsRef = useRef({});
  const particlesRef = useRef({});
  const glowRef = useRef({});
  
  const buttons = [
    { 
      id: 'home', 
      symbol: '✧', 
      hoverSymbol: '✦', 
      label: 'Дневник',
      description: 'Ваш магический дневник',
      color: COLOR_PALETTE.moonBlue
    },
    { 
      id: 'earn', 
      symbol: '⚝', 
      hoverSymbol: '⚜', 
      label: 'Задания',
      description: 'Выполняйте задания для получения энергии',
      color: COLOR_PALETTE.beigeParchment
    },
    { 
      id: 'farm', 
      symbol: '☽', 
      hoverSymbol: '☾', 
      label: 'Сбор энергии',
      description: 'Собирайте мистическую энергию в разных зонах',
      color: COLOR_PALETTE.darkTurquoise
    },
    { 
      id: 'shop', 
      symbol: '♱', 
      hoverSymbol: '♰', 
      label: 'Магазин',
      description: 'Магические предметы и артефакты',
      color: COLOR_PALETTE.beigeParchment
    },
    { 
      id: 'artifacts', 
      symbol: '♦', 
      hoverSymbol: '♢', 
      label: 'Артефакты',
      description: 'Ваша коллекция мистических артефактов',
      color: COLOR_PALETTE.moonBlue
    },
    { 
      id: 'friends', 
      symbol: '⚹', 
      hoverSymbol: '⚸', 
      label: 'Знакомства',
      description: 'Ваш круг посвященных',
      color: COLOR_PALETTE.darkTurquoise
    },
    { 
      id: 'profile', 
      symbol: '⍟', 
      hoverSymbol: '⍣', 
      label: 'Профиль',
      description: 'Ваш магический путь',
      color: COLOR_PALETTE.beigeParchment
    }
  ];

  // Эффект для анимации символов при активном экране
  useEffect(() => {
    // Анимируем активную кнопку
    if (currentScreen && buttonsRef.current[currentScreen]) {
      const buttonEl = buttonsRef.current[currentScreen];
      const glowEl = glowRef.current[currentScreen];
      
      // Анимация пульсации для активного символа
      anime({
        targets: buttonEl.querySelector('.nav-symbol'),
        scale: [1, 1.2, 1],
        opacity: [0.8, 1, 0.8],
        duration: 3000,
        easing: 'easeInOutSine',
        loop: true
      });
      
      // Анимация свечения
      if (glowEl) {
        anime({
          targets: glowEl,
          opacity: [0.3, 0.7, 0.3],
          scale: [1, 1.1, 1],
          duration: 2000,
          easing: 'easeInOutQuad',
          loop: true
        });
      }
      
      // Создаем частицы для активной кнопки
      createParticles(currentScreen);
    }
    
    // Очистка анимаций при изменении активного экрана
    return () => {
      anime.remove('.nav-symbol');
      anime.remove('.nav-glow');
      
      // Удаляем все частицы
      Object.values(particlesRef.current).forEach(container => {
        if (container && container.parentNode) {
          container.innerHTML = '';
        }
      });
    };
  }, [currentScreen]);
  
  // Функция для создания частиц
  const createParticles = (buttonId) => {
    const container = particlesRef.current[buttonId];
    if (!container) return;
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Находим кнопку и её цвет
    const button = buttons.find(btn => btn.id === buttonId);
    const color = button ? button.color : COLOR_PALETTE.beigeParchment;
    
    // Создаем частицы
    for (let i = 0; i < 10; i++) {
      const particle = document.createElement('div');
      
      // Стили для частицы
      Object.assign(particle.style, {
        position: 'absolute',
        width: `${2 + Math.random() * 4}px`,
        height: `${2 + Math.random() * 4}px`,
        backgroundColor: color,
        borderRadius: '50%',
        opacity: 0,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none'
      });
      
      // Добавляем частицу в контейнер
      container.appendChild(particle);
      
      // Анимируем частицу
      anime({
        targets: particle,
        opacity: [0, 0.8, 0],
        translateX: () => [0, (Math.random() - 0.5) * 50],
        translateY: () => [0, (Math.random() - 0.5) * 50],
        scale: [0.5, 0, 0],
        easing: 'easeOutExpo',
        duration: 1000 + Math.random() * 2000,
        delay: Math.random() * 1000,
        complete: () => {
          // Удаляем частицу после завершения анимации
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
          }
          
          // Создаем новую частицу, если кнопка все еще активна
          if (currentScreen === buttonId) {
            setTimeout(() => {
              if (container.parentNode) {
                createParticle(container, color);
              }
            }, Math.random() * 1000);
          }
        }
      });
    }
  };
  
  // Функция для создания одной частицы
  const createParticle = (container, color) => {
    const particle = document.createElement('div');
    
    // Стили для частицы
    Object.assign(particle.style, {
      position: 'absolute',
      width: `${2 + Math.random() * 4}px`,
      height: `${2 + Math.random() * 4}px`,
      backgroundColor: color,
      borderRadius: '50%',
      opacity: 0,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none'
    });
    
    // Добавляем частицу в контейнер
    container.appendChild(particle);
    
    // Анимируем частицу
    anime({
      targets: particle,
      opacity: [0, 0.8, 0],
      translateX: () => [0, (Math.random() - 0.5) * 50],
      translateY: () => [0, (Math.random() - 0.5) * 50],
      scale: [0.5, 0, 0],
      easing: 'easeOutExpo',
      duration: 1000 + Math.random() * 2000,
      complete: () => {
        // Удаляем частицу после завершения анимации
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }
    });
  };
  
  // Обработчик клика по кнопке
  const handleButtonClick = (buttonId) => {
    // Анимация нажатия
    if (buttonsRef.current[buttonId]) {
      anime({
        targets: buttonsRef.current[buttonId],
        scale: [1, 0.9, 1],
        duration: 300,
        easing: 'easeInOutQuad'
      });
    }
    
    // Вызываем функцию изменения экрана
    setScreen(buttonId);
  };
  
  // Обработчик наведения на кнопку
  const handleButtonHover = (buttonId) => {
    setHoveredButton(buttonId);
    
    // Анимация при наведении
    if (buttonsRef.current[buttonId] && buttonId !== currentScreen) {
      anime({
        targets: buttonsRef.current[buttonId].querySelector('.nav-symbol'),
        scale: [1, 1.2],
        duration: 300,
        easing: 'easeOutQuad'
      });
    }
  };
  
  // Обработчик ухода с кнопки
  const handleButtonLeave = (buttonId) => {
    setHoveredButton(null);
    
    // Анимация при уходе
    if (buttonsRef.current[buttonId] && buttonId !== currentScreen) {
      anime({
        targets: buttonsRef.current[buttonId].querySelector('.nav-symbol'),
        scale: [1.2, 1],
        duration: 300,
        easing: 'easeOutQuad'
      });
    }
  };

  const buttonOrder = buttons.map(b => b.id);

  const handleKeyDown = (e, currentId) => {
    const idx = buttonOrder.indexOf(currentId);
    if (e.key === 'ArrowRight') {
      const nextId = buttonOrder[(idx + 1) % buttonOrder.length];
      setScreen(nextId);
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      const prevId = buttonOrder[(idx - 1 + buttonOrder.length) % buttonOrder.length];
      setScreen(prevId);
      e.preventDefault();
    } else if (e.key === 'Enter' || e.key === ' ') {
      setScreen(currentId);
      e.preventDefault();
    }
  };

  return (
    <div className="nav-bar" role="navigation" aria-label="Основная навигация">
      {buttons.map(btn => {
        const isActive = currentScreen === btn.id;
        const isHovered = hoveredButton === btn.id;
        
        return (
          <button
            key={btn.id}
            ref={el => buttonsRef.current[btn.id] = el}
            className={`nav-btn ${isActive ? 'active' : ''}`}
            onClick={() => handleButtonClick(btn.id)}
            onMouseEnter={() => handleButtonHover(btn.id)}
            onMouseLeave={() => handleButtonLeave(btn.id)}
            onKeyDown={(e) => handleKeyDown(e, btn.id)}
            aria-label={btn.label}
            aria-current={isActive ? 'page' : undefined}
            tabIndex={0}
          >
            <div className="mystic-nav-icon">
              <div className="nav-symbol" style={{ color: btn.color }}>
                {isActive || isHovered ? btn.hoverSymbol : btn.symbol}
              </div>
              
              {/* Свечение для активной кнопки */}
              {isActive && (
                <div 
                  className="nav-glow"
                  ref={el => glowRef.current[btn.id] = el}
                  style={{ 
                    backgroundColor: btn.color + '33',
                    boxShadow: `0 0 15px ${btn.color}66`
                  }}
                ></div>
              )}
              
              {/* Контейнер для частиц */}
              <div 
                className="nav-particles"
                ref={el => particlesRef.current[btn.id] = el}
                style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none'
                }}
              ></div>
            </div>
            
            <span 
              className="btn-label"
              style={{ 
                color: isActive ? btn.color : 'inherit',
                textShadow: isActive ? `0 0 5px ${btn.color}66` : 'none'
              }}
            >
              {btn.label}
            </span>
            
            {/* Всплывающее описание при наведении */}
            {isHovered && !isActive && (
              <div 
                className="nav-tooltip"
                style={{ 
                  backgroundColor: COLOR_PALETTE.darkPurple + 'ee',
                  border: `1px solid ${btn.color}66`,
                  color: btn.color,
                  boxShadow: `0 0 10px ${btn.color}33`
                }}
              >
                {btn.description}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
});

export default NavBar;