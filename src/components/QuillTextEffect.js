import React, { useEffect, useRef, useState } from 'react';
import anime from 'animejs/lib/anime.js';

// Цветовая палитра из требований
const COLOR_PALETTE = {
  darkPurple: '#3C2F4F',    // Тёмно-фиолетовый — основной фон
  beigeParchment: '#E8D3A9', // Бежево-пергаментный — текст, акценты
  darkTurquoise: '#1A3C34',  // Тёмный бирюзовый — светлячки, свечение
  inkyBlue: '#1B263B',       // Чернильный синий — тени, контуры
  moonBlue: '#A8C7FA',       // Голубоватый оттенок луны
};

// Стили для компонента
const styles = {
  container: {
    position: 'relative',
    fontFamily: '"Caveat", cursive',
    color: COLOR_PALETTE.beigeParchment,
    lineHeight: '1.6',
    textAlign: 'left',
    padding: '10px',
    overflow: 'hidden',
  },
  character: {
    display: 'inline-block',
    opacity: 0,
    transform: 'translateY(10px)',
  },
  cursor: {
    display: 'inline-block',
    width: '2px',
    height: '1.2em',
    backgroundColor: COLOR_PALETTE.beigeParchment,
    marginLeft: '2px',
    verticalAlign: 'middle',
    animation: 'blink 1s infinite',
  },
  inkBlot: {
    position: 'absolute',
    borderRadius: '50%',
    backgroundColor: `${COLOR_PALETTE.beigeParchment}33`,
    transform: 'scale(0)',
    zIndex: -1,
  }
};

// CSS для анимации курсора
const cursorKeyframes = `
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
`;

const QuillTextEffect = ({ 
  text, 
  fontSize = '1.2rem',
  speed = 30, // мс на символ
  autoStart = true,
  onComplete = () => {},
  style = {}
}) => {
  const containerRef = useRef(null);
  const charactersRef = useRef([]);
  const cursorRef = useRef(null);
  const animationRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [displayText, setDisplayText] = useState('');
  
  // Создаем стили для символов
  useEffect(() => {
    // Добавляем стили для анимации курсора
    const styleElement = document.createElement('style');
    styleElement.innerHTML = cursorKeyframes;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  // Подготавливаем текст для анимации
  useEffect(() => {
    if (!text) return;
    
    // Разбиваем текст на символы и создаем элементы для каждого
    setDisplayText(text);
    setIsComplete(false);
    
    // Если автозапуск, начинаем анимацию
    if (autoStart) {
      setTimeout(() => {
        startAnimation();
      }, 100);
    }
    
    return () => {
      if (animationRef.current) {
        animationRef.current.pause();
      }
    };
  }, [text, autoStart]);
  
  // Функция для создания чернильного пятна
  const createInkBlot = (x, y) => {
    const inkBlot = document.createElement('div');
    Object.assign(inkBlot.style, styles.inkBlot);
    
    // Случайный размер пятна
    const size = 5 + Math.random() * 15;
    inkBlot.style.width = `${size}px`;
    inkBlot.style.height = `${size}px`;
    
    // Позиционируем пятно
    inkBlot.style.left = `${x}px`;
    inkBlot.style.top = `${y}px`;
    
    // Добавляем в контейнер
    containerRef.current.appendChild(inkBlot);
    
    // Анимируем появление и исчезновение
    anime({
      targets: inkBlot,
      scale: [0, 1],
      opacity: [0.8, 0],
      duration: 2000,
      easing: 'easeOutExpo',
      complete: () => {
        if (inkBlot.parentNode) {
          inkBlot.parentNode.removeChild(inkBlot);
        }
      }
    });
  };
  
  // Функция для запуска анимации
  const startAnimation = () => {
    if (isAnimating || isComplete) return;
    setIsAnimating(true);
    
    // Получаем все символы
    const characters = Array.from(containerRef.current.querySelectorAll('.quill-character'));
    charactersRef.current = characters;
    
    // Анимируем каждый символ
    animationRef.current = anime({
      targets: characters,
      opacity: [0, 1],
      translateY: [10, 0],
      translateX: (el, i) => [anime.random(-5, 5), 0],
      rotate: (el, i) => [anime.random(-5, 5), 0],
      delay: anime.stagger(speed),
      easing: 'easeOutQuad',
      begin: () => {
        // Показываем курсор в начале анимации
        if (cursorRef.current) {
          cursorRef.current.style.display = 'inline-block';
        }
      },
      update: (anim) => {
        // Обновляем позицию курсора
        if (cursorRef.current && characters.length > 0) {
          const progress = anim.progress / 100;
          const charIndex = Math.min(
            Math.floor(progress * characters.length),
            characters.length - 1
          );
          
          if (characters[charIndex]) {
            const char = characters[charIndex];
            const rect = char.getBoundingClientRect();
            const containerRect = containerRef.current.getBoundingClientRect();
            
            // Создаем чернильное пятно с небольшой вероятностью
            if (Math.random() < 0.1) {
              const x = rect.left - containerRect.left + rect.width / 2;
              const y = rect.top - containerRect.top + rect.height;
              createInkBlot(x, y);
            }
            
            // Добавляем небольшое дрожание для эффекта рукописного текста
            anime({
              targets: char,
              translateX: anime.random(-1, 1),
              translateY: anime.random(-1, 1),
              rotate: anime.random(-1, 1),
              duration: 100,
              easing: 'easeInOutSine',
              complete: () => {
                anime({
                  targets: char,
                  translateX: 0,
                  translateY: 0,
                  rotate: 0,
                  duration: 100,
                  easing: 'easeInOutSine'
                });
              }
            });
          }
        }
      },
      complete: () => {
        setIsAnimating(false);
        setIsComplete(true);
        
        // Скрываем курсор после завершения
        setTimeout(() => {
          if (cursorRef.current) {
            cursorRef.current.style.display = 'none';
          }
          onComplete();
        }, 500);
      }
    });
  };
  
  // Функция для остановки анимации
  const stopAnimation = () => {
    if (animationRef.current) {
      animationRef.current.pause();
      setIsAnimating(false);
    }
  };
  
  // Функция для сброса анимации
  const resetAnimation = () => {
    stopAnimation();
    setIsComplete(false);
    
    // Сбрасываем стили символов
    charactersRef.current.forEach(char => {
      char.style.opacity = '0';
      char.style.transform = 'translateY(10px)';
    });
  };
  
  return (
    <div 
      ref={containerRef} 
      style={{...styles.container, fontSize, ...style}}
      onClick={() => {
        if (!isAnimating && !isComplete) {
          startAnimation();
        }
      }}
    >
      {displayText.split('').map((char, index) => (
        <span 
          key={index} 
          className="quill-character"
          style={styles.character}
        >
          {char}
        </span>
      ))}
      <span 
        ref={cursorRef} 
        className="quill-cursor"
        style={styles.cursor}
      />
    </div>
  );
};

export default QuillTextEffect; 