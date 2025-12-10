import React, { useEffect, useMemo, useRef, useState } from 'react';
import anime from 'animejs/lib/anime.js';
import GenerativeIcon from '../../components/GenerativeIcon';
import AlchemyFlask from '../../components/AlchemyFlask';
import './mini.css';

// Полноценная алхимическая лаборатория
const ingredients = [
  { id: 'moonherb', name: 'Лунная трава', color: '#A8C7FA', temp: 60, effect: 'healing' },
  { id: 'fireflower', name: 'Огненный цветок', color: '#FF6B6B', temp: 120, effect: 'energy' },
  { id: 'crystaldust', name: 'Кристальная пыль', color: '#4ECDC4', temp: 40, effect: 'magic' },
  { id: 'shadowmoss', name: 'Теневой мох', color: '#9B59B6', temp: 80, effect: 'stealth' },
  { id: 'goldensap', name: 'Золотая смола', color: '#F1C40F', temp: 100, effect: 'luck' }
];

const AlchemyLab = ({ onClose, onBrew, onAddPotion, energyReward = 0.08 }) => {
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [temperature, setTemperature] = useState(20);
  const [isHeating, setIsHeating] = useState(false);
  const [brewingStage, setBrewingStage] = useState('selecting'); // selecting, heating, mixing, complete
  const [potionColor, setPotionColor] = useState('#3C2F4F');
  const [bubbles, setBubbles] = useState([]);
  const [hint, setHint] = useState('Выберите ингредиенты для зелья');
  
  const cauldronRef = useRef(null);
  const flameRef = useRef(null);
  const liquidRef = useRef(null);
  const temperatureRef = useRef(20);

  // Обновление цвета зелья на основе ингредиентов
  useEffect(() => {
    if (selectedIngredients.length === 0) {
      setPotionColor('#3C2F4F');
      return;
    }
    
    // Смешиваем цвета ингредиентов
    let r = 0, g = 0, b = 0;
    selectedIngredients.forEach(ing => {
      const color = ingredients.find(i => i.id === ing.id)?.color || '#3C2F4F';
      const rgb = hexToRgb(color);
      r += rgb.r;
      g += rgb.g;
      b += rgb.b;
    });
    
    const count = selectedIngredients.length;
    const newColor = `rgb(${Math.round(r/count)}, ${Math.round(g/count)}, ${Math.round(b/count)})`;
    setPotionColor(newColor);
  }, [selectedIngredients]);

  // Анимация нагрева
  useEffect(() => {
    if (!isHeating) return;
    
    const heatInterval = setInterval(() => {
      setTemperature(prev => {
        const newTemp = Math.min(150, prev + 2);
        temperatureRef.current = newTemp;
        
        // Создаем пузырьки при нагреве
        if (newTemp > 60 && Math.random() < 0.3) {
          createBubble();
        }
        
        return newTemp;
      });
    }, 100);

    return () => clearInterval(heatInterval);
  }, [isHeating]);

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 60, g: 47, b: 79 };
  };

  const createBubble = () => {
    const bubble = {
      id: Date.now() + Math.random(),
      x: 40 + Math.random() * 20,
      y: 80,
      size: 3 + Math.random() * 5,
      speed: 0.5 + Math.random() * 1
    };
    
    setBubbles(prev => [...prev.slice(-8), bubble]);
    
    // Удаляем пузырек через время
    setTimeout(() => {
      setBubbles(prev => prev.filter(b => b.id !== bubble.id));
    }, 2000);
  };

  const addIngredient = (ingredient) => {
    if (selectedIngredients.length >= 4) {
      setHint('Максимум 4 ингредиента!');
      return;
    }
    
    setSelectedIngredients(prev => [...prev, { ...ingredient, id: ingredient.id + '_' + Date.now() }]);
    setHint(`Добавлен ${ingredient.name}`);
    
    // Создаём частицы при добавлении
    setTimeout(() => {
      if (window.alchemyFlask && window.alchemyFlask.createParticles) {
        window.alchemyFlask.createParticles(ingredient.color);
      }
    }, 100);
    
    // Анимация добавления
    if (cauldronRef.current) {
      anime({
        targets: cauldronRef.current,
        scale: [1, 1.05, 1],
        duration: 300,
        easing: 'easeOutQuad'
      });
    }
  };

  const startHeating = () => {
    if (selectedIngredients.length === 0) {
      setHint('Сначала добавьте ингредиенты!');
      return;
    }
    
    setBrewingStage('heating');
    setIsHeating(true);
    setHint('Нагреваем зелье...');
    
    // Анимация пламени
    if (flameRef.current) {
      anime({
        targets: flameRef.current,
        opacity: [0, 1],
        scale: [0.8, 1.2],
        duration: 500,
        easing: 'easeOutQuad'
      });
    }
  };

  const stopHeating = () => {
    setIsHeating(false);
    setBrewingStage('mixing');
    setHint('Размешайте зелье!');
    
    if (flameRef.current) {
      anime({
        targets: flameRef.current,
        opacity: [1, 0],
        scale: [1.2, 0.8],
        duration: 500,
        easing: 'easeOutQuad'
      });
    }
  };

  const mixPotion = () => {
    setBrewingStage('complete');
    setHint('Зелье готово!');
    
    // Анимация смешивания
    if (liquidRef.current) {
      anime({
        targets: liquidRef.current,
        rotate: [0, 360],
        scale: [1, 1.1, 1],
        duration: 1000,
        easing: 'easeInOutQuad'
      });
    }
    
    // Рассчитываем качество зелья
    const optimalTemp = selectedIngredients.reduce((sum, ing) => {
      const ingredient = ingredients.find(i => i.id.startsWith(ing.id.split('_')[0]));
      return sum + (ingredient?.temp || 60);
    }, 0) / selectedIngredients.length;
    
    const tempDiff = Math.abs(temperature - optimalTemp);
    const quality = Math.max(0.5, 1 - tempDiff / 100);
    const reward = energyReward * quality * selectedIngredients.length;
    
    // Создаём зелье для инвентаря
    const potion = {
      id: Date.now(),
      name: `Зелье ${selectedIngredients.map(i => i.name.split(' ')[0]).join('-')}`,
      color: potionColor,
      quality: Math.round(quality * 100),
      ingredients: selectedIngredients.map(i => i.name),
      effect: selectedIngredients[0]?.effect || 'unknown'
    };
    
    setTimeout(() => {
      if (onBrew) onBrew(reward);
      if (onAddPotion) onAddPotion(potion);
    }, 1000);
  };

  const resetLab = () => {
    setSelectedIngredients([]);
    setTemperature(20);
    setIsHeating(false);
    setBrewingStage('selecting');
    setPotionColor('#3C2F4F');
    setBubbles([]);
    setHint('Выберите ингредиенты для зелья');
  };

  return (
    <div className="fullscreen-overlay">
      <div className="fullscreen-alchemy">
        <div className="mini-header">
          <GenerativeIcon name="potion" size={20} />
          <span>Алхимическая лаборатория</span>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="alchemy-body">
          {/* Левая панель - ингредиенты */}
          <div className="ingredients-panel">
            <h4>🧪 Ингредиенты</h4>
            <div className="ingredients-grid">
              {ingredients.map(ingredient => (
                <button 
                  key={ingredient.id} 
                  className="ingredient-bottle enhanced"
                  onClick={() => addIngredient(ingredient)}
                  disabled={brewingStage !== 'selecting'}
                  style={{ '--ingredient-color': ingredient.color }}
                >
                  <div 
                    className="bottle-liquid" 
                    style={{ backgroundColor: ingredient.color }}
                  />
                  <div className="bottle-label">{ingredient.name}</div>
                  <div className="bottle-temp">{ingredient.temp}°C</div>
                  <div className="bottle-glow" />
                </button>
              ))}
            </div>
            
            <div className="selected-ingredients-list">
              <h5>В колбе:</h5>
              {selectedIngredients.map((ing, i) => (
                <div key={i} className="ingredient-chip" style={{ background: ing.color }}>
                  {ing.name}
                </div>
              ))}
            </div>
          </div>

          {/* Центр - анимированная колба */}
          <div className="flask-area">
            <AlchemyFlask 
              liquidColor={potionColor}
              temperature={temperature}
              isHeating={isHeating}
              liquidLevel={selectedIngredients.length > 0 ? 0.5 + (selectedIngredients.length * 0.1) : 0.3}
              bubbleIntensity={isHeating ? Math.min(1, (temperature - 60) / 100) : 0}
            />
            
            {/* Пламя под колбой */}
            <div className="flame-base" ref={flameRef} style={{ opacity: isHeating ? 1 : 0 }}>
              🔥🔥🔥
            </div>
          </div>

          {/* Правая панель - управление */}
          <div className="control-panel">
            <h4>⚗️ Управление</h4>
            
            {/* Индикатор стадии */}
            <div className="brewing-stage-indicator">
              <div className={`stage ${brewingStage === 'selecting' ? 'active' : ''}`}>
                1. Выбор ингредиентов
              </div>
              <div className={`stage ${brewingStage === 'heating' ? 'active' : ''}`}>
                2. Нагрев
              </div>
              <div className={`stage ${brewingStage === 'mixing' ? 'active' : ''}`}>
                3. Смешивание
              </div>
              <div className={`stage ${brewingStage === 'complete' ? 'active' : ''}`}>
                4. Готово!
              </div>
            </div>
            
            {/* Кнопки управления */}
            <div className="brewing-controls">
              {brewingStage === 'selecting' && selectedIngredients.length > 0 && (
                <button className="brew-btn primary" onClick={startHeating}>
                  🔥 Начать варку
                </button>
              )}
              
              {brewingStage === 'heating' && (
                <div className="heating-controls">
                  <button className="brew-btn" onClick={stopHeating}>
                    ❄️ Остановить нагрев
                  </button>
                  <div className="temp-info">
                    Температура: {Math.round(temperature)}°C
                    <div className="optimal-temp">
                      Оптимально: {selectedIngredients.length > 0 ? 
                        Math.round(selectedIngredients.reduce((sum, ing) => sum + ing.temp, 0) / selectedIngredients.length) : 0}°C
                    </div>
                  </div>
                </div>
              )}
              
              {brewingStage === 'mixing' && (
                <button className="brew-btn primary" onClick={mixPotion}>
                  🥄 Размешать зелье
                </button>
              )}
              
              {brewingStage === 'complete' && (
                <button className="brew-btn" onClick={resetLab}>
                  ✨ Новое зелье
                </button>
              )}
            </div>

            <div className="alchemy-hint">{hint}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AlchemyLab);
