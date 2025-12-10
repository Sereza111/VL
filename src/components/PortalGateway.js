import React, { useState, useCallback, useRef, useEffect } from 'react';
import PortalReveal from './PortalReveal';
import AdvancedPortalManager from './AdvancedPortalManager';
import AlchemyLab from '../screens/mini/AlchemyLab';
import CrystalMine from '../screens/mini/CrystalMine';

/**
 * PortalGateway - Центральный компонент для управления кинематографическими порталами
 * Связывает различные мини-игры с портальной системой
 */
const PortalGateway = ({ 
  onEnergyReward = null,
  onAddPotion = null,
  onAddArtifact = null,
  isVisible = true,
  position = 'center', // center, corner, custom
  customPosition = null,
  theme = 'mystical',
  enableHapticFeedback = true,
  energyMultiplier = 1.2 // Повышенный множитель энергии для портальных активностей
}) => {
  const [activePortal, setActivePortal] = useState(null);
  const [portalHistory, setPortalHistory] = useState([]);
  const [isPortalReady, setIsPortalReady] = useState(false);
  const [clickPosition, setClickPosition] = useState(null);
  const [portalType, setPortalType] = useState('alchemy'); // alchemy, crystal, artifact
  
  const gatewayRef = useRef(null);
  const energyAccumulatorRef = useRef(0);

  // Определяем позицию шлюза
  const getGatewayPosition = useCallback(() => {
    if (position === 'custom' && customPosition) {
      return customPosition;
    }
    
    const positions = {
      center: { 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)' 
      },
      corner: { 
        bottom: '20px', 
        right: '20px' 
      },
      'top-center': { 
        top: '20px', 
        left: '50%', 
        transform: 'translateX(-50%)' 
      }
    };
    
    return positions[position] || positions.center;
  }, [position, customPosition]);

  // Haptic feedback для мобильных устройств
  const triggerHapticFeedback = useCallback((intensity = 'medium') => {
    if (!enableHapticFeedback) return;
    
    if (navigator.vibrate) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [50, 100, 50],
        portal: [30, 50, 30, 100, 30] // Специальная вибрация для порталов
      };
      
      navigator.vibrate(patterns[intensity] || patterns.medium);
    }
  }, [enableHapticFeedback]);

  // Обработчик накопления энергии
  const handleEnergyAccumulation = useCallback((amount) => {
    energyAccumulatorRef.current += amount * energyMultiplier;
    
    // Каждые 5 единиц энергии награждаем пользователя
    if (energyAccumulatorRef.current >= 5) {
      const reward = Math.floor(energyAccumulatorRef.current);
      energyAccumulatorRef.current -= reward;
      
      if (onEnergyReward) {
        onEnergyReward(reward);
      }
      
      // Визуальная обратная связь
      triggerHapticFeedback('light');
      
      // Создаем эффект сбора энергии
      window.dispatchEvent(new CustomEvent('energy-collected', {
        detail: { 
          amount: reward,
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
          source: 'portal_gateway'
        }
      }));
    }
  }, [energyMultiplier, onEnergyReward, triggerHapticFeedback]);

  // Обработчик клика на портальный шлюз
  const handleGatewayClick = useCallback((event) => {
    if (!isVisible) return;
    
    const rect = gatewayRef.current?.getBoundingClientRect();
    const x = event.clientX || rect.left + rect.width / 2;
    const y = event.clientY || rect.top + rect.height / 2;
    
    setClickPosition({ x, y });
    setIsPortalReady(true);
    
    triggerHapticFeedback('portal');
    
    // Звуковой эффект (если поддерживается)
    playPortalSound('gateway_activate');
  }, [isVisible, triggerHapticFeedback]);

  // Воспроизведение портального звука
  const playPortalSound = useCallback((soundType) => {
    // Интеграция с существующей звуковой системой
    if (window.soundEnabled && window.audioContext) {
      // Здесь можно добавить генерацию звуков через Web Audio API
      console.log(`Playing portal sound: ${soundType}`);
    }
  }, []);

  // Обработчик завершения портальной активности
  const handlePortalComplete = useCallback((result) => {
    if (result) {
      switch (result.type) {
        case 'brew':
          handleEnergyAccumulation(result.reward || 0.12);
          triggerHapticFeedback('heavy');
          break;
        
        case 'potion':
          if (onAddPotion) {
            onAddPotion({
              ...result.potion,
              source: 'portal_alchemy',
              enhanced: true, // Портальные зелья получают усиление
              energyBonus: result.potion.quality * 0.1
            });
          }
          triggerHapticFeedback('medium');
          break;
        
        case 'crystal':
          handleEnergyAccumulation(result.reward || 0.08);
          if (onAddArtifact) {
            onAddArtifact({
              id: Date.now(),
              name: result.crystal?.name || 'Портальный кристалл',
              type: 'crystal',
              rarity: result.crystal?.rarity || 'rare',
              source: 'portal_mine',
              power: result.crystal?.power || Math.random() * 100 + 50
            });
          }
          break;
        
        default:
          handleEnergyAccumulation(0.05);
      }
      
      // Добавляем в историю портальных переходов
      setPortalHistory(prev => [
        ...prev.slice(-9), // Храним последние 10 переходов
        {
          timestamp: Date.now(),
          type: result.type,
          reward: result.reward,
          success: true
        }
      ]);
    }
    
    // Сбрасываем состояние портала
    setIsPortalReady(false);
    setActivePortal(null);
    setClickPosition(null);
  }, [handleEnergyAccumulation, triggerHapticFeedback, onAddPotion, onAddArtifact]);

  // Обработчик закрытия портала
  const handlePortalClose = useCallback(() => {
    setIsPortalReady(false);
    setActivePortal(null);
    setClickPosition(null);
    triggerHapticFeedback('light');
  }, [triggerHapticFeedback]);

  // Определяем тип портала на основе времени или других условий
  useEffect(() => {
    const hour = new Date().getHours();
    
    if (hour >= 0 && hour < 6) {
      setPortalType('crystal'); // Ночное время - кристальная шахта
    } else if (hour >= 6 && hour < 18) {
      setPortalType('alchemy'); // День - алхимическая лаборатория  
    } else {
      setPortalType('artifact'); // Вечер - поиск артефактов
    }
  }, []);

  // Автоматическая активация портала (опциональная)
  useEffect(() => {
    if (isVisible) {
      const autoActivateTimer = setTimeout(() => {
        // Создаем слабое свечение, указывающее на готовность портала
        const gateway = gatewayRef.current;
        if (gateway) {
          gateway.classList.add('portal-ready');
        }
      }, 2000);
      
      return () => clearTimeout(autoActivateTimer);
    }
  }, [isVisible]);

  // Компонент не рендерится, если не видим
  if (!isVisible) {
    return null;
  }

  return (
    <div 
      ref={gatewayRef}
      className={`portal-gateway portal-gateway-${theme} portal-type-${portalType}`}
      style={{
        position: 'fixed',
        zIndex: 1000,
        ...getGatewayPosition()
      }}
    >
      {/* Основной портальный визуализатор */}
      <PortalReveal
        isOpen={isPortalReady}
        progress={isPortalReady ? 1 : 0}
        size={120}
        accentColor={
          portalType === 'alchemy' ? '#A8C7FA' :
          portalType === 'crystal' ? '#4ECDC4' :
          '#9B59B6'
        }
        enableCinematicMode={true}
        clickPosition={clickPosition}
        onComplete={handlePortalComplete}
        className="gateway-portal-reveal"
      />
      
      {/* Кнопка активации портала */}
      <button
        className="portal-gateway-button"
        onClick={handleGatewayClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleGatewayClick(e);
          }
        }}
        aria-label={`Открыть портал: ${
          portalType === 'alchemy' ? 'Алхимическая лаборатория' :
          portalType === 'crystal' ? 'Кристальная шахта' :
          'Поиск артефактов'
        }`}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80px',
          height: '80px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          borderRadius: '50%',
          zIndex: 10
        }}
      >
        <span className="gateway-icon">
          {portalType === 'alchemy' ? '⚗️' : 
           portalType === 'crystal' ? '💎' : 
           '🔮'}
        </span>
      </button>
      
      {/* Индикатор типа портала */}
      <div className="portal-type-indicator">
        <div className="portal-type-name">
          {portalType === 'alchemy' ? 'Алхимия' :
           portalType === 'crystal' ? 'Шахта' :
           'Артефакты'}
        </div>
        <div className="portal-energy-multiplier">
          ×{energyMultiplier}
        </div>
      </div>
      
      {/* История портальных переходов (мини-индикатор) */}
      {portalHistory.length > 0 && (
        <div className="portal-history-indicator">
          {portalHistory.slice(-3).map((entry, i) => (
            <div 
              key={entry.timestamp}
              className={`history-dot ${entry.success ? 'success' : 'failure'}`}
              style={{
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
      )}

      {/* CSS стили для шлюза */}
      <style jsx>{`
        .portal-gateway {
          transition: all 0.3s ease;
          filter: drop-shadow(0 0 20px rgba(168, 199, 250, 0.3));
        }
        
        .portal-gateway.portal-ready {
          animation: gatewayPulse 2s ease-in-out infinite;
        }
        
        .portal-gateway-button {
          transition: all 0.2s ease;
        }
        
        .portal-gateway-button:hover {
          transform: translate(-50%, -50%) scale(1.1);
        }
        
        .portal-gateway-button:focus-visible {
          outline: 2px solid #A8C7FA;
          outline-offset: 5px;
        }
        
        .gateway-icon {
          font-size: 24px;
          display: block;
          animation: iconFloat 3s ease-in-out infinite;
        }
        
        .portal-type-indicator {
          position: absolute;
          bottom: -30px;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
          font-size: 12px;
          color: rgba(168, 199, 250, 0.8);
          font-family: serif;
        }
        
        .portal-energy-multiplier {
          color: #FFD700;
          font-weight: bold;
          font-size: 10px;
        }
        
        .portal-history-indicator {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 4px;
        }
        
        .history-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          animation: historyPulse 1s ease-out forwards;
        }
        
        .history-dot.success {
          background: #4ECDC4;
          box-shadow: 0 0 8px #4ECDC4;
        }
        
        .history-dot.failure {
          background: #FF6B6B;
          box-shadow: 0 0 8px #FF6B6B;
        }
        
        /* Анимации */
        @keyframes gatewayPulse {
          0%, 100% { 
            filter: drop-shadow(0 0 20px rgba(168, 199, 250, 0.3)); 
          }
          50% { 
            filter: drop-shadow(0 0 30px rgba(168, 199, 250, 0.6)); 
          }
        }
        
        @keyframes iconFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        @keyframes historyPulse {
          0% { 
            opacity: 0; 
            transform: scale(0); 
          }
          50% { 
            opacity: 1; 
            transform: scale(1.2); 
          }
          100% { 
            opacity: 0.7; 
            transform: scale(1); 
          }
        }
        
        /* Темы */
        .portal-gateway-mystical {
          filter: drop-shadow(0 0 20px rgba(168, 199, 250, 0.4));
        }
        
        .portal-gateway-cosmic {
          filter: drop-shadow(0 0 20px rgba(155, 89, 182, 0.4));
        }
        
        .portal-gateway-ethereal {
          filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.4));
        }
        
        /* Типы порталов */
        .portal-type-alchemy .gateway-icon {
          color: #A8C7FA;
          text-shadow: 0 0 10px #A8C7FA;
        }
        
        .portal-type-crystal .gateway-icon {
          color: #4ECDC4;
          text-shadow: 0 0 10px #4ECDC4;
        }
        
        .portal-type-artifact .gateway-icon {
          color: #9B59B6;
          text-shadow: 0 0 10px #9B59B6;
        }
        
        /* Мобильная адаптация */
        @media (max-width: 768px) {
          .portal-gateway-button {
            width: 60px;
            height: 60px;
          }
          
          .gateway-icon {
            font-size: 20px;
          }
          
          .portal-type-indicator {
            font-size: 10px;
          }
        }
        
        @media (max-width: 480px) {
          .portal-gateway-button {
            width: 50px;
            height: 50px;
          }
          
          .gateway-icon {
            font-size: 18px;
          }
          
          .portal-history-indicator {
            display: none; /* Скрываем историю на очень маленьких экранах */
          }
        }
      `}</style>
    </div>
  );
};

export default PortalGateway;
