// src/screens/EarnScreen.js - Мистическая версия
import React, { useState, useEffect, useRef } from 'react';
import anime from 'animejs/lib/anime.js';
import { FaTelegram, FaUserFriends, FaGift, FaPollH, FaScroll, FaInfoCircle } from 'react-icons/fa';
import './EarnScreen.css';

// Цветовая палитра из требований
const COLOR_PALETTE = {
  darkPurple: '#3C2F4F',    // Тёмно-фиолетовый — основной фон
  beigeParchment: '#E8D3A9', // Бежево-пергаментный — текст, акценты
  darkTurquoise: '#1A3C34',  // Тёмный бирюзовый — светлячки, свечение
  inkyBlue: '#1B263B',       // Чернильный синий — тени, контуры
  moonBlue: '#A8C7FA',       // Голубоватый оттенок луны
};

const EarnScreen = ({ onComplete }) => {
  // Состояния
  const [completedTasks, setCompletedTasks] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTaskInfo, setShowTaskInfo] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskStats, setTaskStats] = useState({
    totalCompleted: 0,
    todayCompleted: 0,
    totalEarned: 0
  });
  
  // Refs
  const containerRef = useRef(null);
  const particlesRef = useRef([]);
  
  // Загрузка данных при монтировании
  useEffect(() => {
    // Загружаем выполненные задания
    const savedTasks = JSON.parse(localStorage.getItem('completedTasks')) || {};
    setCompletedTasks(savedTasks);
    
    // Загружаем статистику заданий
    const savedStats = JSON.parse(localStorage.getItem('taskStats')) || {
      totalCompleted: 0,
      todayCompleted: 0,
      totalEarned: 0,
      lastDate: new Date().toDateString()
    };
    
    // Сбрасываем дневную статистику, если это новый день
    const today = new Date().toDateString();
    if (savedStats.lastDate !== today) {
      savedStats.todayCompleted = 0;
      savedStats.lastDate = today;
    }
    
    setTaskStats(savedStats);
    
    // Создаем фоновые частицы
    createBackgroundParticles();
    
    // Очистка при размонтировании
    return () => {
      particlesRef.current.forEach(particle => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      });
    };
  }, []);
  
  // Создание мистических частиц
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

  // Проверка, выполнено ли задание сегодня
  const isTaskCompletedToday = (taskId) => {
    if (!completedTasks[taskId]) return false;
    const lastCompleted = new Date(completedTasks[taskId]);
    const today = new Date();
    return lastCompleted.getDate() === today.getDate() && 
           lastCompleted.getMonth() === today.getMonth() && 
           lastCompleted.getFullYear() === today.getFullYear();
  };

  // Выполнение задания
  const completeTask = async (taskId, reward) => {
    if (isTaskCompletedToday(taskId) || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Проверяем, что onComplete существует и является функцией
      if (typeof onComplete !== 'function') {
        console.error('onComplete не является функцией');
        return;
      }

      // Вызываем onComplete с наградой
      onComplete(reward);
      // Quest completion VFX
      try {
        const layer = document.getElementById('energy-orb-layer');
        if (layer) {
          const orbs = Array.from({ length: 10 }).map(() => {
            const el = document.createElement('div');
            Object.assign(el.style, {
              position: 'fixed', width: '8px', height: '8px', borderRadius: '50%',
              background: 'radial-gradient(circle, #F6E27A, #7A5EA6)',
              boxShadow: '0 0 10px rgba(246,226,122,0.8)'
            });
            layer.appendChild(el);
            return el;
          });
          const target = document.querySelector('.app-header');
          const rect = target ? target.getBoundingClientRect() : { left: window.innerWidth/2, top: 40, width: 100, height: 40 };
          const tx = rect.left + rect.width/2;
          const ty = rect.top + rect.height/2;
          orbs.forEach((el, i) => {
            const startX = window.innerWidth * Math.random();
            const startY = window.innerHeight * 0.6 + Math.random()*200;
            Object.assign(el.style, { left: startX + 'px', top: startY + 'px' });
            anime({ targets: el, translateX: tx - startX, translateY: ty - startY, scale: [1, 0.6], delay: i*40, duration: 700, easing: 'easeOutQuad', complete: () => { el.remove(); } });
          });
        }
      } catch (_) {}
      
      // Обновляем выполненные задания
      const newCompletedTasks = {
        ...completedTasks,
        [taskId]: new Date().toISOString()
      };
      
      localStorage.setItem('completedTasks', JSON.stringify(newCompletedTasks));
      setCompletedTasks(newCompletedTasks);
      
      // Обновляем статистику заданий
      const newStats = {
        ...taskStats,
        totalCompleted: taskStats.totalCompleted + 1,
        todayCompleted: taskStats.todayCompleted + 1,
        totalEarned: taskStats.totalEarned + reward,
        lastDate: new Date().toDateString()
      };
      
      setTaskStats(newStats);
      localStorage.setItem('taskStats', JSON.stringify(newStats));
      
      // Анимация успешного выполнения
      const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
      if (taskElement) {
        anime({
          targets: taskElement,
          scale: [1, 1.05, 1],
          backgroundColor: [
            'rgba(60, 47, 79, 0.5)',
            'rgba(26, 60, 52, 0.5)',
            'rgba(60, 47, 79, 0.5)'
          ],
          duration: 1000,
          easing: 'easeInOutQuad'
        });
      }
    } catch (error) {
      console.error('Ошибка при выполнении задания:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Список заданий
  const tasks = [
    {
      id: 'telegram',
      title: "Подпишитесь на наш канал",
      description: "Присоединитесь к нашему мистическому сообществу и получайте эксклюзивные новости и обновления",
      reward: 50,
      icon: <FaTelegram />,
      action: () => window.Telegram?.WebApp?.openTelegramLink('https://t.me/VLTOKEN'),
      color: COLOR_PALETTE.moonBlue
    },
    {
      id: 'invite',
      title: "Пригласите друга",
      description: "Расширьте круг посвященных, пригласив друга в наше мистическое сообщество",
      reward: 100,
      icon: <FaUserFriends />,
      action: () => window.Telegram?.WebApp?.openTelegramLink(`https://t.me/VLTOKEN_BOT?start=ref_123`),
      color: COLOR_PALETTE.beigeParchment
    },
    {
      id: 'daily',
      title: "Ежедневный бонус",
      description: "Получайте ежедневную порцию мистической энергии для ваших ритуалов",
      reward: 10,
      icon: <FaGift />,
      color: COLOR_PALETTE.darkTurquoise
    },
    {
      id: 'poll',
      title: "Пройдите опрос",
      description: "Поделитесь своим мнением и помогите нам улучшить ваше мистическое путешествие",
      reward: 30,
      icon: <FaPollH />,
      action: () => window.Telegram?.WebApp?.openTelegramLink('https://t.me/OPROSVL_BOT?start=poll'),
      color: COLOR_PALETTE.moonBlue
    },
    {
      id: 'ritual',
      title: "Ритуал познания",
      description: "Прочтите древний манускрипт и узнайте тайны мистического мира",
      reward: 25,
      icon: <FaScroll />,
      color: COLOR_PALETTE.beigeParchment
    }
  ];

  // Обработчик клика по заданию
  const handleTaskClick = async (task) => {
    if (isTaskCompletedToday(task.id) || isProcessing) return;
    
    if (task.action) {
      task.action();
    }
    
    await completeTask(task.id, task.reward);
  };
  
  // Показать информацию о задании
  const showTaskDetails = (task) => {
    setSelectedTask(task);
    setShowTaskInfo(true);
    
    // Анимация появления деталей
    setTimeout(() => {
      anime({
        targets: '.task-details',
        opacity: [0, 1],
        translateY: [20, 0],
        easing: 'easeOutQuad',
        duration: 300
      });
    }, 10);
  };
  
  // Закрыть информацию о задании
  const closeTaskDetails = () => {
    // Анимация исчезновения деталей
    anime({
      targets: '.task-details',
      opacity: [1, 0],
      translateY: [0, 20],
      easing: 'easeOutQuad',
      duration: 300,
      complete: () => {
        setShowTaskInfo(false);
        setSelectedTask(null);
      }
    });
  };

  return (
    <div className="earn-screen" ref={containerRef}>
      {/* Мистический фон с частицами */}
      <div className="mystical-overlay"></div>
      
      {/* Заголовок экрана */}
      <div className="earn-header">
        <h2><FaScroll /> Мистические Задания</h2>
      </div>
      
      {/* Статистика заданий */}
      <div className="task-stats">
        <div className="task-stat">
          <span className="task-stat-label">Выполнено сегодня</span>
          <span className="task-stat-value">{taskStats.todayCompleted}</span>
        </div>
        <div className="task-stat">
          <span className="task-stat-label">Всего выполнено</span>
          <span className="task-stat-value">{taskStats.totalCompleted}</span>
        </div>
        <div className="task-stat">
          <span className="task-stat-label">Заработано VL</span>
          <span className="task-stat-value">{taskStats.totalEarned}</span>
        </div>
      </div>
      
      {/* Список заданий */}
      <div className="tasks-grid">
        {tasks.map(task => {
          const isCompleted = isTaskCompletedToday(task.id);
          
          return (
            <div 
              key={task.id}
              data-task-id={task.id}
              className={`task-card ${isCompleted ? 'completed' : ''} ${isProcessing ? 'processing' : ''}`}
              onClick={() => !isCompleted && !isProcessing ? handleTaskClick(task) : showTaskDetails(task)}
            >
              <div 
                className="task-icon"
                style={{ 
                  backgroundColor: `${task.color}33`,
                  boxShadow: `0 0 10px ${task.color}33`
                }}
              >
                {task.icon}
              </div>
              <div className="task-content">
                <h3>{task.title}</h3>
                <div className="task-reward">+{task.reward} ✦</div>
              </div>
              <div className="task-status">
                {isCompleted ? '✓ Выполнено' : isProcessing ? 'Загрузка...' : 'Нажмите'}
              </div>
              <div className="task-info-button" onClick={(e) => {
                e.stopPropagation();
                showTaskDetails(task);
              }}>
                <FaInfoCircle />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Информационная карточка */}
      <div className="info-card">
        <div className="info-header">
          <div className="info-icon">💡</div>
          <h3>Советы по заработку</h3>
        </div>
        <ul className="tips-list">
          <li>📜 Выполняйте задания ежедневно для максимальной награды</li>
          <li>🔮 Собирайте энергию в разделе "Сбор энергии"</li>
          <li>🛒 Покупайте предметы в магазине для пассивного дохода</li>
          <li>👥 Приглашайте друзей для получения бонусов</li>
        </ul>
      </div>
      
      {/* Детали задания */}
      {showTaskInfo && selectedTask && (
        <div className="task-details-overlay" onClick={closeTaskDetails}>
          <div className="task-details" onClick={e => e.stopPropagation()}>
            <div className="task-details-header">
              <div 
                className="task-details-icon"
                style={{ 
                  backgroundColor: `${selectedTask.color}33`,
                  boxShadow: `0 0 15px ${selectedTask.color}33`
                }}
              >
                {selectedTask.icon}
              </div>
              <h3>{selectedTask.title}</h3>
              <button className="close-details-btn" onClick={closeTaskDetails}>✕</button>
            </div>
            
            <div className="task-details-content">
              <div className="task-details-description">
                <p>{selectedTask.description}</p>
              </div>
              
              <div className="task-details-info">
                <div className="task-details-row">
                  <span className="detail-label">Награда:</span>
                  <span className="detail-value">{selectedTask.reward} VL</span>
                </div>
                <div className="task-details-row">
                  <span className="detail-label">Опыт:</span>
                  <span className="detail-value">{Math.round(selectedTask.reward * 0.1)} XP</span>
                </div>
                <div className="task-details-row">
                  <span className="detail-label">Статус:</span>
                  <span className="detail-value">
                    {isTaskCompletedToday(selectedTask.id) ? 'Выполнено сегодня' : 'Доступно'}
                  </span>
                </div>
              </div>
              
              {!isTaskCompletedToday(selectedTask.id) && (
                <div className="task-details-actions">
                  <button 
                    className="complete-task-btn"
                    onClick={() => {
                      closeTaskDetails();
                      handleTaskClick(selectedTask);
                    }}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Загрузка...' : 'Выполнить задание'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EarnScreen;