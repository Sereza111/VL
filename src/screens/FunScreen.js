import React, { useState, useEffect, useRef } from 'react';
import './FunScreen.css';

// Mystical Wheel of Fortune Prizes
const wheelPrizes = [
  { 
    id: 1, 
    text: 'ARCANUM', 
    type: 'item', 
    value: 1, 
    color: '#1C1C1C', 
    symbol: '☥',
    description: 'Ancient Sigil of Wisdom',
    item: {
      name: 'Arcanum Sigil',
      type: 'artifact',
      rarity: 'rare',
      effect: 'Reveals hidden knowledge',
      image: '/assets/items/arcanum-sigil.svg'
    }
  },
  { 
    id: 2, 
    text: 'UMBRA', 
    type: 'item', 
    value: 1, 
    color: '#121212', 
    symbol: '☾',
    description: 'Shadow Essence',
    item: {
      name: 'Shadow Essence',
      type: 'consumable',
      rarity: 'epic',
      effect: 'Grants vision in darkness',
      image: '/assets/items/shadow-essence.svg'
    }
  },
  { 
    id: 3, 
    text: 'LUMEN', 
    type: 'item', 
    value: 1, 
    color: '#0A0A0A', 
    symbol: '✧',
    description: 'Radiant Crystal',
    item: {
      name: 'Luminous Crystal',
      type: 'artifact',
      rarity: 'legendary',
      effect: 'Illuminates the path ahead',
      image: '/assets/items/luminous-crystal.svg'
    }
  },
  { 
    id: 4, 
    text: 'FATUM', 
    type: 'negative', 
    value: -50, 
    color: '#333333', 
    symbol: '☿',
    description: 'Fate\'s Curse',
    item: null
  },
  { 
    id: 5, 
    text: 'TEMPUS', 
    type: 'item', 
    value: 1, 
    color: '#111111', 
    symbol: '⌛',
    description: 'Temporal Shard',
    item: {
      name: 'Time Fragment',
      type: 'artifact',
      rarity: 'rare',
      effect: 'Glimpse into possible futures',
      image: '/assets/items/time-fragment.svg'
    }
  },
  { 
    id: 6, 
    text: 'SPIRITUS', 
    type: 'item', 
    value: 1, 
    color: '#1A1A1A', 
    symbol: '✿',
    description: 'Spirit Essence',
    item: {
      name: 'Spirit Vessel',
      type: 'consumable',
      rarity: 'epic',
      effect: 'Commune with spirits',
      image: '/assets/items/spirit-vessel.svg'
    }
  },
  { 
    id: 7, 
    text: 'NATURA', 
    type: 'item', 
    value: 1, 
    color: '#000000', 
    symbol: '☘',
    description: 'Nature\'s Whisper',
    item: {
      name: 'Verdant Seed',
      type: 'artifact',
      rarity: 'legendary',
      effect: 'Harness natural forces',
      image: '/assets/items/verdant-seed.svg'
    }
  },
  { 
    id: 8, 
    text: 'TENEBRIS', 
    type: 'negative', 
    value: -100, 
    color: '#444444', 
    symbol: '☄',
    description: 'Dark Omen',
    item: null
  },
  { 
    id: 9, 
    text: 'AETHER', 
    type: 'item', 
    value: 1, 
    color: '#0F0F0F', 
    symbol: '✴',
    description: 'Ethereal Fragment',
    item: {
      name: 'Aether Prism',
      type: 'artifact',
      rarity: 'rare',
      effect: 'Transcend physical boundaries',
      image: '/assets/items/aether-prism.svg'
    }
  },
  { 
    id: 10, 
    text: 'MYSTERIUM', 
    type: 'jackpot', 
    value: 500, 
    color: '#000000', 
    symbol: '✧',
    description: 'Ultimate Revelation',
    item: {
      name: 'Mysterium Codex',
      type: 'legendary',
      rarity: 'mythic',
      effect: 'Unlock forbidden knowledge',
      image: '/assets/items/mysterium-codex.svg'
    }
  }
];

