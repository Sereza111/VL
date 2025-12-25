// src/screens/ShopScreen.js - Мистическая версия
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FaCoins, FaArrowUp, FaShoppingCart, FaSearch, FaFilter, FaInfoCircle } from 'react-icons/fa';
import anime from 'animejs/lib/anime.js';
import './ShopScreen.css';

// Цветовая палитра из требований
const COLOR_PALETTE = {
  darkPurple: '#3C2F4F',    // Тёмно-фиолетовый — основной фон
  beigeParchment: '#E8D3A9', // Бежево-пергаментный — текст, акценты
  darkTurquoise: '#1A3C34',  // Тёмный бирюзовый — светлячки, свечение
  inkyBlue: '#1B263B',       // Чернильный синий — тени, контуры
  moonBlue: '#A8C7FA',       // Голубоватый оттенок луны
};

// Предметы магазина с улучшенными описаниями и эффектами - вынесены за пределы компонента
// чтобы избежать пересоздания при каждом рендере
const SHOP_ITEMS = [
  { 
    id: 1, 
    name: "Кристалл Добычи", 
    description: "Древний кристалл, настроенный на резонанс с энергетическими потоками. Позволяет извлекать мистическую энергию из эфира.",
    price: 100,
    income: 0.5,
    icon: "💎",
    type: "miners",
    effect: "Генерирует 0.5 VL/час"
  },
  { 
    id: 2, 
    name: "Алхимическая Ферма", 
    description: "Комплекс алхимических устройств для сбора и преобразования энергии. Включает в себя астролябию, атанор и философский камень.",
    price: 500,
    income: 2.5,
    icon: "⚗️",
    type: "farms",
    effect: "Генерирует 2.5 VL/час"
  },
  { 
    id: 3, 
    name: "Эзотерический Бизнес", 
    description: "Торговая гильдия, специализирующаяся на редких мистических артефактах и знаниях. Приносит стабильный доход от продажи тайных манускриптов.",
    price: 2000,
    income: 10,
    icon: "📜",
    type: "business",
    effect: "Генерирует 10 VL/час"
  },
  { 
    id: 4, 
    name: "Астральная Обсерватория", 
    description: "Мощная обсерватория для наблюдения за космическими энергетическими потоками. Позволяет собирать энергию звёзд и планет.",
    price: 10000,
    income: 50,
    icon: "🔭",
    type: "business",
    effect: "Генерирует 50 VL/час"
  },
  { 
    id: 5, 
    name: "Эфирный Конденсатор", 
    description: "Устройство для сбора эфирной энергии из окружающего пространства. Работает на принципах квантовой механики и древней магии.",
    price: 300,
    income: 1.5,
    icon: "⚡",
    type: "miners",
    effect: "Генерирует 1.5 VL/час"
  },
  { 
    id: 6, 
    name: "Сад Мистических Растений", 
    description: "Сад с редкими растениями, обладающими магическими свойствами. Их плоды и эссенции высоко ценятся алхимиками.",
    price: 800,
    income: 4.0,
    icon: "🌿",
    type: "farms",
    effect: "Генерирует 4.0 VL/час"
  },
  { 
    id: 7, 
    name: "Лавка Оккультных Товаров", 
    description: "Магазин, торгующий редкими компонентами для ритуалов и заклинаний. Привлекает клиентов со всех уголков мистического мира.",
    price: 5000,
    income: 25,
    icon: "🏪",
    type: "business",
    effect: "Генерирует 25 VL/час"
  },
  { 
    id: 8, 
    name: "Кристаллическая Шахта", 
    description: "Древняя шахта, где добываются кристаллы, наполненные чистой энергией. Каждый кристалл - источник стабильного дохода.",
    price: 1500,
    income: 7.5,
    icon: "⛏️",
    type: "miners",
    effect: "Генерирует 7.5 VL/час"
  }
];

