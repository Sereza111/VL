// src/screens/ArtifactsScreen.js - Мистическая версия
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { FaGem, FaSearch, FaSort, FaStar, FaInfoCircle, FaMagic } from 'react-icons/fa';
import anime from 'animejs/lib/anime.js';
import './ArtifactsScreen.css';

// Цветовая палитра из требований
const COLOR_PALETTE = {
  darkPurple: '#3C2F4F',    // Тёмно-фиолетовый — основной фон
  beigeParchment: '#E8D3A9', // Бежево-пергаментный — текст, акценты
  darkTurquoise: '#1A3C34',  // Тёмный бирюзовый — светлячки, свечение
  inkyBlue: '#1B263B',       // Чернильный синий — тени, контуры
  moonBlue: '#A8C7FA',       // Голубоватый оттенок луны
};

const ArtifactsScreen = ({ items = [], balance = 0, onUseArtifact }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('rarity'); // 'rarity', 'name', 'effect'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [filteredItems, setFilteredItems] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  
  // Refs
  const containerRef = useRef(null);
  const particlesRef = useRef([]);
  const artifactsRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  
  // Демонстрационные артефакты, если не переданы
  const demoArtifacts = useMemo(() => [
    {
      id: 'arcanum_sigil',
      name: 'Печать Арканума',
      description: 'Древний символ силы, увеличивающий удачу на 10%',
      effect: 'Увеличивает шанс критического успеха',
      rarity: 'rare',
      icon: '☥',
      quantity: 1,
      type: 'amulet'
    },
    {
      id: 'shadow_essence',
      name: 'Эссенция Теней',
      description: 'Концентрированная тень из Бездны, дарующая временную невидимость',
      effect: 'Скрывает вашу ауру от других магов',
      rarity: 'epic',
      icon: '☾',
      quantity: 2,
      type: 'potion'
    },
    {
      id: 'luminous_crystal',
      name: 'Светящийся Кристалл',
      description: 'Кристалл, содержащий застывший лунный свет',
      effect: 'Раскрывает скрытые пути и тайные знания',
      rarity: 'legendary',
      icon: '✧',
      quantity: 1,
      type: 'crystal'
    },
    {
      id: 'astral_quill',
      name: 'Астральное Перо',
      description: 'Перо из крыла мифического существа с астрального плана',
      effect: 'Позволяет записывать заклинания с повышенной силой',
      rarity: 'epic',
      icon: '⚜',
      quantity: 1,
      type: 'tool'
    },
    {
      id: 'ethereal_hourglass',
      name: 'Эфирные Песочные Часы',
      description: 'Часы, содержащие песок из Эфирного Царства',
      effect: 'Замедляет время вокруг владельца',
      rarity: 'legendary',
      icon: '⌛',
      quantity: 1,
      type: 'artifact'
    },
    {
      id: 'grimoire_obscura',
      name: 'Гримуар Обскура',
      description: 'Древняя книга, содержащая забытые заклинания',
      effect: 'Открывает доступ к тайным знаниям',
      rarity: 'epic',
      icon: '📖',
      quantity: 1,
      type: 'book'
    },
    {
      id: 'alchemical_stone',
      name: 'Алхимический Камень',
      description: 'Камень, созданный древними алхимиками',
      effect: 'Усиливает эффекты зелий и эликсиров',
      rarity: 'rare',
      icon: '💎',
      quantity: 3,
      type: 'catalyst'
    },
    {
      id: 'mystic_rune',
      name: 'Мистическая Руна',
      description: 'Руна с древними символами силы',
      effect: 'Защищает от негативных энергий',
      rarity: 'uncommon',
      icon: 'ᚦ',
      quantity: 5,
      type: 'rune'
    }
  ], []);
  
  // Используем переданные артефакты или демо-артефакты
  const artifactsList = useMemo(() => 
    items.length > 0 ? items : demoArtifacts
  , [items, demoArtifacts]);
  
  // Функция для получения цвета редкости
  const getRarityColor = useCallback((rarity) => {
    switch (rarity) {
      case 'legendary': return '#f39c12';
      case 'epic': return '#9b59b6';
      case 'rare': return '#4a90e2';
      case 'uncommon': return '#2ecc71';
      default: return '#95a5a6';
    }
  }, []);
  
  // Функция для получения текста редкости на русском
  const getRarityText = useCallback((rarity) => {
    switch (rarity) {
      case 'legendary': return 'Легендарный';
      case 'epic': return 'Эпический';
      case 'rare': return 'Редкий';
      case 'uncommon': return 'Необычный';
      default: return 'Обычный';
    }
  }, []);
  
  // Функция для получения текста типа артефакта на русском
  const getTypeText = useCallback((type) => {
    switch (type) {
      case 'amulet': return 'Амулет';
      case 'potion': return 'Зелье';
      case 'crystal': return 'Кристалл';
      case 'tool': return 'Инструмент';
      case 'artifact': return 'Артефакт';
      case 'book': return 'Книга';
      case 'catalyst': return 'Катализатор';
      case 'rune': return 'Руна';
      default: return 'Предмет';
    }
  }, []);
  
  // Эффект для создания мистических частиц - оптимизирован
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Создаем частицы
    const createParticles = () => {
      const container = containerRef.current;
      if (!container) return;
      
      const particles = [];
      
      // Удаляем старые частицы
      particlesRef.current.forEach(particle => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      });
      
      // Создаем новые частицы - уменьшаем количество
      for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'mystical-particle';
        
        // Случайный размер и позиция
        const size = 2 + Math.random() * 4;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const delay = Math.random() * 5;
        const duration = 15 + Math.random() * 15;
        const color = Math.random() > 0.5 ? COLOR_PALETTE.beigeParchment : COLOR_PALETTE.moonBlue;
        
        // Стили частицы
        Object.assign(particle.style, {
          position: 'absolute',
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          backgroundColor: color,
          opacity: 0,
          top: `${posY}%`,
          left: `${posX}%`,
          boxShadow: `0 0 ${size * 2}px ${color}`,
          zIndex: -1,
          pointerEvents: 'none'
        });
        
        // Добавляем частицу в контейнер
        container.appendChild(particle);
        particles.push(particle);
        
        // Анимируем частицу с оптимизированными настройками
        anime({
          targets: particle,
          opacity: [0, 0.3, 0],
          translateY: [0, -100],
          translateX: () => [0, (Math.random() - 0.5) * 50],
          scale: [1, 0.5, 0],
          easing: 'easeInOutQuad',
          duration: duration * 1000,
          delay: delay * 1000,
          loop: true
        });
      }
      
      particlesRef.current = particles;
    };
    
    createParticles();
    
    // Очистка при размонтировании
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      
      particlesRef.current.forEach(particle => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      });
    };
  }, []);
  
  // Мемоизированная функция фильтрации и сортировки
  const filterAndSortItems = useCallback(() => {
    let filtered = [...artifactsList];
    
    // Фильтрация по поисковому запросу
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) || 
        item.description.toLowerCase().includes(query) ||
        (item.effect && item.effect.toLowerCase().includes(query))
      );
    }
    
    // Сортировка
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'rarity') {
        const rarityOrder = { legendary: 4, epic: 3, rare: 2, uncommon: 1, common: 0 };
        comparison = (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
      } else if (sortBy === 'type') {
        comparison = (a.type || '').localeCompare(b.type || '');
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [artifactsList, searchQuery, sortBy, sortOrder]);
  
  // Эффект для фильтрации и сортировки артефактов
  useEffect(() => {
    const filtered = filterAndSortItems();
    setFilteredItems(filtered);
    
    // Анимация появления артефактов - ограничиваем с помощью throttling
    if (artifactsRef.current) {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      
      animationFrameIdRef.current = requestAnimationFrame(() => {
        anime({
          targets: '.artifact-item',
          opacity: [0, 1],
          translateY: [10, 0],
          delay: anime.stagger(30),
          easing: 'easeOutQuad',
          duration: 400
        });
      });
    }
  }, [filterAndSortItems]);
  
  // Функция для создания эффекта свечения при наведении
  const handleMouseEnter = useCallback((e) => {
    anime({
      targets: e.currentTarget,
      boxShadow: [
        '0 0 5px rgba(232, 211, 169, 0.3)',
        '0 0 15px rgba(232, 211, 169, 0.5)'
      ],
      scale: 1.03,
      easing: 'easeOutQuad',
      duration: 300
    });
  }, []);
  
  // Функция для удаления эффекта свечения при уходе мыши
  const handleMouseLeave = useCallback((e) => {
    anime({
      targets: e.currentTarget,
      boxShadow: '0 0 5px rgba(232, 211, 169, 0.3)',
      scale: 1,
      easing: 'easeOutQuad',
      duration: 300
    });
  }, []);
  
  // Функция для отображения деталей артефакта
  const showArtifactDetails = useCallback((artifact) => {
    setSelectedArtifact(artifact);
    setShowDetails(true);
    
    // Анимация появления деталей
    setTimeout(() => {
      anime({
        targets: '.artifact-details',
        opacity: [0, 1],
        translateY: [20, 0],
        easing: 'easeOutQuad',
        duration: 300
      });
    }, 10);
  }, []);
  
  // Функция для закрытия деталей артефакта
  const closeArtifactDetails = useCallback(() => {
    // Анимация исчезновения деталей
    anime({
      targets: '.artifact-details',
      opacity: [1, 0],
      translateY: [0, 20],
      easing: 'easeOutQuad',
      duration: 300,
      complete: () => {
        setShowDetails(false);
        setSelectedArtifact(null);
      }
    });
  }, []);
  
  // Функция для использования артефакта
  const handleUseArtifact = useCallback((artifact) => {
    if (onUseArtifact) {
      onUseArtifact(artifact);
    }
    
    // Анимация использования артефакта + луч к балансу
    anime({
      targets: '.artifact-icon',
      rotate: [0, 360],
      scale: [1, 1.2, 1],
      opacity: [1, 0.8, 1],
      easing: 'easeInOutQuad',
      duration: 700
    });
    try {
      const layer = document.getElementById('energy-orb-layer');
      if (layer) {
        const el = document.createElement('div');
        Object.assign(el.style, {
          position: 'fixed', width: '12px', height: '12px', borderRadius: '50%',
          background: 'radial-gradient(circle, #F6E27A, #A8C7FA)', boxShadow: '0 0 18px rgba(246,226,122,0.8)'
        });
        const center = window.innerWidth/2;
        const startY = window.innerHeight/2;
        Object.assign(el.style, { left: center+'px', top: startY+'px' });
        layer.appendChild(el);
        const target = document.querySelector('.app-header');
        const rect = target ? target.getBoundingClientRect() : { left: window.innerWidth/2, top: 40, width: 100, height: 40 };
        const tx = rect.left + rect.width/2;
        const ty = rect.top + rect.height/2;
        anime({ targets: el, translateX: tx - center, translateY: ty - startY, scale: [1, 0.7], duration: 650, easing: 'easeOutQuad', complete: () => el.remove() });
      }
    } catch(_) {}
    
    // Закрываем детали после использования
    closeArtifactDetails();
  }, [onUseArtifact, closeArtifactDetails]);
  
  // Функция для переключения порядка сортировки
  const toggleSortOrder = useCallback(() => {
    setSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc');
  }, []);
  
  // Функция для изменения поля сортировки
  const changeSortBy = useCallback((field) => {
    setSortBy(prevSort => {
      if (prevSort === field) {
        toggleSortOrder();
        return prevSort;
      } else {
        setSortOrder('desc');
        return field;
      }
    });
  }, [toggleSortOrder]);
  
  return (
    <div className="artifacts-screen" ref={containerRef}>
      {/* Мистический фон с частицами */}
      <div className="mystical-overlay"></div>
      
      {/* Заголовок экрана */}
      <div className="artifacts-header">
        <h2><FaGem /> Мистические Артефакты</h2>
      </div>
      
      {/* Панель поиска и сортировки */}
      <div className="artifacts-controls">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Поиск артефактов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="sort-container">
          <div className="sort-label">
            <FaSort /> Сортировать:
          </div>
          <div className="sort-options">
            <button 
              className={`sort-button ${sortBy === 'rarity' ? 'active' : ''}`}
              onClick={() => changeSortBy('rarity')}
            >
              По редкости {sortBy === 'rarity' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button 
              className={`sort-button ${sortBy === 'name' ? 'active' : ''}`}
              onClick={() => changeSortBy('name')}
            >
              По имени {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button 
              className={`sort-button ${sortBy === 'type' ? 'active' : ''}`}
              onClick={() => changeSortBy('type')}
            >
              По типу {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
      </div>
      
      {/* Список артефактов */}
      <div className="artifacts-list" ref={artifactsRef}>
        {filteredItems.length === 0 ? (
          <div className="no-artifacts">
            <FaInfoCircle />
            <p>У вас пока нет артефактов, соответствующих поиску</p>
            <p>Исследуйте мистический мир, чтобы найти редкие артефакты!</p>
          </div>
        ) : (
          filteredItems.map(artifact => (
            <div 
              key={artifact.id} 
              className="artifact-item"
              onClick={() => showArtifactDetails(artifact)}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div 
                className="artifact-icon" 
                style={{ 
                  backgroundColor: getRarityColor(artifact.rarity),
                  boxShadow: `0 0 10px ${getRarityColor(artifact.rarity)}` 
                }}
              >
                {artifact.icon || '✧'}
              </div>
              <div className="artifact-info">
                <h3>{artifact.name}</h3>
                <div className="artifact-type">
                  {getTypeText(artifact.type)}
                </div>
                <div 
                  className="artifact-rarity" 
                  style={{ color: getRarityColor(artifact.rarity) }}
                >
                  {getRarityText(artifact.rarity)}
                </div>
                {artifact.quantity > 1 && (
                  <div className="artifact-quantity">×{artifact.quantity}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Детали артефакта */}
      {showDetails && selectedArtifact && (
        <div className="artifact-details-overlay" onClick={closeArtifactDetails}>
          <div className="artifact-details" onClick={e => e.stopPropagation()}>
            <div className="artifact-details-header">
              <div 
                className="artifact-details-icon" 
                style={{ 
                  backgroundColor: getRarityColor(selectedArtifact.rarity),
                  boxShadow: `0 0 15px ${getRarityColor(selectedArtifact.rarity)}` 
                }}
              >
                {selectedArtifact.icon || '✧'}
              </div>
              <h3>{selectedArtifact.name}</h3>
              <button className="close-details-btn" onClick={closeArtifactDetails}>✕</button>
            </div>
            
            <div className="artifact-details-content">
              <div className="artifact-details-info">
                <div className="artifact-details-row">
                  <span className="detail-label">Тип:</span>
                  <span className="detail-value">{getTypeText(selectedArtifact.type)}</span>
                </div>
                <div className="artifact-details-row">
                  <span className="detail-label">Редкость:</span>
                  <span 
                    className="detail-value" 
                    style={{ color: getRarityColor(selectedArtifact.rarity) }}
                  >
                    {getRarityText(selectedArtifact.rarity)}
                  </span>
                </div>
                <div className="artifact-details-row">
                  <span className="detail-label">Количество:</span>
                  <span className="detail-value">{selectedArtifact.quantity || 1}</span>
                </div>
              </div>
              
              <div className="artifact-details-description">
                <h4>Описание:</h4>
                <p>{selectedArtifact.description}</p>
              </div>
              
              {selectedArtifact.effect && (
                <div className="artifact-details-effect">
                  <h4>Эффект:</h4>
                  <p>{selectedArtifact.effect}</p>
                </div>
              )}
              
              <div className="artifact-details-actions">
                <button 
                  className="use-artifact-btn"
                  onClick={() => handleUseArtifact(selectedArtifact)}
                >
                  <FaMagic /> Использовать
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(ArtifactsScreen); 