const FunScreen = ({ balance: initialBalance, onPlay }) => {
  // Convert balance to number
  const balance = parseFloat(initialBalance);
  
  // State variables
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [winnings, setWinnings] = useState(0);
  const [history, setHistory] = useState([]);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [lastSpinTime, setLastSpinTime] = useState(() => {
    const saved = localStorage.getItem('lastWheelSpin');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [timeRemaining, setTimeRemaining] = useState('');
  const [showPrizeAnimation, setShowPrizeAnimation] = useState(false);
  const [currentPrize, setCurrentPrize] = useState(null);
  const [animationPhase, setAnimationPhase] = useState('idle');
  const [energyLevel, setEnergyLevel] = useState(0);
  
  // References
  const wheelRef = useRef(null);
  const markerRef = useRef(null);
  const sphinxRef = useRef(null);
  const demonRef = useRef(null);
  const anubisRef = useRef(null);
  const fallingRef = useRef(null);
  const boatRef = useRef(null);
  const snakesRef = useRef(null);
  const caduceusRef = useRef(null);
  const lightningRef = useRef(null);
  const energyCircleRef = useRef(null);

  // Check if spin is available (once every 24 hours)
  const canSpin = () => {
    const now = Date.now();
    const hoursSinceLastSpin = (now - lastSpinTime) / (1000 * 60 * 60);
    return hoursSinceLastSpin >= 24 || true; // Temporarily always allow spinning for testing
  };
  
  // Update countdown timer
  useEffect(() => {
    if (!canSpin()) {
      const timer = setInterval(() => {
        const now = Date.now();
        const timeDiff = (lastSpinTime + 24 * 60 * 60 * 1000) - now;
        
        if (timeDiff <= 0) {
          setTimeRemaining('');
          clearInterval(timer);
          return;
        }
        
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        
        setTimeRemaining(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [lastSpinTime]);

  // Energy buildup effect
  useEffect(() => {
    if (animationPhase === 'energy') {
      const energyInterval = setInterval(() => {
        setEnergyLevel(prev => {
          if (prev >= 100) {
            clearInterval(energyInterval);
            setAnimationPhase('spin');
            return 100;
          }
          return prev + 2;
        });
      }, 50);
      
      return () => clearInterval(energyInterval);
    }
  }, [animationPhase]);

  // Animation effect for the occult creatures
  useEffect(() => {
    if (animationPhase === 'spin') {
      const sphinxAnimation = setTimeout(() => {
        if (sphinxRef.current) {
          sphinxRef.current.classList.add('animate-sphinx');
        }
      }, 500);
      
      const demonAnimation = setTimeout(() => {
        if (demonRef.current) {
          demonRef.current.classList.add('animate-demon');
        }
      }, 1000);
      
      const anubisAnimation = setTimeout(() => {
        if (anubisRef.current) {
          anubisRef.current.classList.add('animate-anubis');
        }
      }, 1500);
      
      const fallingAnimation = setTimeout(() => {
        if (fallingRef.current) {
          fallingRef.current.classList.add('animate-falling');
        }
      }, 2000);
      
      const boatAnimation = setTimeout(() => {
        if (boatRef.current) {
          boatRef.current.classList.add('animate-boat');
        }
      }, 2500);
      
      if (snakesRef.current) {
        snakesRef.current.classList.add('animate-snakes');
      }
      
      return () => {
        clearTimeout(sphinxAnimation);
        clearTimeout(demonAnimation);
        clearTimeout(anubisAnimation);
        clearTimeout(fallingAnimation);
        clearTimeout(boatAnimation);
        
        if (sphinxRef.current) {
          sphinxRef.current.classList.remove('animate-sphinx');
        }
        if (demonRef.current) {
          demonRef.current.classList.remove('animate-demon');
        }
        if (anubisRef.current) {
          anubisRef.current.classList.remove('animate-anubis');
        }
        if (fallingRef.current) {
          fallingRef.current.classList.remove('animate-falling');
        }
        if (boatRef.current) {
          boatRef.current.classList.remove('animate-boat');
        }
        if (snakesRef.current) {
          snakesRef.current.classList.remove('animate-snakes');
        }
      };
    }
  }, [animationPhase]);
  
  // Lightning effect during energy buildup
  useEffect(() => {
    if (animationPhase === 'energy' && lightningRef.current) {
      const lightningInterval = setInterval(() => {
        lightningRef.current.classList.add('lightning-flash');
        
        setTimeout(() => {
          if (lightningRef.current) {
            lightningRef.current.classList.remove('lightning-flash');
          }
        }, 200);
      }, 500);
      
      return () => clearInterval(lightningInterval);
    }
  }, [animationPhase]);
  
  // Start the energy buildup phase
  const startEnergyPhase = () => {
    if (spinning || !canSpin()) return;
    
    setAnimationPhase('energy');
    setEnergyLevel(0);
    
    // Play mystical sound
    const audio = new Audio('/assets/sounds/energy-buildup.mp3');
    audio.volume = 0.5;
    audio.play().catch(e => console.log('Audio play failed:', e));
    
    // Shake the caduceus
    if (caduceusRef.current) {
      caduceusRef.current.classList.add('shake-caduceus');
    }
  };
  
  // Spin the wheel
  const spinWheel = () => {
    if (spinning || animationPhase !== 'spin') return;
    
    setSpinning(true);
    setResult(null);
    setShowPrizeAnimation(false);
    
    // Play wheel spinning sound
    const audio = new Audio('/assets/sounds/wheel-spin.mp3');
    audio.volume = 0.5;
    audio.play().catch(e => console.log('Audio play failed:', e));
    
    // Save last spin time
    const now = Date.now();
    setLastSpinTime(now);
    localStorage.setItem('lastWheelSpin', now.toString());
    
    // Determine random prize
    const randomIndex = Math.floor(Math.random() * wheelPrizes.length);
    const prize = wheelPrizes[randomIndex];
    
    // Calculate rotation angle (each sector = 360 / number of prizes degrees)
    const sectorAngle = 360 / wheelPrizes.length;
    // Add 10 full rotations + angle to the selected prize
    // For top pointer, add half sector
    const targetRotation = 10 * 360 + (randomIndex * sectorAngle) + sectorAngle / 2;
    
    // Animate rotation
    setWheelRotation(targetRotation);
    
    // After rotation animation ends
    setTimeout(() => {
      setSpinning(false);
      setAnimationPhase('result');
      setCurrentPrize(prize);
      
      // Play result sound based on prize type
      let resultSound;
      if (prize.type === 'jackpot') {
        resultSound = new Audio('/assets/sounds/jackpot.mp3');
      } else if (prize.type === 'negative') {
        resultSound = new Audio('/assets/sounds/negative.mp3');
      } else {
        resultSound = new Audio('/assets/sounds/win.mp3');
      }
      resultSound.volume = 0.5;
      resultSound.play().catch(e => console.log('Audio play failed:', e));
      
      // Update history
      const newHistoryItem = {
        id: Date.now(),
        prize: prize,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setHistory(prev => [newHistoryItem, ...prev].slice(0, 10));
      setWinnings(prize.value);
      
      // Apply result
      if (prize.type === 'coins' || prize.type === 'negative' || prize.type === 'jackpot') {
        onPlay(prize.value);
      }
      
      // Show result
      const resultText = prize.type === 'jackpot' 
        ? `ДЖЕКПОТ! +${prize.value} VL!` 
        : prize.type === 'exp'
          ? `+${prize.value} XP!`
          : prize.type === 'negative'
            ? `${prize.value} VL`
            : `+${prize.value} VL!`;
            
      setResult({
        text: resultText,
        win: prize.type !== 'negative'
      });
      
      // Show prize animation after a short delay
      setTimeout(() => {
        setShowPrizeAnimation(true);
      }, 1000);
    }, 8000); // Longer rotation animation duration
  };

  // Обновленные классы и структура компонента
  const renderWheel = () => {
    return (
      <div className="tarot-wheel-container">
        {/* Энергетические эффекты */}
        <div 
          className={`tarot-energy ${animationPhase === 'energy' ? 'active' : ''}`}
          style={{ opacity: animationPhase === 'energy' ? energyLevel / 100 : 0 }}
        ></div>

        {/* Таро символы */}
        <div className="tarot-symbols">
          {['☉', '☽', '♄', '♅', '♆', '♇'].map((symbol, index) => (
            <div 
              key={index} 
              className="tarot-symbol" 
              style={{ 
                top: `${Math.random() * 100}%`, 
                left: `${Math.random() * 100}%`,
                opacity: animationPhase === 'energy' ? 0.5 : 0
              }}
            >
              {symbol}
            </div>
          ))}
        </div>

        {/* Фигуры вокруг колеса */}
        <div className="wheel-figures">
          <div className="figure figure-sphinx"></div>
          <div className="figure figure-rising"></div>
          <div className="figure figure-falling"></div>
          <div className="figure figure-king"></div>
        </div>

        {/* Колесо */}
        <div 
          ref={wheelRef}
          className="tarot-wheel" 
          style={{ transform: `rotate(${wheelRotation}deg)` }}
        >
          {wheelPrizes.map((prize, index) => {
            const angle = (index * 360) / wheelPrizes.length;
            return (
              <div 
                key={prize.id}
                className="wheel-sector"
                style={{ transform: `rotate(${angle}deg)` }}
              >
                <span className="wheel-sector-symbol">{prize.symbol}</span>
                <span className="wheel-sector-text">{prize.text}</span>
              </div>
            );
          })}

          {/* Спицы */}
          <div className="center-spokes">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
              <div key={num} className={`center-spoke spoke-${num}`}></div>
            ))}
          </div>

          {/* Центр колеса */}
          <div className="wheel-center">X</div>
        </div>

        {/* Маркер */}
        <div ref={markerRef} className="wheel-marker" />

        {/* Ось с кадуцеем */}
        <div ref={caduceusRef} className="caduceus-staff">
          <div className="snake-decoration">
            <div className="snake-left"></div>
            <div className="snake-right"></div>
          </div>
        </div>

        {/* Уровни призов */}
        <div className="prize-levels">
          {[
            { icon: '🏆', name: 'Джекпот', value: '500 VL' },
            { icon: '💎', name: 'Редкий', value: '100 VL' },
            { icon: '🌟', name: 'Эпический', value: '50 VL' },
            { icon: '✨', name: 'Легендарный', value: '200 VL' },
            { icon: '🔮', name: 'Мистический', value: '250 VL' }
          ].map((level, index) => (
            <div key={index} className="prize-level">
              <div className="prize-icon">{level.icon}</div>
              <div className="prize-name">{level.name}</div>
              <div className="prize-value">{level.value}</div>
            </div>
          ))}
        </div>

        {/* Контейнер для кнопок управления */}
        {(animationPhase === 'idle' || (animationPhase === 'energy' && energyLevel >= 100)) && (
          <div className="wheel-controls">
            {animationPhase === 'idle' && (
              <button 
                className="tarot-button"
                onClick={startEnergyPhase}
                disabled={spinning || !canSpin()}
              >
                {timeRemaining ? `Доступно через ${timeRemaining}` : 'Зарядить'}
              </button>
            )}

            {animationPhase === 'energy' && energyLevel >= 100 && (
              <button 
                className="tarot-button"
                onClick={spinWheel}
              >
                Крутить
              </button>
            )}
          </div>
        )}
        
        {/* Результат */}
        {result && (
          <div className={`tarot-result ${result.win ? 'show' : ''} ${currentPrize?.type === 'jackpot' ? 'jackpot' : ''}`}>
            {result.text}
          </div>
        )}
      </div>
    );
  };

  // Render prize modal
  const renderPrizeModal = () => {
    if (!showPrizeAnimation || !currentPrize) return null;

    return (
      <div className={`prize-animation ${currentPrize.type === 'jackpot' ? 'jackpot' : ''}`}>
        <h3 className="prize-title">{currentPrize.text}</h3>
        <p className="prize-description">{currentPrize.description}</p>
        
        {currentPrize.item && (
          <div className="prize-item-display">
            <div className="prize-item-image">
              <img 
                src={currentPrize.item.image} 
                alt={currentPrize.item.name}
                onError={(e) => {
                  e.target.src = '/assets/items/item-placeholder.svg';
                }}
              />
            </div>
            <div className="prize-item-details">
              <h4>{currentPrize.item.name}</h4>
              <p className={`item-rarity ${currentPrize.item.rarity}`}>
                {currentPrize.item.rarity}
              </p>
              <p className="item-effect">{currentPrize.item.effect}</p>
            </div>
          </div>
        )}
        
        <button 
          className="collect-button"
          onClick={() => {
            setShowPrizeAnimation(false);
            setAnimationPhase('idle');
          }}
        >
          Принять дар судьбы
        </button>
      </div>
    );
  };

  return (
    <div className="fun-screen mystical-theme">
      <h2 className="mystical-title">Колесо Судьбы</h2>
      
      {renderWheel()}
      
      {renderPrizeModal()}
    </div>
  );
};

export default FunScreen; 