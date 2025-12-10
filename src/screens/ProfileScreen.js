// src/screens/ProfileScreen.js - Мистическая версия
import React, { useState, useEffect, useRef } from 'react';
import { 
  FaCrown, FaCoins, FaUserFriends, FaBoxOpen, FaCamera,
  FaScroll, FaMoon, FaFeatherAlt, FaBook, FaStar, FaGem
} from 'react-icons/fa';
import './ProfileScreen.css';
import { getUserByTelegramId } from '../services/userService';
import { getUserTasks } from '../services/taskService';
import anime from 'animejs/lib/anime.js';

// Цветовая палитра из требований
const COLOR_PALETTE = {
  darkPurple: '#3C2F4F',    // Тёмно-фиолетовый — основной фон
  beigeParchment: '#E8D3A9', // Бежево-пергаментный — текст, акценты
  darkTurquoise: '#1A3C34',  // Тёмный бирюзовый — светлячки, свечение
  inkyBlue: '#1B263B',       // Чернильный синий — тени, контуры
  moonBlue: '#A8C7FA',       // Голубоватый оттенок луны
};

// Форматирование ID пользователя
const formatUserId = (id) => {
  if (!id) return '000000';
  return String(id).padStart(6, '0');
};

const ProfileScreen = ({ 
  userData: propUserData,
  balance: initialBalance, 
  level, 
  exp, 
  nextLevelExp,
  items = [],
  onUpdate
}) => {
  // Преобразуем balance в число
  const balance = parseFloat(initialBalance);
  
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [userData, setUserData] = useState(propUserData || null);
  const [userTasks, setUserTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInventory, setShowInventory] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'achievements', 'inventory'
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  
  // Refs
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const particlesRef = useRef([]);
  const profileCardRef = useRef(null);
  const achievementsRef = useRef(null);
  const inventoryRef = useRef(null);
  
  // Добавляем inventory items из FunScreen или используем переданные items
  const inventoryItems = items.length > 0 ? items : [
    { 
      id: 'arcanum', 
      name: 'Мистическая Печать', 
      description: 'Древний символ - Увеличивает удачу на 10%', 
      rarity: 'rare',
      icon: '☥',
      quantity: 1
    },
    { 
      id: 'umbra', 
      name: 'Эссенция Теней', 
      description: 'Временная невидимость', 
      rarity: 'epic',
      icon: '☾',
      quantity: 2
    },
    { 
      id: 'lumen', 
      name: 'Светящийся Кристалл', 
      description: 'Раскрывает скрытые пути', 
      rarity: 'legendary',
      icon: '✧',
      quantity: 1
    }
  ];

  // Эффект для создания мистических частиц
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Создаем частицы
    const createParticles = () => {
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
  
  // Эффект для анимации при переключении вкладок
  useEffect(() => {
    const tabContent = document.querySelector(`.tab-content[data-tab="${activeTab}"]`);
    if (tabContent) {
      anime({
        targets: tabContent,
        opacity: [0, 1],
        translateY: [20, 0],
        easing: 'easeOutQuad',
        duration: 600
      });
    }
  }, [activeTab]);

  // Загрузка данных пользователя из базы данных
  useEffect(() => {
    const loadUserData = async () => {
      if (propUserData?.userId) {
        try {
          // Получаем данные пользователя из базы данных
          const user = await getUserByTelegramId(propUserData.userId);
          
          if (user) {
            setUserData(user);
            
            // Получаем задачи пользователя
            const tasks = await getUserTasks(user.id);
            setUserTasks(tasks);
          } else {
            console.warn('Пользователь не найден:', propUserData.userId);
          }
        } catch (error) {
          console.error('Ошибка при загрузке данных пользователя:', error);
        } finally {
          setLoading(false);
        }
      } else {
        console.warn('Отсутствует ID пользователя');
        setLoading(false);
      }
    };
    
    // Установим небольшую задержку для предотвращения слишком частых запросов
    const timer = setTimeout(() => {
      loadUserData();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [propUserData]);
  
  const formattedId = formatUserId(propUserData?.userId);
  
  // Прогресс уровня
  const progress = Math.min(100, (exp / nextLevelExp) * 100);
  
  // Округление XP до сотых
  const roundedExp = Math.round(exp * 100) / 100;
  const roundedNextLevelExp = Math.round(nextLevelExp * 100) / 100;

  // Количество выполненных задач
  const completedTasksCount = userTasks.filter(task => task.user_task_status === 'completed').length;

  // Проверка достижений
  const achievements = [
    {
      id: 'newbie',
      icon: '🥉',
      title: 'Неофит',
      description: 'Начните свой путь в мистическом мире',
      isCompleted: true,
      reward: '+10 XP'
    },
    {
      id: 'first_steps',
      icon: '💰',
      title: 'Первые шаги',
      description: 'Заработайте 100 VL',
      isCompleted: balance >= 100,
      reward: '+20 XP'
    },
    {
      id: 'social',
      icon: '👥',
      title: 'Мистический круг',
      description: 'Пригласите 5 союзников',
      isCompleted: (propUserData?.friends?.length || 0) >= 5,
      reward: '+50 XP, +50 VL'
    },
    {
      id: 'active',
      icon: '⭐',
      title: 'Адепт',
      description: 'Выполните все ежедневные ритуалы',
      isCompleted: completedTasksCount >= 3,
      reward: '+30 XP, +20 VL'
    },
    {
      id: 'champion',
      icon: '🏆',
      title: 'Мастер',
      description: 'Достигните 10 уровня',
      isCompleted: level >= 10,
      reward: '+100 XP, +100 VL'
    },
    {
      id: 'vl_master',
      icon: '👑',
      title: 'Архимаг',
      description: 'Накопите 10,000 VL',
      isCompleted: balance >= 10000,
      reward: '+500 XP, Особый предмет'
    }
  ];

  // Обработка загрузки фото
  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target.result;
        setAvatarUrl(imageUrl);
        
        // Анимация успешной загрузки
        anime({
          targets: '.user-avatar',
          scale: [1, 1.1, 1],
          borderColor: [
            COLOR_PALETTE.beigeParchment,
            COLOR_PALETTE.moonBlue,
            COLOR_PALETTE.beigeParchment
          ],
          boxShadow: [
            '0 0 10px rgba(232, 211, 169, 0.5)',
            '0 0 20px rgba(168, 199, 250, 0.8)',
            '0 0 10px rgba(232, 211, 169, 0.5)'
          ],
          easing: 'easeInOutQuad',
          duration: 1000
        });
        
        if (onUpdate) {
          onUpdate({ avatarUrl: imageUrl });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Открытие диалога выбора файла
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
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
  
  // Функция для переключения вкладок с анимацией
  const switchTab = (tab) => {
    // Анимация исчезновения текущей вкладки
    const currentTabContent = document.querySelector(`.tab-content[data-tab="${activeTab}"]`);
    if (currentTabContent) {
      anime({
        targets: currentTabContent,
        opacity: [1, 0],
        translateY: [0, 20],
        easing: 'easeOutQuad',
        duration: 300,
        complete: () => {
          setActiveTab(tab);
        }
      });
    } else {
      setActiveTab(tab);
    }
  };
  
  // Функция для отображения деталей достижения
  const showAchievementDetails = (achievement) => {
    setSelectedAchievement(achievement);
    
    // Анимация появления деталей
    anime({
      targets: '.achievement-details',
      opacity: [0, 1],
      translateY: [20, 0],
      easing: 'easeOutQuad',
      duration: 300
    });
  };
  
  // Функция для закрытия деталей достижения
  const closeAchievementDetails = () => {
    // Анимация исчезновения деталей
    anime({
      targets: '.achievement-details',
      opacity: [1, 0],
      translateY: [0, 20],
      easing: 'easeOutQuad',
      duration: 300,
      complete: () => {
        setSelectedAchievement(null);
      }
    });
  };
  
  if (loading) {
    return (
      <div className="mystical-loading-container">
        <div className="mystical-loading-spinner"></div>
        <p className="mystical-loading-text">Открываем книгу судьбы...</p>
      </div>
    );
  }
  
  return (
    <div className="profile-screen" ref={containerRef}>
      {/* Мистический фон с частицами */}
      <div className="mystical-overlay"></div>
      
      {/* Заголовок экрана */}
      <div className="profile-header">
        <h2><FaScroll /> Книга Познания</h2>
      </div>
      
      {/* Вкладки */}
      <div className="mystical-tabs">
        <div 
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => switchTab('profile')}
        >
          <FaBook /> Профиль
        </div>
        <div 
          className={`tab ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => switchTab('achievements')}
        >
          <FaStar /> Достижения
        </div>
        <div 
          className={`tab ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => switchTab('inventory')}
        >
          <FaBoxOpen /> Артефакты
        </div>
      </div>
      
      {/* Содержимое вкладки "Профиль" */}
      <div className={`tab-content ${activeTab === 'profile' ? 'active' : ''}`} data-tab="profile" ref={profileCardRef}>
        <div className="mystical-profile-card">
          <div className="avatar-container">
            <div className="user-avatar" onClick={triggerFileInput}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Аватар" className="avatar-image" />
              ) : (
                <div className="avatar-initial">{userData?.first_name ? userData.first_name.charAt(0) : (propUserData?.userId ? propUserData.userId.charAt(0) : '?')}</div>
              )}
              <div className="avatar-overlay">
                <FaCamera className="camera-icon" />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden-input"
              />
              <div className="avatar-glow"></div>
            </div>
            <div className="user-info">
              <div className="user-name">{userData?.first_name || 'Мистик'} {userData?.last_name || ''}</div>
              <div className="user-id">ID: #{formattedId}</div>
              <div className="user-title">
                {level < 5 ? 'Неофит' : 
                 level < 10 ? 'Адепт' : 
                 level < 15 ? 'Мастер' : 
                 level < 20 ? 'Архимаг' : 'Верховный Маг'}
              </div>
            </div>
          </div>
          
          <div className="mystical-level-indicator">
            <div className="level-badge">
              <div className="level-value">{level}</div>
              <div className="level-label">уровень</div>
            </div>
            
            <div className="progress-container">
              <div className="progress-header">
                <span>Опыт познания</span>
                <span className="exp-value">{roundedExp.toFixed(2)} / {roundedNextLevelExp.toFixed(2)} XP</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="stats-grid">
            <div className="stat-card" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
              <div className="stat-icon">
                <FaCoins />
              </div>
              <div className="stat-content">
                <div className="stat-value">{balance.toFixed(2)}</div>
                <div className="stat-label">Баланс VL</div>
              </div>
            </div>
            
            <div className="stat-card" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
              <div className="stat-icon">
                <FaUserFriends />
              </div>
              <div className="stat-content">
                <div className="stat-value">{propUserData?.friends?.length || 0}</div>
                <div className="stat-label">Союзники</div>
              </div>
            </div>
            
            <div className="stat-card" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
              <div className="stat-icon">
                <FaGem />
              </div>
              <div className="stat-content">
                <div className="stat-value">{items.length}</div>
                <div className="stat-label">Артефакты</div>
              </div>
            </div>
          </div>
          
          {userTasks.length > 0 && (
            <div className="tasks-section">
              <h3><FaFeatherAlt /> Ежедневные ритуалы</h3>
              <div className="tasks-list">
                {userTasks.map(task => (
                  <div 
                    key={task.id}
                    className={`task-item ${task.user_task_status === 'completed' ? 'completed' : 'pending'}`}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="task-title">{task.title}</div>
                    <div className="task-reward">+{task.reward} VL</div>
                    <div className="task-status">
                      {task.user_task_status === 'completed' ? 'Завершено' : 'В процессе'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Содержимое вкладки "Достижения" */}
      <div className={`tab-content ${activeTab === 'achievements' ? 'active' : ''}`} data-tab="achievements" ref={achievementsRef}>
        <div className="achievements-section">
          <h3><FaStar /> Мистические достижения</h3>
          
          <div className="achievements-grid">
            {achievements.map(achievement => (
              <div 
                key={achievement.id}
                className={`achievement-card ${!achievement.isCompleted ? 'locked' : ''}`}
                onClick={() => achievement.isCompleted && showAchievementDetails(achievement)}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <div className="achievement-icon">{achievement.icon}</div>
                <div className="achievement-info">
                  <h4>{achievement.title}</h4>
                  <p>{achievement.description}</p>
                  {achievement.isCompleted ? (
                    <div className="achievement-completed">Получено</div>
                  ) : (
                    <div className="achievement-locked">Не получено</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Детали достижения */}
        {selectedAchievement && (
          <div className="achievement-details-overlay" onClick={closeAchievementDetails}>
            <div className="achievement-details" onClick={e => e.stopPropagation()}>
              <div className="achievement-details-header">
                <div className="achievement-details-icon">{selectedAchievement.icon}</div>
                <h3>{selectedAchievement.title}</h3>
                <button className="close-details-btn" onClick={closeAchievementDetails}>✕</button>
              </div>
              <div className="achievement-details-content">
                <p className="achievement-details-description">{selectedAchievement.description}</p>
                <div className="achievement-details-reward">
                  <h4>Награда:</h4>
                  <p>{selectedAchievement.reward}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Содержимое вкладки "Артефакты" */}
      <div className={`tab-content ${activeTab === 'inventory' ? 'active' : ''}`} data-tab="inventory" ref={inventoryRef}>
        <div className="inventory-section">
          <h3><FaBoxOpen /> Мистические артефакты</h3>
          
          {inventoryItems.length === 0 ? (
            <div className="empty-inventory">
              <p>Ваш инвентарь пуст</p>
              <p>Исследуйте мистический мир, чтобы найти артефакты!</p>
            </div>
          ) : (
            <div className="inventory-grid">
              {inventoryItems.map(item => {
                const rarityColor = 
                  item.rarity === 'legendary' ? '#f39c12' : 
                  item.rarity === 'epic' ? '#9b59b6' : 
                  item.rarity === 'rare' ? '#4a90e2' : 
                  '#34495e';
                
                return (
                  <div 
                    key={item.id} 
                    className="inventory-item"
                    style={{ borderColor: rarityColor }}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="item-icon" style={{ color: rarityColor }}>
                      {item.icon || '✧'}
                    </div>
                    <div className="item-details">
                      <h3>{item.name}</h3>
                      <p>{item.description}</p>
                      <div className="item-rarity" style={{ color: rarityColor }}>
                        {item.rarity === 'legendary' ? 'Легендарный' : 
                         item.rarity === 'epic' ? 'Эпический' : 
                         item.rarity === 'rare' ? 'Редкий' : 'Обычный'}
                      </div>
                      {item.quantity > 1 && (
                        <div className="item-quantity">x{item.quantity}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;