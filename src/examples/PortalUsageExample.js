import React, { useState, useEffect } from 'react';
import AdvancedPortalManager from '../components/AdvancedPortalManager';
import PortalGateway from '../components/PortalGateway';
import PortalReveal from '../components/PortalReveal';

/**
 * Пример использования кинематографической портальной системы
 * Демонстрирует все возможности и интеграции
 */
const PortalUsageExample = () => {
  // Состояния для различных типов порталов
  const [showAdvancedPortal, setShowAdvancedPortal] = useState(false);
  const [showPortalGateway, setShowPortalGateway] = useState(true);
  const [showPortalReveal, setShowPortalReveal] = useState(false);
  
  // Состояния пользователя
  const [balance, setBalance] = useState(100);
  const [potions, setPotions] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [portalHistory, setPortalHistory] = useState([]);
  
  // Позиция клика для портала
  const [clickPosition, setClickPosition] = useState(null);
  
  // Настройки портальной системы
  const [portalSettings, setPortalSettings] = useState({
    enableHaptic: true,
    enableSound: true,
    visualTheme: 'mystical',
    performanceMode: 'auto', // auto, high, low
    enableWebGL: true
  });

  // Обработчик клика для активации портала
  const handleScreenClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    setClickPosition({ x: event.clientX, y: event.clientY });
    setShowAdvancedPortal(true);
  };

  // Обработчики портальных наград
  const handleEnergyReward = (reward) => {
    setBalance(prev => prev + reward);
    
    // Добавляем в историю
    const historyEntry = {
      id: Date.now(),
      timestamp: new Date(),
      type: 'energy',
      amount: reward,
      source: 'portal'
    };
    
    setPortalHistory(prev => [historyEntry, ...prev.slice(0, 9)]);
    
    // Показываем уведомление
    showNotification(`+${reward} энергии получено!`, 'success');
  };

  const handleAddPotion = (potion) => {
    const enhancedPotion = {
      ...potion,
      id: Date.now(),
      timestamp: new Date(),
      fromPortal: true,
      enhanced: true // Портальные зелья получают усиление
    };
    
    setPotions(prev => [...prev, enhancedPotion]);
    showNotification(`Получено зелье: ${potion.name}!`, 'rare');
  };

  const handleAddArtifact = (artifact) => {
    const enhancedArtifact = {
      ...artifact,
      id: Date.now(),
      timestamp: new Date(),
      fromPortal: true,
      rarity: artifact.rarity === 'common' ? 'rare' : artifact.rarity // Повышаем редкость
    };
    
    setArtifacts(prev => [...prev, enhancedArtifact]);
    showNotification(`Найден артефакт: ${artifact.name}!`, 'legendary');
  };

  // Система уведомлений
  const [notifications, setNotifications] = useState([]);

  const showNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: Date.now()
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Автоматически удаляем через 3 секунды
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 3000);
  };

  // Обработка завершения портала
  const handlePortalComplete = (result) => {
    if (result) {
      switch (result.type) {
        case 'brew':
          handleEnergyReward(result.reward);
          break;
        case 'potion':
          handleAddPotion(result.potion);
          break;
        case 'crystal':
          handleEnergyReward(result.reward);
          if (result.artifact) {
            handleAddArtifact(result.artifact);
          }
          break;
        default:
          showNotification('Портальная активность завершена!', 'info');
      }
    }
    
    setShowAdvancedPortal(false);
    setClickPosition(null);
  };

  // Определение производительности устройства
  useEffect(() => {
    const detectPerformance = () => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');
      
      if (!gl) {
        setPortalSettings(prev => ({ 
          ...prev, 
          performanceMode: 'low',
          enableWebGL: false 
        }));
        return;
      }
      
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
      
      // Детекция слабых устройств
      if (renderer.includes('Mali') || 
          renderer.includes('Adreno 3') || 
          window.innerWidth < 768) {
        setPortalSettings(prev => ({ ...prev, performanceMode: 'low' }));
      } else if (renderer.includes('RTX') || 
                 renderer.includes('GTX') || 
                 renderer.includes('Radeon')) {
        setPortalSettings(prev => ({ ...prev, performanceMode: 'high' }));
      }
    };
    
    detectPerformance();
  }, []);

  return (
    <div className="portal-usage-example">
      {/* Главная область - клик для открытия портала */}
      <div 
        className="portal-activation-area"
        onClick={handleScreenClick}
        style={{
          width: '100%',
          height: '400px',
          background: 'linear-gradient(135deg, #3C2F4F, #1A3C34)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          borderRadius: '12px',
          border: '2px solid rgba(168, 199, 250, 0.3)',
          marginBottom: '20px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ textAlign: 'center', color: '#E8D3A9' }}>
          <h2 style={{ margin: '0 0 10px 0' }}>✨ Кликните для открытия портала ✨</h2>
          <p style={{ margin: 0, opacity: 0.8 }}>
            Кинематографический переход в алхимическую лабораторию
          </p>
        </div>
        
        {/* Фоновые частицы */}
        <div className="background-particles">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                position: 'absolute',
                width: '3px',
                height: '3px',
                background: i % 2 === 0 ? '#A8C7FA' : '#FFD700',
                borderRadius: '50%',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: 0.6
              }}
            />
          ))}
        </div>
      </div>

      {/* Панель управления */}
      <div className="portal-controls" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '20px'
      }}>
        <div className="control-section">
          <h3>Статистика</h3>
          <div className="stats">
            <div>💰 Баланс: {balance.toFixed(2)} VL</div>
            <div>🧪 Зелья: {potions.length}</div>
            <div>🔮 Артефакты: {artifacts.length}</div>
            <div>📜 История: {portalHistory.length} записей</div>
          </div>
        </div>

        <div className="control-section">
          <h3>Настройки портала</h3>
          <label>
            <input
              type="checkbox"
              checked={portalSettings.enableHaptic}
              onChange={(e) => setPortalSettings(prev => ({ 
                ...prev, 
                enableHaptic: e.target.checked 
              }))}
            />
            Haptic Feedback
          </label>
          <label>
            <input
              type="checkbox"
              checked={portalSettings.enableSound}
              onChange={(e) => setPortalSettings(prev => ({ 
                ...prev, 
                enableSound: e.target.checked 
              }))}
            />
            Звуковые эффекты
          </label>
          <label>
            <input
              type="checkbox"
              checked={portalSettings.enableWebGL}
              onChange={(e) => setPortalSettings(prev => ({ 
                ...prev, 
                enableWebGL: e.target.checked 
              }))}
            />
            WebGL эффекты
          </label>
          <select
            value={portalSettings.visualTheme}
            onChange={(e) => setPortalSettings(prev => ({ 
              ...prev, 
              visualTheme: e.target.value 
            }))}
          >
            <option value="mystical">Мистическая</option>
            <option value="cosmic">Космическая</option>
            <option value="ethereal">Эфирная</option>
          </select>
        </div>

        <div className="control-section">
          <h3>Тестовые порталы</h3>
          <button onClick={() => setShowPortalReveal(true)}>
            🌀 Portal Reveal
          </button>
          <button onClick={() => setShowPortalGateway(!showPortalGateway)}>
            🚪 {showPortalGateway ? 'Скрыть' : 'Показать'} Gateway
          </button>
          <button onClick={() => showNotification('Тестовое уведомление!', 'info')}>
            📢 Тест уведомления
          </button>
        </div>
      </div>

      {/* Инвентарь */}
      {(potions.length > 0 || artifacts.length > 0) && (
        <div className="inventory" style={{ 
          background: 'rgba(60, 47, 79, 0.8)',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#E8D3A9', margin: '0 0 10px 0' }}>🎒 Инвентарь</h3>
          
          {potions.length > 0 && (
            <div className="potions">
              <h4 style={{ color: '#A8C7FA' }}>🧪 Зелья:</h4>
              {potions.map(potion => (
                <div key={potion.id} className="inventory-item">
                  <strong>{potion.name}</strong>
                  {potion.fromPortal && <span className="portal-tag">Портальное</span>}
                  {potion.enhanced && <span className="enhanced-tag">Усиленное</span>}
                  <div className="item-details">
                    Качество: {potion.quality}% | 
                    Эффект: {potion.effect}
                  </div>
                </div>
              ))}
            </div>
          )}

          {artifacts.length > 0 && (
            <div className="artifacts">
              <h4 style={{ color: '#FFD700' }}>🔮 Артефакты:</h4>
              {artifacts.map(artifact => (
                <div key={artifact.id} className="inventory-item">
                  <strong>{artifact.name}</strong>
                  <span className={`rarity-tag ${artifact.rarity}`}>
                    {artifact.rarity}
                  </span>
                  {artifact.fromPortal && <span className="portal-tag">Портальное</span>}
                  <div className="item-details">
                    Сила: {Math.round(artifact.power)} | 
                    Тип: {artifact.type}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* История порталов */}
      {portalHistory.length > 0 && (
        <div className="portal-history" style={{ 
          background: 'rgba(27, 38, 59, 0.8)',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#E8D3A9', margin: '0 0 10px 0' }}>📜 История порталов</h3>
          {portalHistory.map(entry => (
            <div key={entry.id} className="history-entry">
              <span className="timestamp">
                {entry.timestamp.toLocaleTimeString()}
              </span>
              <span className="entry-type">{entry.type}</span>
              <span className="entry-amount">+{entry.amount}</span>
            </div>
          ))}
        </div>
      )}

      {/* Компоненты портальной системы */}
      
      {/* Основной кинематографический портал */}
      {showAdvancedPortal && (
        <AdvancedPortalManager
          isOpen={showAdvancedPortal}
          clickPosition={clickPosition}
          onClose={() => {
            setShowAdvancedPortal(false);
            setClickPosition(null);
          }}
          onComplete={handlePortalComplete}
        />
      )}

      {/* Портальный шлюз */}
      {showPortalGateway && (
        <PortalGateway
          isVisible={true}
          position="corner"
          theme={portalSettings.visualTheme}
          onEnergyReward={handleEnergyReward}
          onAddPotion={handleAddPotion}
          onAddArtifact={handleAddArtifact}
          energyMultiplier={1.5}
          enableHapticFeedback={portalSettings.enableHaptic}
        />
      )}

      {/* Portal Reveal для тестирования */}
      {showPortalReveal && (
        <div style={{ 
          position: 'fixed', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          zIndex: 1000
        }}>
          <PortalReveal
            isOpen={true}
            enableCinematicMode={true}
            onComplete={(result) => {
              handlePortalComplete(result);
              setShowPortalReveal(false);
            }}
          />
          <button
            onClick={() => setShowPortalReveal(false)}
            style={{
              position: 'absolute',
              top: '-40px',
              right: '0',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid #A8C7FA',
              color: '#E8D3A9',
              padding: '5px 10px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Система уведомлений */}
      <div className="notifications" style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`notification notification-${notification.type}`}
            style={{
              background: 'rgba(60, 47, 79, 0.95)',
              border: `2px solid ${
                notification.type === 'success' ? '#4ECDC4' :
                notification.type === 'rare' ? '#A8C7FA' :
                notification.type === 'legendary' ? '#FFD700' :
                '#E8D3A9'
              }`,
              color: '#E8D3A9',
              padding: '12px 16px',
              borderRadius: '8px',
              maxWidth: '300px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            {notification.message}
          </div>
        ))}
      </div>

      {/* CSS для анимаций и стилей */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(180deg); }
        }
        
        @keyframes slideIn {
          from { 
            opacity: 0; 
            transform: translateX(100%); 
          }
          to { 
            opacity: 1; 
            transform: translateX(0); 
          }
        }
        
        .control-section {
          background: rgba(60, 47, 79, 0.8);
          padding: 15px;
          border-radius: 8px;
          color: #E8D3A9;
        }
        
        .control-section h3 {
          margin: 0 0 10px 0;
          color: #A8C7FA;
        }
        
        .control-section label {
          display: block;
          margin: 5px 0;
          cursor: pointer;
        }
        
        .control-section input[type="checkbox"] {
          margin-right: 8px;
        }
        
        .control-section select {
          width: 100%;
          background: rgba(27, 38, 59, 0.8);
          color: #E8D3A9;
          border: 1px solid #A8C7FA;
          padding: 5px;
          border-radius: 4px;
        }
        
        .control-section button {
          display: block;
          width: 100%;
          margin: 5px 0;
          padding: 8px 12px;
          background: rgba(27, 38, 59, 0.8);
          color: #E8D3A9;
          border: 1px solid #A8C7FA;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .control-section button:hover {
          background: rgba(168, 199, 250, 0.1);
          transform: translateY(-1px);
        }
        
        .inventory-item {
          background: rgba(27, 38, 59, 0.6);
          margin: 8px 0;
          padding: 10px;
          border-radius: 6px;
          border-left: 3px solid #A8C7FA;
        }
        
        .portal-tag {
          background: linear-gradient(45deg, #A8C7FA, #4ECDC4);
          color: #1A3C34;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: bold;
          margin-left: 8px;
        }
        
        .enhanced-tag {
          background: linear-gradient(45deg, #FFD700, #FF8C00);
          color: #3C2F4F;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: bold;
          margin-left: 4px;
        }
        
        .rarity-tag {
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: bold;
          margin-left: 8px;
        }
        
        .rarity-tag.common { background: #888; color: white; }
        .rarity-tag.rare { background: #A8C7FA; color: #1A3C34; }
        .rarity-tag.legendary { background: #FFD700; color: #3C2F4F; }
        
        .item-details {
          font-size: 12px;
          opacity: 0.8;
          margin-top: 4px;
        }
        
        .history-entry {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px;
          margin: 4px 0;
          background: rgba(60, 47, 79, 0.4);
          border-radius: 4px;
        }
        
        .timestamp {
          font-size: 12px;
          opacity: 0.7;
        }
        
        .entry-type {
          text-transform: capitalize;
        }
        
        .entry-amount {
          color: #4ECDC4;
          font-weight: bold;
        }
        
        .stats div {
          margin: 4px 0;
          padding: 4px 8px;
          background: rgba(27, 38, 59, 0.6);
          border-radius: 4px;
        }
        
        /* Мобильная адаптация */
        @media (max-width: 768px) {
          .portal-controls {
            grid-template-columns: 1fr;
          }
          
          .portal-activation-area {
            height: 250px;
          }
          
          .notifications {
            left: 10px;
            right: 10px;
            top: 10px;
          }
          
          .notification {
            max-width: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PortalUsageExample;