const ShopScreen = ({ items, balance: initialBalance, onBuy }) => {
  // Преобразуем balance в число
  const balance = parseFloat(initialBalance);
  
  // Состояния
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'miners', 'farms', 'business'
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filteredItems, setFilteredItems] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Refs
  const containerRef = useRef(null);
  const particlesRef = useRef([]);
  const shopItemsRef = useRef(null);
  const animationsInitialized = useRef(false);
  
  // Нормализуем ID предметов пользователя для сравнения - мемоизируем для предотвращения лишних вычислений
  const normalizedUserItems = useMemo(() => {
    return items.map(item => ({
      ...item,
      id: typeof item.id === 'string' && !isNaN(parseInt(item.id)) ? parseInt(item.id) : item.id
    }));
  }, [items]);
  
  // Расчет общего дохода - мемоизируем для предотвращения лишних вычислений
  const totalIncome = useMemo(() => {
    return items.reduce((sum, item) => {
      // Для предметов из БД используем income_per_hour, для предметов из ShopScreen используем income
      const income = item.income_per_hour || item.income || 0;
      return sum + (parseFloat(income) * (item.quantity || 1));
    }, 0);
  }, [items]);
  
  // Эффект для создания мистических частиц - выполняется только один раз при монтировании
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Создаем частицы
    const createParticles = () => {
      const container = containerRef.current;
      const particles = [];
      
      // Создаем новые частицы
      for (let i = 0; i < 15; i++) {
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
    
    createParticles();
    
    // Очистка при размонтировании
    return () => {
      particlesRef.current.forEach(particle => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      });
    };
  }, []);
  
  // Эффект для фильтрации предметов - запускается только при изменении зависимостей
  useEffect(() => {
    let filtered = [...SHOP_ITEMS];
    
    // Фильтрация по поисковому запросу
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) || 
        item.description.toLowerCase().includes(query) ||
        item.effect.toLowerCase().includes(query)
      );
    }
    
    // Фильтрация по типу
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType);
    }
    
    setFilteredItems(filtered);
    setIsInitialized(true);
  }, [searchQuery, filterType]);
  
  // Эффект для анимации появления предметов - запускается только один раз после первой фильтрации
  useEffect(() => {
    if (isInitialized && shopItemsRef.current && !animationsInitialized.current) {
      anime({
        targets: '.shop-item',
        opacity: [0, 1],
        translateY: [20, 0],
        delay: anime.stagger(50),
        easing: 'easeOutQuad',
        duration: 500
      });
      animationsInitialized.current = true;
    }
  }, [isInitialized]);
  
  // Функция для создания эффекта свечения при наведении
  const handleMouseEnter = (e) => {
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
  };
  
  // Функция для удаления эффекта свечения при уходе мыши
  const handleMouseLeave = (e) => {
    anime({
      targets: e.currentTarget,
      boxShadow: '0 0 5px rgba(232, 211, 169, 0.3)',
      scale: 1,
      easing: 'easeOutQuad',
      duration: 300
    });
  };
  
  // Функция для отображения деталей предмета
  const showItemDetails = (item) => {
    setSelectedItem(item);
    setShowDetails(true);
    
    // Анимация появления деталей
    setTimeout(() => {
      anime({
        targets: '.item-details',
        opacity: [0, 1],
        translateY: [20, 0],
        easing: 'easeOutQuad',
        duration: 300
      });
    }, 10);
  };
  
  // Функция для закрытия деталей предмета
  const closeItemDetails = () => {
    // Анимация исчезновения деталей
    anime({
      targets: '.item-details',
      opacity: [1, 0],
      translateY: [0, 20],
      easing: 'easeOutQuad',
      duration: 300,
      complete: () => {
        setShowDetails(false);
        setSelectedItem(null);
      }
    });
  };
  
  // Функция для покупки предмета
  const handleBuyItem = (item) => {
    // Проверяем, хватает ли средств
    if (balance < item.price) {
      // Анимация "недостаточно средств"
      anime({
        targets: '.item-price',
        translateX: [0, -5, 5, -5, 5, 0],
        duration: 500,
        easing: 'easeInOutQuad'
      });
      return;
    }
    
    // Вызываем функцию покупки
    if (typeof onBuy === 'function') {
      onBuy(item);
      
      // Анимация успешной покупки
      anime({
        targets: '.item-details',
        scale: [1, 1.05, 1],
        backgroundColor: [
          'rgba(27, 38, 59, 0.9)',
          'rgba(26, 60, 52, 0.9)',
          'rgba(27, 38, 59, 0.9)'
        ],
        duration: 1000,
        easing: 'easeInOutQuad'
      });
      
      // Закрываем детали после покупки
      setTimeout(() => {
        closeItemDetails();
      }, 1000);
    }
  };
  
  // Мемоизированный рендер списка предметов для предотвращения лишних перерисовок
  const renderShopItems = useMemo(() => {
    if (filteredItems.length === 0) {
      return (
        <div className="no-items">
          <FaInfoCircle />
          <p>Нет предметов, соответствующих поиску</p>
          <p>Попробуйте изменить параметры фильтрации</p>
        </div>
      );
    }
    
    return filteredItems.map(item => {
      // Находим предмет у пользователя с учетом возможных разных форматов ID
      const userItem = normalizedUserItems.find(i => 
        i.id === item.id || 
        (typeof i.id === 'string' && typeof item.id === 'number' && parseInt(i.id) === item.id) ||
        (typeof i.id === 'number' && typeof item.id === 'string' && i.id === parseInt(item.id))
      );
      
      const owned = userItem ? userItem.quantity || 0 : 0;
      const canAfford = balance >= item.price;
      const ownedText = owned > 0 ? `(${owned})` : '';
      
      return (
        <div 
          key={item.id} 
          className={`shop-item ${!canAfford ? 'disabled' : ''}`}
          onClick={() => showItemDetails(item)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="item-icon">{item.icon}</div>
          <div className="item-info">
            <h3>{item.name} {ownedText}</h3>
            <div className="item-effect">{item.effect}</div>
            <div className="item-price">
              <FaCoins className="coin-icon" /> {item.price} VL
            </div>
          </div>
          <div 
            className={`item-badge ${!canAfford ? 'locked' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (canAfford) handleBuyItem(item);
            }}
          >
            {canAfford ? 'Купить' : 'Недостаточно'}
          </div>
        </div>
      );
    });
  }, [filteredItems, normalizedUserItems, balance]);
  
  return (
    <div className="shop-screen" ref={containerRef}>
      {/* Мистический фон с частицами */}
      <div className="mystical-overlay"></div>
      
      {/* Заголовок экрана */}
      <div className="shop-header">
        <h2><FaShoppingCart /> Магический Базар</h2>
      </div>
      
      {/* Информация о доходе */}
      <div className="income-card">
        <div className="income-header">
          <FaArrowUp className="icon" />
          <h3>Ваш пассивный доход</h3>
        </div>
        <div className="income-value">+{totalIncome.toFixed(2)} VL/час</div>
        <p>Мистические предметы приносят доход даже когда вы не в сети</p>
      </div>
      
      {/* Панель поиска и фильтрации */}
      <div className="shop-controls">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Поиск предметов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-container">
          <div className="filter-label">
            <FaFilter /> Фильтр:
          </div>
          <div className="filter-options">
            <button 
              className={`filter-button ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              Все
            </button>
            <button 
              className={`filter-button ${filterType === 'miners' ? 'active' : ''}`}
              onClick={() => setFilterType('miners')}
            >
              Добыча
            </button>
            <button 
              className={`filter-button ${filterType === 'farms' ? 'active' : ''}`}
              onClick={() => setFilterType('farms')}
            >
              Фермы
            </button>
            <button 
              className={`filter-button ${filterType === 'business' ? 'active' : ''}`}
              onClick={() => setFilterType('business')}
            >
              Бизнес
            </button>
          </div>
        </div>
      </div>
      
      {/* Список предметов */}
      <div className="shop-items" ref={shopItemsRef}>
        {renderShopItems}
      </div>
      
      {/* Информация о магазине */}
      <div className="shop-info">
        <h3>Как это работает?</h3>
        <ul>
          <li>• Мистические предметы генерируют VL 24/7, даже когда вы не в сети</li>
          <li>• Доход начисляется автоматически при следующем входе</li>
          <li>• Более редкие предметы приносят больше дохода</li>
          <li>• Можно приобретать несколько экземпляров одного предмета</li>
        </ul>
      </div>
      
      {/* Детали предмета */}
      {showDetails && selectedItem && (
        <div className="item-details-overlay" onClick={closeItemDetails}>
          <div className="item-details" onClick={e => e.stopPropagation()}>
            <div className="item-details-header">
              <div className="item-details-icon">{selectedItem.icon}</div>
              <h3>{selectedItem.name}</h3>
              <button className="close-details-btn" onClick={closeItemDetails}>✕</button>
            </div>
            
            <div className="item-details-content">
              <div className="item-details-description">
                <p>{selectedItem.description}</p>
              </div>
              
              <div className="item-details-info">
                <div className="item-details-row">
                  <span className="detail-label">Тип:</span>
                  <span className="detail-value">
                    {selectedItem.type === 'miners' ? 'Добыча' : 
                     selectedItem.type === 'farms' ? 'Ферма' : 
                     selectedItem.type === 'business' ? 'Бизнес' : 'Предмет'}
                  </span>
                </div>
                <div className="item-details-row">
                  <span className="detail-label">Доход:</span>
                  <span className="detail-value">{selectedItem.income} VL/час</span>
                </div>
                <div className="item-details-row">
                  <span className="detail-label">Окупаемость:</span>
                  <span className="detail-value">
                    {Math.round(selectedItem.price / selectedItem.income)} часов
                  </span>
                </div>
              </div>
              
              <div className="item-details-actions">
                <div className="item-details-price">
                  <FaCoins /> {selectedItem.price} VL
                </div>
                <button 
                  className={`buy-item-btn ${balance < selectedItem.price ? 'disabled' : ''}`}
                  onClick={() => handleBuyItem(selectedItem)}
                  disabled={balance < selectedItem.price}
                >
                  {balance >= selectedItem.price ? 'Приобрести' : 'Недостаточно VL'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopScreen;