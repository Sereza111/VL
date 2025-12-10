// src/screens/FriendsScreen.js - Мистическая версия
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  FaUserPlus, FaCopy, FaCheck, FaUserFriends, FaGift, 
  FaUserClock, FaStar, FaCoins, FaPercent, FaTimesCircle,
  FaNetworkWired, FaMoon, FaScroll, FaFeatherAlt
} from 'react-icons/fa';
import anime from 'animejs/lib/anime.js';
import './FriendsScreen.css';

// Цветовая палитра из требований
const COLOR_PALETTE = {
  darkPurple: '#3C2F4F',    // Тёмно-фиолетовый — основной фон
  beigeParchment: '#E8D3A9', // Бежево-пергаментный — текст, акценты
  darkTurquoise: '#1A3C34',  // Тёмный бирюзовый — светлячки, свечение
  inkyBlue: '#1B263B',       // Чернильный синий — тени, контуры
  moonBlue: '#A8C7FA',       // Голубоватый оттенок луны
};

const FriendsScreen = ({ 
  userData,
  friends = [], 
  friendRequests = [], 
  onSendRequest, 
  onAcceptRequest, 
  onRejectRequest, 
  onLoadFriends,
  maxFriends = 20 
}) => {
  const [friendId, setFriendId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFriends, setFilteredFriends] = useState(friends);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('summon'); // 'summon', 'requests', 'allies'
  const [showReferralDetails, setShowReferralDetails] = useState(false);
  
  // Refs для анимаций
  const containerRef = useRef(null);
  const particlesRef = useRef([]);
  const tarotCardsRef = useRef([]);
  const didLoadRef = useRef(false);
  const animationFrameIdRef = useRef(null);
  
  // Загружаем запросы в друзья только один раз при монтировании компонента
  useEffect(() => {
    if (onLoadFriends && !didLoadRef.current) {
      setLoadingFriends(true);
      Promise.resolve(onLoadFriends()).finally(() => {
        setLoadingFriends(false);
      });
      didLoadRef.current = true;
    }
  }, [onLoadFriends]);
  
  // Функция для ручного обновления данных о друзьях
  const handleRefresh = () => {
    if (onLoadFriends) {
      setIsProcessing(true);
      setLoadingFriends(true);
      Promise.resolve(onLoadFriends())
        .catch(() => {})
        .finally(() => {
          setIsProcessing(false);
          setLoadingFriends(false);
        });
    }
  };
  
  // Обновляем отфильтрованный список друзей при изменении списка друзей
  useEffect(() => {
    setFilteredFriends(friends);
  }, [friends]);

  // Мемоизированная ссылка для приглашения
  const referralLink = useMemo(() => 
    `https://t.me/VLTOKEN_BOT?start=ref_${userData?.userId}`
  , [userData?.userId]);

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
      
      // Создаем новые частицы - уменьшено количество с 30 до 12
      for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.className = 'mystical-particle';
        
        // Случайный размер и позиция
        const size = 2 + Math.random() * 6;
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
  
  // Эффект для анимации при переключении вкладок - оптимизирован
  useEffect(() => {
    const tabContent = document.querySelector(`.tab-content[data-tab="${activeTab}"]`);
    if (tabContent) {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      
      animationFrameIdRef.current = requestAnimationFrame(() => {
        anime({
          targets: tabContent,
          opacity: [0, 1],
          translateY: [20, 0],
          easing: 'easeOutQuad',
          duration: 400
        });
      });
    }
  }, [activeTab]);

  // Enhanced clipboard interaction with mystical feedback
  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      
      // Mystical vibration effect
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 30, 50]);
      }
      
      // Анимация успешного копирования
      const copyButton = document.querySelector('.copy-button');
      if (copyButton) {
        anime({
          targets: copyButton,
          scale: [1, 1.2, 1],
          backgroundColor: [
            'rgba(60, 47, 79, 0.7)',
            'rgba(26, 60, 52, 0.7)',
            'rgba(60, 47, 79, 0.7)'
          ],
          easing: 'easeInOutQuad',
          duration: 1000
        });
      }
      
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback clipboard method
      const textArea = document.createElement('textarea');
      textArea.value = referralLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [referralLink]);

  // Mystical avatar color generation - мемоизированная
  const getAvatarColor = useCallback((id) => {
    const mysticalColors = [
      COLOR_PALETTE.darkPurple, 
      COLOR_PALETTE.darkTurquoise, 
      COLOR_PALETTE.inkyBlue,
      '#6A0572', '#4ECDC4', '#7B68EE'
    ];
    const numId = parseInt((id || '0').toString().replace(/\D/g, ''), 10) || 0;
    return mysticalColors[numId % mysticalColors.length];
  }, []);

  // Helper to get initials from a name - мемоизированная
  const getInitials = useCallback((name) => {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase();
  }, []);

  // Mystical friend addition with enhanced validation
  const handleAddFriend = useCallback(async () => {
    setError('');
    setSuccess('');
    setIsProcessing(true);
    
    if (!friendId.trim()) {
      setError('Введите ID мистического союзника');
      setIsProcessing(false);
      return;
    }
    
    if (friendId === userData?.userId) {
      setError('Вы не можете добавить себя в круг союзников');
      setIsProcessing(false);
      return;
    }
    
    // Friend limit check with mystical messaging
    if (friends.length >= maxFriends) {
      setError(`Ваш мистический круг достиг предела (${maxFriends} союзников)`);
      setIsProcessing(false);
      return;
    }
    
    // Check for existing connections
    const isFriend = friends.some(friend => 
      typeof friend === 'object' ? 
        (friend.telegram_id === friendId || friend.id === friendId) : 
        friend === friendId
    );
    
    if (isFriend) {
      setError('Эта душа уже связана с вашим мистическим кругом');
      setIsProcessing(false);
      return;
    }
    
    try {
      const result = await onSendRequest(friendId.trim());
      
      if (result && result.success) {
        setSuccess('Мистическая связь установлена! 🔮');
        setFriendId('');
        
        // Анимация успешного добавления
        const addButton = document.querySelector('.summon-button');
        if (addButton) {
          anime({
            targets: addButton,
            scale: [1, 1.2, 1],
            backgroundColor: [
              'rgba(60, 47, 79, 0.7)',
              'rgba(26, 60, 52, 0.7)',
              'rgba(60, 47, 79, 0.7)'
            ],
            easing: 'easeInOutQuad',
            duration: 1000
          });
        }
        
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result?.error || 'Мистическая связь не может быть установлена');
      }
    } catch (error) {
      setError('Космическое вмешательство нарушило связь');
    } finally {
      setIsProcessing(false);
    }
  }, [friendId, userData?.userId, friends, maxFriends, onSendRequest]);

  // Numeric input handling
  const handleIdChange = useCallback((e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setFriendId(value);
    }
  }, []);

  // Mystical friend request acceptance
  const handleAcceptRequest = useCallback(async (friendId) => {
    setError('');
    setIsProcessing(true);
    
    if (friends.length >= maxFriends) {
      setError(`Ваш мистический круг достиг предела (${maxFriends} союзников)`);
      setIsProcessing(false);
      return;
    }
    
    try {
      const result = await onAcceptRequest(friendId);
      
      if (result && result.success) {
        setSuccess('Новая мистическая связь скреплена! +100 VL 🌟');
        
        // Анимация принятия запроса
        const requestCard = document.querySelector(`.friend-request-item[data-id="${friendId}"]`);
        if (requestCard) {
          anime({
            targets: requestCard,
            opacity: [1, 0],
            translateY: [0, -20],
            easing: 'easeOutQuad',
            duration: 500,
            complete: () => {
              // Код выполнится после завершения анимации
            }
          });
        }
        
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result?.error || 'Не удалось принять мистическую связь');
      }
    } catch (error) {
      setError('Космические энергии нарушили связь');
    } finally {
      setIsProcessing(false);
    }
  }, [friends.length, maxFriends, onAcceptRequest]);

  // Friend request rejection
  const handleRejectRequest = useCallback(async (friendId) => {
    setIsProcessing(true);
    try {
      await onRejectRequest(friendId);
      setSuccess('Мистическая связь отклонена');
      
      // Анимация отклонения запроса
      const requestCard = document.querySelector(`.friend-request-item[data-id="${friendId}"]`);
      if (requestCard) {
        anime({
          targets: requestCard,
          opacity: [1, 0],
          translateX: [0, 50],
          easing: 'easeOutQuad',
          duration: 500,
          complete: () => {
            // Код выполнится после завершения анимации
          }
        });
      }
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Ошибка при отклонении связи');
    } finally {
      setIsProcessing(false);
    }
  }, [onRejectRequest]);
  
  // Enhanced friend search - мемоизированная
  const handleSearchChange = useCallback((e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    
    if (!query) {
      setFilteredFriends(friends);
    } else {
      const filtered = friends.filter(friend => {
        const friendId = typeof friend === 'object' ? friend.telegram_id : friend;
        const friendName = typeof friend === 'object' ? (friend.first_name || friend.name || '') : '';
        return friendId?.toString().toLowerCase().includes(query) || 
               friendName.toLowerCase().includes(query);
      });
      setFilteredFriends(filtered);
    }
  }, [friends]);
  
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
  
  // Функция для переключения вкладок с анимацией
  const switchTab = useCallback((tab) => {
    // Анимация исчезновения текущей вкладки
    const currentTabContent = document.querySelector(`.tab-content[data-tab="${activeTab}"]`);
    if (currentTabContent) {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      
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
  }, [activeTab]);
  
  // Функция для переключения отображения деталей реферальной ссылки
  const toggleReferralDetails = useCallback(() => {
    const detailsEl = document.querySelector('.referral-details');
    if (detailsEl) {
      if (showReferralDetails) {
        anime({
          targets: detailsEl,
          height: [detailsEl.scrollHeight, 0],
          opacity: [1, 0],
          easing: 'easeOutQuad',
          duration: 300,
          complete: () => {
            setShowReferralDetails(false);
          }
        });
      } else {
        setShowReferralDetails(true);
        anime({
          targets: detailsEl,
          height: [0, detailsEl.scrollHeight],
          opacity: [0, 1],
          easing: 'easeOutQuad',
          duration: 300
        });
      }
    } else {
      setShowReferralDetails(!showReferralDetails);
    }
  }, [showReferralDetails]);
  
  // Мемоизируем отрисовку запросов в друзья
  const requestsContent = useMemo(() => {
    return friendRequests.length === 0 ? (
      <div className="no-requests-message">
        У вас нет входящих запросов на мистическую связь
      </div>
    ) : (
      <div className="friend-requests-list">
        {friendRequests.map(request => (
          <div 
            key={request.id || request.sender_id} 
            className="friend-request-item"
            data-id={request.sender_telegram_id || request.sender_id}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div 
              className="friend-avatar" 
              style={{ backgroundColor: getAvatarColor(request.sender_telegram_id || request.sender_id) }}
            >
              {getInitials(request.sender_name || 'Мистик')}
            </div>
            <div className="friend-info">
              <div className="friend-name">{request.sender_name || 'Мистический пользователь'}</div>
              <div className="friend-id">ID: {request.sender_telegram_id || request.sender_id}</div>
            </div>
            <div className="friend-actions">
              <button 
                onClick={() => handleAcceptRequest(request.sender_telegram_id || request.sender_id)} 
                disabled={isProcessing}
                className="accept-button" 
              >
                <FaCheck /> Принять
              </button>
              <button 
                onClick={() => handleRejectRequest(request.sender_telegram_id || request.sender_id)} 
                disabled={isProcessing}
                className="reject-button"
              >
                <FaTimesCircle /> Отклонить
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }, [friendRequests, handleMouseEnter, handleMouseLeave, getAvatarColor, getInitials, isProcessing, handleAcceptRequest, handleRejectRequest]);
  
  // Мемоизируем отрисовку списка друзей
  const friendsContent = useMemo(() => {
    return friends.length === 0 ? (
      <div className="no-friends-message">
        У вас пока нет мистических союзников.<br />
        Используйте свиток призыва, чтобы пригласить друзей.
      </div>
    ) : (
      <div className="friends-list">
        {filteredFriends.map((friend, index) => {
          const friendId = typeof friend === 'object' ? (friend.telegram_id || friend.id) : friend;
          const friendName = typeof friend === 'object' ? (friend.first_name || friend.name || 'Мистик') : 'Мистик';
          
          return (
            <div 
              key={friendId || index} 
              className="friend-card"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div className="friend-avatar" style={{ backgroundColor: getAvatarColor(friendId) }}>
                {getInitials(friendName)}
              </div>
              <div className="friend-info">
                <div className="friend-name">{friendName}</div>
                <div className="friend-id">ID: {friendId}</div>
                <div className="friend-bonus">
                  <FaCoins /> +2 VL/час
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [filteredFriends, friends.length, handleMouseEnter, handleMouseLeave, getAvatarColor, getInitials]);

  return (
    <div className="friends-screen" ref={containerRef}>
      {/* Мистический фон с частицами */}
      <div className="mystical-overlay"></div>
      
      {/* Заголовок экрана */}
      <div className="friends-header">
        <h2><FaUserFriends /> Мистический Круг</h2>
        <div className="friends-count">
          <FaStar /> {friends.length}/{maxFriends} союзников
        </div>
      </div>
      
      {/* Реферальная карта */}
      <div className="referral-card">
        <div className="referral-header" onClick={toggleReferralDetails}>
          <div className="referral-icon">
            <FaScroll />
          </div>
          <h3>Мистический Свиток Призыва</h3>
          <div className={`toggle-arrow ${showReferralDetails ? 'open' : ''}`}>
            {showReferralDetails ? '▼' : '▲'}
          </div>
        </div>
        
        <div className={`referral-details ${showReferralDetails ? 'visible' : ''}`} style={{ height: showReferralDetails ? 'auto' : '0', opacity: showReferralDetails ? 1 : 0, overflow: 'hidden' }}>
          <div className="referral-rewards">
            <div className="reward-item" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
              <div className="reward-icon coins">
                <FaCoins />
              </div>
              <div className="reward-value">+100 VL</div>
              <div className="reward-label">Мистическая энергия</div>
            </div>
            <div className="reward-item" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
              <div className="reward-icon xp">
                <FaStar />
              </div>
              <div className="reward-value">+50 XP</div>
              <div className="reward-label">Опыт познания</div>
            </div>
            <div className="reward-item" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
              <div className="reward-icon percent">
                <FaPercent />
              </div>
              <div className="reward-value">+5%</div>
              <div className="reward-label">Бонус к доходу</div>
            </div>
          </div>
          
          <div className="referral-link-container">
            <div className="referral-text">
              Поделитесь этим свитком, чтобы призвать союзников в ваш мистический круг:
            </div>
            <div className="referral-link">
              <div className="link-text">{referralLink}</div>
              <button className="copy-button" onClick={copyToClipboard}>
                <span className="icon">{copied ? <FaCheck /> : <FaCopy />}</span>
                {copied ? 'Скопировано' : 'Скопировать'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Вкладки */}
      <div className="mystical-tabs">
        <div 
          className={`tab ${activeTab === 'summon' ? 'active' : ''}`}
          onClick={() => switchTab('summon')}
        >
          <FaUserPlus /> Призвать
        </div>
        <div 
          className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => switchTab('requests')}
        >
          <FaUserClock /> Запросы {friendRequests.length > 0 && <span className="tab-badge">{friendRequests.length}</span>}
        </div>
        <div 
          className={`tab ${activeTab === 'allies' ? 'active' : ''}`}
          onClick={() => switchTab('allies')}
        >
          <FaUserFriends /> Союзники {friends.length > 0 && <span className="tab-badge">{friends.length}</span>}
        </div>
        <button 
          className="refresh-button"
          onClick={handleRefresh}
          disabled={isProcessing}
        >
          {isProcessing ? 'Обновление...' : 'Обновить'}
        </button>
      </div>
      
      {/* Содержимое вкладки "Призвать" */}
      <div className={`tab-content ${activeTab === 'summon' ? 'active' : ''}`} data-tab="summon">
        <div className="add-friend-section">
          <h3><FaFeatherAlt /> Призвать мистического союзника</h3>
          <div className="friend-input-container">
            <input
              type="text"
              value={friendId}
              onChange={handleIdChange}
              placeholder="Введите Telegram ID"
              disabled={isProcessing}
              className="friend-input"
            />
            <button 
              onClick={handleAddFriend}
              disabled={isProcessing || !friendId.trim()}
              className="summon-button"
            >
              Призвать
            </button>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <div className="summon-description">
            <p>Введите Telegram ID союзника, чтобы отправить ему мистический запрос на связь. После принятия запроса вы оба получите бонусы к доходу и опыту.</p>
          </div>
        </div>
      </div>
      
      {/* Содержимое вкладки "Запросы" */}
      <div className={`tab-content ${activeTab === 'requests' ? 'active' : ''}`} data-tab="requests">
        <div className="friend-requests-section">
          <h3><FaMoon /> Ожидающие мистические связи</h3>
          {requestsContent}
        </div>
      </div>
      
      {/* Содержимое вкладки "Союзники" */}
      <div className={`tab-content ${activeTab === 'allies' ? 'active' : ''}`} data-tab="allies">
        <div className="friends-list-section">
          <h3><FaNetworkWired /> Мистические союзники</h3>
          
          {friends.length > 0 && (
            <div className="search-container">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Поиск по имени или ID..."
                className="search-input"
              />
            </div>
          )}
          
          {loadingFriends ? (
            <div className="no-friends-message">Загружаем мистических союзников…</div>
          ) : (
            friendsContent
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(FriendsScreen);