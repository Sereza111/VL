// src/screens/FarmScreen.js - Мистическая версия
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaLeaf, FaMoon, FaStar, FaInfoCircle, FaHistory } from 'react-icons/fa';
import anime from 'animejs/lib/anime.js';
import BalanceButton from '../components/BalanceButton';
import './FarmScreen.css';
import config from '../config';
import PortalReveal from '../components/PortalReveal';
import AdvancedPortalManager from '../components/AdvancedPortalManager';
import AlchemyLab from './mini/AlchemyLab';
import CrystalMine from './mini/CrystalMine';
import GenerativeIcon from '../components/GenerativeIcon';
import RuneProgress from '../components/RuneProgress';

// Цветовая палитра из требований
const COLOR_PALETTE = {
  darkPurple: '#3C2F4F',    // Тёмно-фиолетовый — основной фон
  beigeParchment: '#E8D3A9', // Бежево-пергаментный — текст, акценты
  darkTurquoise: '#1A3C34',  // Тёмный бирюзовый — светлячки, свечение
  inkyBlue: '#1B263B',       // Чернильный синий — тени, контуры
  moonBlue: '#A8C7FA',       // Голубоватый оттенок луны
};

const FarmScreen = ({ balance, updateBalance }) => {
  // Состояния
  const [farmStats, setFarmStats] = useState({
    totalClicks: 0,
    maxCombo: 0,
    todayEarned: 0,
    lastDate: new Date().toDateString()
  });
  const [comboCount, setComboCount] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [energyHistory, setEnergyHistory] = useState([]);
  const [activeZone, setActiveZone] = useState('crystal'); // 'crystal', 'moon', 'forest'
  const [zoneStats, setZoneStats] = useState({
    crystal: { level: 1, totalEnergy: 0, multiplier: 1 },
    moon: { level: 1, totalEnergy: 0, multiplier: 1.5, unlocked: false },
    forest: { level: 1, totalEnergy: 0, multiplier: 2, unlocked: false }
  });
  const [energyParticles, setEnergyParticles] = useState([]);
  const [portalCharge, setPortalCharge] = useState(0); // 0..1 прогресс открытия портала
  const [portalOpen, setPortalOpen] = useState(false);
  const [showPortalUI, setShowPortalUI] = useState(false);
  const [showPotionLab, setShowPotionLab] = useState(false);
  const [showCrystalMine, setShowCrystalMine] = useState(false);
  const [potions, setPotions] = useState([]);
  const [crystalAttempts, setCrystalAttempts] = useState(3);
  const [enableCinematicPortals] = useState(true); // Всегда включен
  const [artifacts, setArtifacts] = useState([]);
  const [showAdvancedPortal, setShowAdvancedPortal] = useState(false);
  const [portalClickPosition, setPortalClickPosition] = useState(null);
  
  // Refs
  const containerRef = useRef(null);
  const particlesRef = useRef([]);
  const comboTimerRef = useRef(null);
  const clickAreaRef = useRef(null);
  const decayTimerRef = useRef(null);
  
  // Загрузка данных при монтировании
  useEffect(() => {
    // Загружаем статистику фермы
    const savedStats = JSON.parse(localStorage.getItem('farmStats')) || {
      totalClicks: 0,
      maxCombo: 0,
      todayEarned: 0,
      lastDate: new Date().toDateString()
    };
    
    // Сбрасываем дневной заработок, если это новый день
    const today = new Date().toDateString();
    if (savedStats.lastDate !== today) {
      savedStats.todayEarned = 0;
      savedStats.lastDate = today;
    }
    
    setFarmStats(savedStats);
    
    // Загружаем статистику зон
    const savedZoneStats = JSON.parse(localStorage.getItem('zoneStats')) || {
      crystal: { level: 1, totalEnergy: 0, multiplier: 1 },
      moon: { level: 1, totalEnergy: 0, multiplier: 1.5, unlocked: false },
      forest: { level: 1, totalEnergy: 0, multiplier: 2, unlocked: false }
    };
    
    setZoneStats(savedZoneStats);
    
    // Загружаем историю сбора энергии
    const savedHistory = JSON.parse(localStorage.getItem('energyHistory')) || [];
    setEnergyHistory(savedHistory);
    
    // Загружаем зелья
    const savedPotions = JSON.parse(localStorage.getItem('potions')) || [];
    setPotions(savedPotions);
    
    // Загружаем артефакты
    const savedArtifacts = JSON.parse(localStorage.getItem('artifacts')) || [];
    setArtifacts(savedArtifacts);
    
    // Создаем фоновые частицы
    createBackgroundParticles();

    // Запускаем плавный спад зарядки портала
    if (!decayTimerRef.current) {
      decayTimerRef.current = setInterval(() => {
        setPortalCharge(prev => {
          if (portalOpen || showPortalUI || showPotionLab || showCrystalMine) return prev;
          const next = Math.max(0, prev - 0.002); // Медленнее спадает
          return next;
        });
      }, 200); // Реже проверяем
    }
    
    // Очистка при размонтировании
    return () => {
      if (comboTimerRef.current) {
        clearTimeout(comboTimerRef.current);
      }
      if (decayTimerRef.current) {
        clearInterval(decayTimerRef.current);
        decayTimerRef.current = null;
      }
      
      particlesRef.current.forEach(particle => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      });
    };
  }, []);
  
  // Создание фоновых частиц
  const createBackgroundParticles = () => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const particles = [];
    
    // Удаляем старые частицы
    particlesRef.current.forEach(particle => {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle);
      }
    });
    
    // Создаем новые частицы
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'mystical-particle';
      
      // Случайный размер и позиция
      const size = 2 + Math.random() * 4;
      const posX = Math.random() * 100;
      const posY = Math.random() * 100;
      const delay = Math.random() * 5;
      const duration = 10 + Math.random() * 20;
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
      
      // Анимируем частицу
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
  
  // Обработчик нажатия на область сбора энергии
  const handleEnergyTap = (amount) => {
    // Рассчитываем базовую энергию в зависимости от активной зоны
    const activeZoneStats = zoneStats[activeZone];
    const baseEnergy = amount * activeZoneStats.multiplier * activeZoneStats.level;
    
    // Обновляем статистику фермы
    const newStats = {
      ...farmStats,
      totalClicks: farmStats.totalClicks + 1,
      todayEarned: parseFloat((farmStats.todayEarned + baseEnergy).toFixed(3)),
      lastDate: new Date().toDateString()
    };
    
    setFarmStats(newStats);
    localStorage.setItem('farmStats', JSON.stringify(newStats));
    
    // Обновляем статистику зоны
    const newZoneStats = { ...zoneStats };
    newZoneStats[activeZone].totalEnergy += baseEnergy;
    
    // Проверяем, можно ли повысить уровень зоны
    const currentLevel = newZoneStats[activeZone].level;
    const requiredEnergy = currentLevel * 50; // 50, 100, 150, ...
    
    if (newZoneStats[activeZone].totalEnergy >= requiredEnergy) {
      newZoneStats[activeZone].level += 1;
      
      // Анимация повышения уровня
      anime({
        targets: '.zone-level',
        scale: [1, 1.5, 1],
        opacity: [1, 0.5, 1],
        duration: 1000,
        easing: 'easeInOutQuad'
      });
    }
    
    // Проверяем, можно ли разблокировать новые зоны
    if (!newZoneStats.moon.unlocked && newZoneStats.crystal.level >= 5) {
      newZoneStats.moon.unlocked = true;
      
      // Анимация разблокировки
      anime({
        targets: '.zone-selector',
        scale: [1, 1.1, 1],
        duration: 1000,
        easing: 'easeInOutQuad'
      });
    }
    
    if (!newZoneStats.forest.unlocked && newZoneStats.moon.level >= 5) {
      newZoneStats.forest.unlocked = true;
      
      // Анимация разблокировки
      anime({
        targets: '.zone-selector',
        scale: [1, 1.1, 1],
        duration: 1000,
        easing: 'easeInOutQuad'
      });
    }
    
    setZoneStats(newZoneStats);
    localStorage.setItem('zoneStats', JSON.stringify(newZoneStats));
    
    // Добавляем запись в историю
    const historyEntry = {
      timestamp: new Date().toISOString(),
      amount: baseEnergy,
      zone: activeZone,
      combo: comboMultiplier
    };
    
    const newHistory = [historyEntry, ...energyHistory.slice(0, 19)]; // Храним только 20 последних записей
    setEnergyHistory(newHistory);
    localStorage.setItem('energyHistory', JSON.stringify(newHistory));
    
    // Обновляем баланс
    updateBalance(baseEnergy, baseEnergy * 0.1); // 10% энергии идет на опыт

    // Заряд портала (по клику постепенно открывается новое пространство)
    if (config?.features?.enablePortalMechanic) {
      const increment = 0.08; // Фиксированный быстрый заряд - портал откроется за ~12 кликов
      setPortalCharge(prev => {
        const next = Math.min(1, prev + increment);
        // Триггер открытия портала при полном заряде
        if (next >= 1 && !portalOpen) {
          setPortalOpen(true);
          // Небольшой визуальный импульс заголовка
          anime({ targets: '.farm-header', scale: [1, 1.03, 1], duration: 600, easing: 'easeOutQuad' });
        }
        return next;
      });
    }
  };
  
  // Обновление максимального комбо
  const updateMaxCombo = (combo) => {
    setComboCount(combo);
    
    if (combo >= 10) {
      setComboMultiplier(3);
    } else if (combo >= 5) {
      setComboMultiplier(2);
    } else {
      setComboMultiplier(1);
    }
    
    if (combo > farmStats.maxCombo) {
      const newStats = {
        ...farmStats,
        maxCombo: combo
      };
      setFarmStats(newStats);
      localStorage.setItem('farmStats', JSON.stringify(newStats));
    }
  };
  
  // Получение иконки для активной зоны
  const getZoneIcon = () => {
    switch (activeZone) {
      case 'moon':
        return <FaMoon className="zone-icon moon" />;
      case 'forest':
        return <FaLeaf className="zone-icon forest" />;
      default:
        return <FaStar className="zone-icon crystal" />;
    }
  };
  
  // Получение названия для активной зоны
  const getZoneName = () => {
    switch (activeZone) {
      case 'moon':
        return 'Лунная поляна';
      case 'forest':
        return 'Мистический лес';
      default:
        return 'Кристальная пещера';
    }
  };
  
  // Получение описания для активной зоны
  const getZoneDescription = () => {
    switch (activeZone) {
      case 'moon':
        return 'Энергия лунного света усиливает ваши способности. Базовый множитель: x1.5';
      case 'forest':
        return 'Древняя энергия леса течет сквозь вас. Базовый множитель: x2';
      default:
        return 'Кристаллы резонируют с вашей энергией. Базовый множитель: x1';
    }
  };
  
  // Получение цвета для активной зоны
  const getZoneColor = () => {
    switch (activeZone) {
      case 'moon':
        return COLOR_PALETTE.moonBlue;
      case 'forest':
        return COLOR_PALETTE.darkTurquoise;
      default:
        return COLOR_PALETTE.beigeParchment;
    }
  };
  
  // Форматирование даты для отображения в истории
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // Обработчики для портальной системы
  const handlePortalEnergyReward = (reward) => {
    updateBalance(reward, reward * 0.2); // 20% опыта от портальных наград
    
    // Добавляем запись в историю как портальную активность
    const historyEntry = {
      timestamp: new Date().toISOString(),
      amount: reward,
      zone: 'portal',
      combo: 1,
      type: 'portal_energy'
    };
    
    const newHistory = [historyEntry, ...energyHistory.slice(0, 19)];
    setEnergyHistory(newHistory);
    localStorage.setItem('energyHistory', JSON.stringify(newHistory));
  };

  const handlePortalAddPotion = (potion) => {
    const enhancedPotion = {
      ...potion,
      timestamp: Date.now(),
      fromPortal: true
    };
    
    const newPotions = [...potions, enhancedPotion];
    setPotions(newPotions);
    localStorage.setItem('potions', JSON.stringify(newPotions));
    
    // Показываем уведомление о получении зелья
    anime({
      targets: '.farm-actions',
      scale: [1, 1.1, 1],
      duration: 600,
      easing: 'easeOutQuad'
    });
  };

  const handlePortalAddArtifact = (artifact) => {
    const enhancedArtifact = {
      ...artifact,
      timestamp: Date.now(),
      fromPortal: true
    };
    
    const newArtifacts = [...artifacts, enhancedArtifact];
    setArtifacts(newArtifacts);
    localStorage.setItem('artifacts', JSON.stringify(newArtifacts));
    
    // Портальные артефакты дают дополнительную энергию
    if (artifact.energyBonus) {
      updateBalance(artifact.energyBonus, 0);
    }
  };

  // Обработчик клика по экрану для открытия портала
  const handleScreenClick = useCallback((event) => {
    // Проверяем, что клик не по кнопкам или другим элементам управления
    if (event.target.closest('button') || 
        event.target.closest('.action-button') ||
        event.target.closest('.zone-selector') ||
        event.target.closest('.modal-overlay') ||
        event.target.closest('.large-button-container') ||
        event.target.closest('.tutorial-button') ||
        event.target.closest('.balance-button')) {
      return;
    }

    // Проверяем, достаточно ли заряда портала и включены ли кинематографические порталы
    if (enableCinematicPortals && portalCharge >= 0.8 && !showAdvancedPortal) {
      console.log('🌀 Открытие портала...');
      
      // Предотвращаем всплытие события
      event.preventDefault();
      event.stopPropagation();
      
      // Получаем абсолютные координаты клика
      const x = event.clientX;
      const y = event.clientY;
      
      setPortalClickPosition({ x, y });
      setShowAdvancedPortal(true);
      
      // Сбрасываем заряд портала
      setPortalCharge(0);
      setPortalOpen(false);
      
      // Воспроизводим событие открытия портала
      window.dispatchEvent(new CustomEvent('portal-opened', { 
        detail: { x, y, source: 'FarmScreen' } 
      }));
    }
  }, [enableCinematicPortals, portalCharge, showAdvancedPortal]);

  // Обработчик завершения кинематографического портала
  const handleAdvancedPortalComplete = useCallback((result) => {
    if (result) {
      switch (result.type) {
        case 'brew':
          handlePortalEnergyReward(result.reward);
          if (result.potion) {
            handlePortalAddPotion(result.potion);
          }
          console.log('✨ Алхимия завершена! Награда:', result.reward);
          break;
        case 'potion':
          handlePortalAddPotion(result.potion);
          console.log('🧪 Получено зелье:', result.potion.name);
          break;
        case 'crystal':
          handlePortalEnergyReward(result.reward);
          if (result.artifact) {
            handlePortalAddArtifact(result.artifact);
          }
          console.log('💎 Найден кристалл! Награда:', result.reward);
          break;
        default:
          handlePortalEnergyReward(0.05);
      }
      
      // Закрываем портал только после реального завершения активности
      setTimeout(() => {
        setShowAdvancedPortal(false);
        setPortalClickPosition(null);
      }, 1000); // Даем больше времени на завершение анимации
    }
    // Если result пустой - НЕ закрываем портал (это был просто вызов открытия)
  }, [handlePortalEnergyReward, handlePortalAddPotion, handlePortalAddArtifact]);

  // Обработчик закрытия кинематографического портала
  const handleAdvancedPortalClose = useCallback(() => {
    setShowAdvancedPortal(false);
    setPortalClickPosition(null);
  }, []);
  
  return (
    <div 
      className={`farm-screen ${portalCharge >= 0.8 && enableCinematicPortals ? 'portal-ready' : ''}`} 
      ref={containerRef}
      onClick={handleScreenClick}
      style={{
        cursor: (portalCharge >= 0.8 && enableCinematicPortals) ? 'pointer' : 'default'
      }}
    >
      {/* Мистический фон с частицами */}
      <div className="mystical-overlay"></div>

      {/* Полноэкранная индикация готовности портала */}
      {portalCharge >= 0.8 && enableCinematicPortals && !showAdvancedPortal && (
        <div 
          className="portal-ready-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle, rgba(168,199,250,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 1,
            animation: 'portalReadyPulse 3s ease-in-out infinite'
          }}
        />
      )}

      {/* Индикатор инструкции для портала */}
      {portalCharge >= 0.8 && enableCinematicPortals && !showAdvancedPortal && (
        <div 
          className="portal-instruction"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: COLOR_PALETTE.moonBlue,
            fontSize: '18px',
            textShadow: '0 0 20px currentColor',
            pointerEvents: 'none',
            zIndex: 10,
            animation: 'portalInstructionFloat 4s ease-in-out infinite'
          }}
        >
          <div style={{ marginBottom: '8px', fontSize: '24px' }}>✨ Портал готов к открытию ✨</div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>
            Кликните в любое место экрана
          </div>
          <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>
            (избегайте кнопок и элементов интерфейса)
          </div>
        </div>
      )}

      {/* Отладочная информация (убрать в продакшене) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '8px',
          fontSize: '12px',
          fontFamily: 'monospace',
          borderRadius: '4px',
          zIndex: 1000,
          pointerEvents: 'none'
        }}>
          <div>Портал: {Math.round(portalCharge * 100)}%</div>
          <div>Кинематограф: {enableCinematicPortals ? 'ВКЛ' : 'ВЫКЛ'}</div>
          <div>Статус: {showAdvancedPortal ? 'ОТКРЫТ' : 'ЗАКРЫТ'}</div>
          {portalClickPosition && (
            <div>Позиция: {portalClickPosition.x}, {portalClickPosition.y}</div>
          )}
        </div>
      )}

      {/* Заголовок экрана */}
      <div className="farm-header">
        <h2>{getZoneName()}</h2>
        <div className="zone-level">Уровень {zoneStats[activeZone].level}</div>
      </div>
      
      {/* Статистика сбора энергии */}
      <div className="farm-stats">
        <div className="farm-stat">
          <span className="farm-stat-label">Сегодня собрано</span>
          <span className="farm-stat-value">{farmStats.todayEarned.toFixed(3)} ✦</span>
        </div>
        <div className="farm-stat">
          <span className="farm-stat-label">Макс. комбо</span>
          <span className="farm-stat-value">×{farmStats.maxCombo}</span>
        </div>
        <div className="farm-stat">
          <span className="farm-stat-label">Всего нажатий</span>
          <span className="farm-stat-value">{farmStats.totalClicks}</span>
        </div>
      </div>
      
      {/* Селектор зон */}
      <div className="zone-selectors">
        <button 
          className={`zone-selector ${activeZone === 'crystal' ? 'active' : ''}`}
          onClick={() => setActiveZone('crystal')}
        >
          <FaStar className="zone-selector-icon" />
          <span>Кристалл</span>
        </button>
        
        <button 
          className={`zone-selector ${activeZone === 'moon' ? 'active' : ''} ${!zoneStats.moon.unlocked ? 'locked' : ''}`}
          onClick={() => zoneStats.moon.unlocked && setActiveZone('moon')}
        >
          <FaMoon className="zone-selector-icon" />
          <span>{zoneStats.moon.unlocked ? 'Луна' : 'Закрыто'}</span>
          {!zoneStats.moon.unlocked && (
            <div className="unlock-info">Требуется 5 ур. кристалла</div>
          )}
        </button>
        
        <button 
          className={`zone-selector ${activeZone === 'forest' ? 'active' : ''} ${!zoneStats.forest.unlocked ? 'locked' : ''}`}
          onClick={() => zoneStats.forest.unlocked && setActiveZone('forest')}
        >
          <FaLeaf className="zone-selector-icon" />
          <span>{zoneStats.forest.unlocked ? 'Лес' : 'Закрыто'}</span>
          {!zoneStats.forest.unlocked && (
            <div className="unlock-info">Требуется 5 ур. луны</div>
          )}
        </button>
      </div>
      
      {/* Область сбора энергии */}
      <div className="energy-collection-area">
        <div className="large-button-container">
          <BalanceButton 
            onTap={handleEnergyTap} 
            onComboChange={updateMaxCombo} 
            size="large"
            progress={Math.min(1, (zoneStats[activeZone].totalEnergy % (zoneStats[activeZone].level * 50)) / (zoneStats[activeZone].level * 50))}
          />
          
          <button 
            className="tutorial-button"
            onClick={() => setShowTutorial(true)}
          >
            <FaInfoCircle />
          </button>
        </div>
        
        <p className="zone-description">{getZoneDescription()}</p>
        
        <div className="progress-container">
          <div className="progress-label">
            До следующего уровня: {(zoneStats[activeZone].level * 50 - zoneStats[activeZone].totalEnergy).toFixed(2)} ✦
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{
                width: `${Math.min(100, (zoneStats[activeZone].totalEnergy / (zoneStats[activeZone].level * 50)) * 100)}%`,
                backgroundColor: getZoneColor()
              }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Действия */}
      <div className="farm-actions">
        <button 
          className="action-button history-button"
          onClick={() => setShowHistory(true)}
        >
          <FaHistory /> История
        </button>
        {potions.length > 0 && (
          <button 
            className="action-button"
            onClick={() => alert(`У вас ${potions.length} зелий: ${potions.map(p => p.name).join(', ')}`)}
          >
            🧪 Зелья ({potions.length})
          </button>
        )}
        {artifacts.length > 0 && (
          <button 
            className="action-button"
            onClick={() => alert(`У вас ${artifacts.length} артефактов: ${artifacts.map(a => a.name).join(', ')}`)}
          >
            🔮 Артефакты ({artifacts.length})
          </button>
        )}
        {/* Кнопка быстрой зарядки для удобства тестирования */}
        {process.env.NODE_ENV === 'development' && (
          <button 
            className="action-button"
            onClick={(e) => {
              e.stopPropagation();
              setPortalCharge(1.0);
            }}
            style={{ 
              background: `linear-gradient(90deg, #A8C7FA ${portalCharge * 100}%, #333 ${portalCharge * 100}%)`,
              fontSize: '11px',
              color: 'white',
              opacity: 0.7
            }}
          >
            ⚡ ЗАРЯДКА ({Math.round(portalCharge * 100)}%)
          </button>
        )}
      </div>

      
      {/* Модальное окно с обучением */}
      {showTutorial && (
        <div className="modal-overlay" onClick={() => setShowTutorial(false)}>
          <div className="modal-content farm-tutorial" onClick={e => e.stopPropagation()}>
            <h3>Как собирать энергию</h3>
            
            <div className="tutorial-steps">
              <div className="tutorial-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Нажимайте на энергетическую сферу</h4>
                  <p>Каждое нажатие приносит энергию в зависимости от выбранной зоны</p>
                </div>
              </div>
              
              <div className="tutorial-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Создавайте комбо</h4>
                  <p>5 нажатий подряд активируют комбо x2, 10 нажатий - комбо x3</p>
                </div>
              </div>
              
              <div className="tutorial-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Повышайте уровень зон</h4>
                  <p>Каждый уровень зоны увеличивает базовую энергию от нажатия</p>
                </div>
              </div>
              
              <div className="tutorial-step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h4>Открывайте новые зоны</h4>
                  <p>Развивайте зоны для открытия новых с более высокими множителями</p>
                </div>
              </div>
            </div>
            
            <button className="close-button" onClick={() => setShowTutorial(false)}>
              Понятно
            </button>
          </div>
        </div>
      )}
      
      {/* Модальное окно с историей */}
      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="modal-content history-modal" onClick={e => e.stopPropagation()}>
            <h3>История сбора энергии</h3>
            
            {energyHistory.length === 0 ? (
              <p className="empty-history">История пуста</p>
            ) : (
              <div className="history-list">
                {energyHistory.map((entry, index) => (
                  <div key={index} className="history-item">
                    <div className="history-time">{formatDate(entry.timestamp)}</div>
                    <div className="history-zone">
                      {entry.zone === 'crystal' && <FaStar className="history-icon crystal" />}
                      {entry.zone === 'moon' && <FaMoon className="history-icon moon" />}
                      {entry.zone === 'forest' && <FaLeaf className="history-icon forest" />}
                    </div>
                    <div className="history-amount">+{entry.amount.toFixed(3)} ✦</div>
                    {entry.combo > 1 && (
                      <div className="history-combo">x{entry.combo}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <button className="close-button" onClick={() => setShowHistory(false)}>
              Закрыть
            </button>
          </div>
        </div>
      )}
      {/* UI выбора мини-игры после открытия портала */}
      {config?.features?.enableMiniGames && showPortalUI && (
        <div className="modal-overlay" onClick={() => { setShowPortalUI(false); setPortalOpen(false); setPortalCharge(0); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Портал открыт — выбери занятие</h3>
            <div className="portal-actions">
              <button className="action-button" onClick={() => { setShowPotionLab(true); setShowPortalUI(false); }}>
                <GenerativeIcon name="potion" />
                <span>Алхимия</span>
              </button>
              <button className="action-button" onClick={() => { setShowCrystalMine(true); setShowPortalUI(false); }}>
                <GenerativeIcon name="crystal" />
                <span>Добыча кристаллов</span>
              </button>
            </div>
            <button className="close-button" onClick={() => { setShowPortalUI(false); setPortalOpen(false); setPortalCharge(0); }}>Закрыть</button>
          </div>
        </div>
      )}

      {/* Мини-игра: Алхимическая лаборатория */}
      {config?.features?.enableMiniGames && showPotionLab && (
        <AlchemyLab 
          onClose={() => { setShowPotionLab(false); setPortalOpen(false); setPortalCharge(0); }}
          onBrew={(reward) => { updateBalance(reward, reward * 5); }}
          onAddPotion={(potion) => { 
            setPotions(prev => [...prev, potion]); 
            localStorage.setItem('potions', JSON.stringify([...potions, potion]));
          }}
        />
      )}

      {/* Мини-игра: Кристальная жила */}
      {config?.features?.enableMiniGames && showCrystalMine && (
        <CrystalMine 
          onClose={() => { setShowCrystalMine(false); setPortalOpen(false); setPortalCharge(0); }}
          onMine={(reward) => { updateBalance(reward, reward * 3); }}
        />
      )}

      {/* Кинематографический портал - независимое пространство */}
      {showAdvancedPortal && (
        <div
          onClick={(e) => {
            e.stopPropagation(); // Предотвращаем всплытие кликов по порталу
          }}
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 10000,
            pointerEvents: 'auto'
          }}
        >
          <AdvancedPortalManager
            isOpen={showAdvancedPortal}
            clickPosition={portalClickPosition}
            onClose={handleAdvancedPortalClose}
            onComplete={handleAdvancedPortalComplete}
          />
        </div>
      )}

      {/* CSS анимации для портальных эффектов */}
      <style jsx>{`
        .farm-screen.portal-ready {
          position: relative;
        }
        
        @keyframes portalReadyPulse {
          0%, 100% { 
            background: radial-gradient(circle, rgba(168,199,250,0.1) 0%, transparent 70%);
            transform: scale(1);
          }
          50% { 
            background: radial-gradient(circle, rgba(168,199,250,0.2) 0%, transparent 80%);
            transform: scale(1.02);
          }
        }
        
        @keyframes portalInstructionFloat {
          0%, 100% { 
            transform: translate(-50%, -50%) translateY(0px);
            opacity: 0.8;
          }
          50% { 
            transform: translate(-50%, -50%) translateY(-10px);
            opacity: 1;
          }
        }
        
        .portal-ready-overlay {
          border-radius: inherit;
        }
        
        .portal-instruction {
          font-family: serif;
          font-weight: bold;
          letter-spacing: 1px;
          user-select: none;
        }
        
        /* Мобильная адаптация для портальных инструкций */
        @media (max-width: 768px) {
          .portal-instruction {
            font-size: 16px !important;
          }
          
          .portal-instruction div:first-child {
            font-size: 20px !important;
          }
          
          .portal-instruction div:last-child {
            font-size: 12px !important;
          }
        }
        
        /* Высокий контраст */
        @media (prefers-color-scheme: dark) {
          .portal-ready-overlay {
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%) !important;
          }
        }
        
        /* Уменьшенная анимация */
        @media (prefers-reduced-motion: reduce) {
          .portal-ready-overlay,
          .portal-instruction {
            animation: none !important;
          }
          
          .farm-screen.portal-ready {
            outline: 2px dashed rgba(168,199,250,0.5);
          }
        }
      `}</style>
    </div>
  );
};

export default FarmScreen; 