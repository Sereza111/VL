import React, { useEffect, useMemo, useCallback, useRef, useState } from 'react';
import { saveUserData, loadUserData } from './services/storage';
import { initTelegramApp } from './services/telegram';
import { createMainMenuButtons, sendWelcomeMessage, openSupportBot } from './services/telegram';
import { createOrUpdateUser, getUserByTelegramId, updateUserBalance } from './services/userService';
import HomeScreen from './screens/HomeScreen';
import EarnScreen from './screens/EarnScreen';
import FarmScreen from './screens/FarmScreen';
import TasksScreen from './screens/TasksScreen';
import ProfileScreen from './screens/ProfileScreen';
import ShopScreen from './screens/ShopScreen';
import FriendsScreen from './screens/FriendsScreen';
import FunScreen from './screens/FunScreen';
import ArtifactsScreen from './screens/ArtifactsScreen';
import NavBar from './components/NavBar';
import { getAllUsersData, sendFriendRequest, getFriendRequests, acceptFriendRequest as acceptFriendRequestDb, rejectFriendRequest as rejectFriendRequestDb, getFriends, executeApiRequest } from './services/database';
import { getUserItems } from './services/userService';
import config from './config';
import './App.css';
import MagicalBackground from './components/MagicalBackground';
import QuillTextEffect from './components/QuillTextEffect';
import GothicBalance from './components/GothicBalance';
import MusicControl from './components/MusicControl';
import anime from 'animejs/lib/anime.js';
import MagicCircleVFX from './components/MagicCircleVFX';

// Цветовая палитра из требований
const COLOR_PALETTE = {
  darkPurple: '#3C2F4F',    // Тёмно-фиолетовый — основной фон
  beigeParchment: '#E8D3A9', // Бежево-пергаментный — текст, акценты
  darkTurquoise: '#1A3C34',  // Тёмный бирюзовый — светлячки, свечение
  inkyBlue: '#1B263B',       // Чернильный синий — тени, контуры
  moonBlue: '#A8C7FA',       // Голубоватый оттенок луны
};

function App() {
  // State management
  const [userData, setUserData] = React.useState({});
  const [currentScreen, setCurrentScreen] = React.useState('home');
  const [balance, setBalance] = React.useState(0);
  const [exp, setExp] = React.useState(0);
  const [level, setLevel] = React.useState(1);
  const [items, setItems] = React.useState([]);
  const [friends, setFriends] = React.useState([]);
  const [friendRequests, setFriendRequests] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [dailyIncome, setDailyIncome] = React.useState(2058.00);
  const [dbUser, setDbUser] = React.useState(null);
  const [friendsLoaded, setFriendsLoaded] = React.useState(false);
  const [playingGuitar, setPlayingGuitar] = useState(false);
  const [balanceChange, setBalanceChange] = useState(null);
  const [showBalanceDetails, setShowBalanceDetails] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [visualTheme, setVisualTheme] = useState('mystical');
  
  // Performance tracking ref
  const performanceTrackingRef = useRef({
    loadStartTime: performance.now(),
    renderCount: 0
  });

  // Ref для отслеживания первой загрузки
  const isInitializedRef = useRef(false);

  // Audio refs
  const guitarAudioRef = useRef(null);

  // Функция для сохранения данных пользователя
  const saveData = async () => {
    if (!userData.userId) return;
    
    // Фильтруем предметы, оставляя только те, что имеют числовые ID (из базы данных)
    const filteredItems = items.filter(item => 
      typeof item.id === 'number' || 
      (typeof item.id === 'string' && !isNaN(parseInt(item.id)))
    );
    
    // Если есть данные пользователя из БД, используем баланс из БД
    let savedBalance = balance;
    if (dbUser) {
      try {
        // Получаем актуальные данные пользователя из БД
        const updatedUser = await getUserByTelegramId(userData.userId);
        if (updatedUser) {
          savedBalance = parseFloat(updatedUser.balance || balance);
          console.log('Получен актуальный баланс из БД для сохранения:', savedBalance);
        }
      } catch (error) {
        console.error('Ошибка при получении актуального баланса из БД:', error);
      }
    }
    
    const dataToSave = {
      balance: savedBalance,
      exp,
      items: filteredItems,
      friends,
      friendRequests,
      dailyIncome,
      lastSave: new Date().toISOString()
    };
    
    saveUserData(userData.userId, dataToSave);
    console.log('Данные сохранены локально:', dataToSave);
  };

  // Memoized calculation functions
  const calculateLevel = useCallback((exp) => {
    return Math.floor(Math.sqrt(exp / 100)) + 1;
  }, []);

  const calculateNextLevelExp = useCallback((currentLevel) => {
    return (currentLevel * currentLevel) * 100;
  }, []);

  // Загрузка друзей и запросов в друзья
  const loadFriendsData = useCallback(async (userId, forceUpdate = false) => {
    try {
      if (!userId) {
        console.error('Не указан ID пользователя для загрузки данных о друзьях');
        return;
      }
      
      // Проверяем, нужно ли загружать данные о друзьях
      if (friendsLoaded && !forceUpdate) {
        console.log('Данные о друзьях уже загружены, пропускаем запрос');
        return;
      }
      
      console.log(`Загрузка данных о друзьях для пользователя ${userId}`);
      setFriendsLoaded(true); // Устанавливаем флаг загрузки перед запросами
      
      try {
        // Используем переданный userId для запроса друзей
        const friendsList = await getFriends(userId);
        console.log('Загружены друзья:', friendsList);
        setFriends(friendsList || []);
      } catch (error) {
        console.error('Ошибка при загрузке списка друзей:', error);
        // Не меняем текущее состояние друзей в случае ошибки
      }
      
      try {
        // Используем переданный userId для запроса запросов в друзья
        const requests = await getFriendRequests(userId);
        console.log('Загружены запросы в друзья:', requests);
        setFriendRequests(requests || []);
      } catch (error) {
        console.error('Ошибка при загрузке запросов в друзья:', error);
        // Не меняем текущее состояние запросов в случае ошибки
      }
    } catch (error) {
      console.error('Общая ошибка при загрузке данных о друзьях:', error);
    }
  }, []);

  // Инициализация и загрузка данных
  useEffect(() => {
    const loadApp = async () => {
      try {
        setLoading(true);
        const tgData = initTelegramApp();
        console.log('Telegram data:', tgData);
        
        if (!tgData || !tgData.userId) {
          console.error('Не удалось получить данные пользователя Telegram');
          setLoading(false);
          return;
        }
        
        setUserData(tgData);

        // Загружаем данные из локального хранилища
        const savedData = await loadUserData(tgData.userId);
        console.log('Локальные данные:', savedData);

        // Загружаем данные пользователя из БД (только внутри Telegram)
        let dbUserData = null;
        try {
          if (tgData.isTelegram) {
            dbUserData = await getUserByTelegramId(tgData.userId);
            console.log('Данные пользователя из БД:', dbUserData);
          }
          if (dbUserData) {
            setDbUser(dbUserData);
            
            // Если пользователь найден в БД, загружаем его друзей и запросы
            // Используем telegram_id вместо внутреннего id
            await loadFriendsData(tgData.userId);
            
            // Загружаем предметы пользователя из БД
            try {
              const userItems = await getUserItems(dbUserData.id);
              console.log('Предметы пользователя из БД:', userItems);
              
              if (userItems && userItems.length > 0) {
                // Преобразуем формат предметов из БД в формат, используемый в приложении
                const formattedItems = userItems.map(userItem => {
                  const item = userItem.item;
                  return {
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    price: item.price,
                    income_per_hour: item.income_per_hour,
                    image_url: item.image_url,
                    type: item.type,
                    quantity: userItem.quantity
                  };
                });
                
                // Обновляем список предметов, заменяя все предметы из базы данных
                setItems(formattedItems);
                
                // Рассчитываем доход от предметов
                const totalIncome = formattedItems.reduce((sum, item) => {
                  console.log(`Предмет: ${item.name}, доход: ${item.income_per_hour}, количество: ${item.quantity}`);
                  return sum + (parseFloat(item.income_per_hour || 0) * (item.quantity || 1));
                }, 0);
                
                // Обновляем дневной доход
                if (totalIncome > 0) {
                  setDailyIncome(totalIncome); // Устанавливаем почасовой доход
                  console.log(`Установлен почасовой доход из предметов: ${totalIncome} VL/час (${totalIncome * 24} VL/день)`);
                }
              }
            } catch (itemsError) {
              console.error('Ошибка при загрузке предметов пользователя:', itemsError);
              // Если не удалось загрузить предметы из БД, используем локальные данные
              if (savedData) {
                setItems(savedData.items || []);
                setDailyIncome(savedData.dailyIncome || 2058.00);
              }
            }
          } else if (tgData.isTelegram) {
            console.log('Пользователь не найден в БД, создаем нового');
            const newUser = await createOrUpdateUser({
              telegram_id: tgData.userId,
              username: tgData.username || `user_${tgData.userId}`,
              first_name: tgData.firstName || '',
              last_name: tgData.lastName || '',
              balance: savedData ? savedData.balance : 100,
              exp: savedData ? savedData.exp : 0
            });
            
            console.log('Создан новый пользователь:', newUser);
            setDbUser(newUser);
            dbUserData = newUser;
          }
        } catch (error) {
          console.error('Ошибка при загрузке данных пользователя из БД:', error);
        }

        // Устанавливаем начальные значения, приоритет у данных из БД
        if (dbUserData) {
          // Используем баланс из БД, если он доступен
          setBalance(parseFloat(dbUserData.balance || 100));
          setExp(parseFloat(dbUserData.exp || 0));
          const calculatedLevel = calculateLevel(parseFloat(dbUserData.exp || 0));
          setLevel(calculatedLevel);
          
          // Игнорируем баланс из локального хранилища, всегда используем баланс из БД
          if (savedData) {
            // Обновляем локальное хранилище с актуальным балансом из БД
            savedData.balance = parseFloat(dbUserData.balance || 100);
            saveUserData(tgData.userId, savedData);
            console.log('Локальное хранилище обновлено с балансом из БД:', parseFloat(dbUserData.balance || 100));
          }
        } else if (savedData) {
          // Если нет данных из БД, используем локальные данные
          setBalance(savedData.balance || 100);
          setExp(savedData.exp || 0);
          const calculatedLevel = calculateLevel(savedData.exp || 0);
          setLevel(calculatedLevel);
        } else {
          // Значения по умолчанию для нового пользователя
          setBalance(100);
          setExp(0);
          setLevel(1);
        }

        // Загружаем остальные данные из локального хранилища
        if (savedData) {
          // Предметы загружаются из БД, но если их нет, используем локальные
          if (!items || items.length === 0) {
            setItems(savedData.items || []);
            setDailyIncome(savedData.dailyIncome || 2058.00);
          }
          
          setFriends(savedData.friends || []);
          setFriendRequests(savedData.friendRequests || []);
        } else {
          // Значения по умолчанию для нового пользователя
          if (!items || items.length === 0) {
            setItems([]);
            setDailyIncome(2058.00);
          }
          
          setFriends([]);
          setFriendRequests([]);
        }

        // Создаем криптидов в фоне
        setTimeout(() => {
          createCryptids();
        }, 2000);

        // Загружаем аудио
        guitarAudioRef.current = new Audio('/guitar-riff.mp3');
        guitarAudioRef.current.volume = 0.5;

      } catch (error) {
        console.error('Ошибка при загрузке приложения:', error);
      } finally {
        // Завершаем загрузку
        setLoading(false);
        
        // Замеряем время загрузки
        const loadTime = performance.now() - performanceTrackingRef.current.loadStartTime;
        console.log(`Приложение загружено за ${loadTime.toFixed(2)}мс`);
      }
    };

    if (!isInitializedRef.current) {
    loadApp();
      isInitializedRef.current = true;
    }
  }, [calculateLevel, loadFriendsData]);

  // Сохраняем данные при изменении состояния
  useEffect(() => {
    if (!userData.userId || loading) return;
    
    // Сохраняем данные с задержкой
    const saveTimeout = setTimeout(async () => {
      await saveData();
    }, 500);
    
    return () => clearTimeout(saveTimeout);
  }, [balance, dailyIncome, exp, friendRequests, friends, items, loading, userData.userId]);

  // Обновление баланса и опыта
  const updateBalance = async (amount, expReward = 0) => {
    try {
      // Ensure amount is a valid number
      const numericAmount = parseFloat(amount) || 0;
      const numericExpReward = parseFloat(expReward) || 0;
      
      // Ensure current balance is a valid number
      const currentBalance = parseFloat(balance) || 0;
      const currentExp = parseFloat(exp) || 0;
      
      // Show balance change animation if positive
      if (numericAmount > 0) {
        setBalanceChange(`+${numericAmount.toFixed(2)}`);
        
        // Reset balance change after animation
        setTimeout(() => {
          setBalanceChange(null);
        }, 1500);
      }
      
      // Обновляем баланс в интерфейсе сразу для лучшего UX
      const newBalance = Math.max(0, currentBalance + numericAmount);
      setBalance(newBalance);
      
      // Обновляем опыт и уровень
      const newExp = currentExp + numericExpReward;
      setExp(newExp);
      
      const newLevel = calculateLevel(newExp);
      if (newLevel !== level) {
        setLevel(newLevel);
        // Можно добавить уведомление о новом уровне
      }
      
      // Добавляем 2% дохода друзьям
      if (numericAmount > 0) {
        const friendBonus = numericAmount * 0.02; // 2% от дохода
        
        // Распределяем бонус между друзьями
        if (friends.length > 0) {
          const bonusPerFriend = friendBonus / friends.length;
          console.log(`Распределяем бонус ${bonusPerFriend} между ${friends.length} друзьями`);
          
          // Здесь можно добавить логику обновления баланса друзей
        }
      }
      
      // Сохраняем данные локально
      setTimeout(() => {
        saveData();
      }, 100);
      
      // Обновляем баланс в БД
      if (dbUser && dbUser.id) {
        try {
          console.log(`Отправка запроса на обновление баланса для пользователя ${dbUser.id}, новый баланс: ${newBalance.toFixed(2)}`);
          
          // Проверяем, что баланс - это действительное число
          if (isNaN(newBalance)) {
            console.error('Ошибка: Баланс не является числом', newBalance);
            return { success: false, error: 'Некорректное значение баланса' };
          }
          
          // Используем updateUserBalance из userService.js
          const updatedUser = await updateUserBalance(dbUser.id, newBalance.toFixed(2));
          
          if (updatedUser) {
            setDbUser(updatedUser);
            console.log('Баланс успешно обновлен в БД:', updatedUser.balance);
          } else {
            console.warn('Не удалось обновить баланс в БД, но локальные данные сохранены');
          }
        } catch (error) {
          console.error('Ошибка при обновлении баланса в БД:', error);
          // Continue execution even if DB update fails
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Ошибка при обновлении баланса:', error);
      return { success: false, error: error.message };
    }
  };

  // Покупка предмета
  const buyItem = async (item) => {
    try {
      console.log('Попытка покупки предмета:', item);
      
      // Получаем актуальный баланс из базы данных перед покупкой
      let currentBalance = balance;
      
      if (dbUser && dbUser.id) {
        try {
          const updatedUser = await getUserByTelegramId(userData.userId);
          if (updatedUser) {
            currentBalance = parseFloat(updatedUser.balance || balance);
            console.log('Получен актуальный баланс из БД перед покупкой:', currentBalance);
            // Обновляем локальный баланс
            setBalance(currentBalance);
          }
        } catch (error) {
          console.error('Ошибка при получении актуального баланса из БД:', error);
        }
      }
      
      if (currentBalance < item.price) {
        console.log('Недостаточно средств для покупки');
        return { success: false, error: 'Недостаточно средств' };
      }
      
      // Списываем средства
      const newBalance = currentBalance - item.price;
      setBalance(newBalance);
      console.log(`Баланс после покупки: ${newBalance}`);
      
      // Нормализуем ID предмета (может быть строкой или числом)
      const itemId = typeof item.id === 'string' && !isNaN(parseInt(item.id)) ? parseInt(item.id) : item.id;
      
      // Проверяем, есть ли уже такой предмет (проверяем оба варианта ID)
      const existingItemIndex = items.findIndex(i => 
        i.id === itemId || 
        (typeof i.id === 'string' && typeof itemId === 'number' && parseInt(i.id) === itemId) ||
        (typeof i.id === 'number' && typeof itemId === 'string' && i.id === parseInt(itemId))
      );
      console.log(`Существующий предмет с индексом: ${existingItemIndex}`);
      
      if (existingItemIndex !== -1) {
        // Если предмет уже есть, увеличиваем его количество
        const updatedItems = [...items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: (updatedItems[existingItemIndex].quantity || 1) + 1
        };
        setItems(updatedItems);
        console.log('Обновлен существующий предмет:', updatedItems[existingItemIndex]);
      } else {
        // Если предмета нет, добавляем его с количеством 1
        const newItem = { 
          ...item, 
          id: itemId, // Используем нормализованный ID
          quantity: 1,
          // Убедимся, что у предмета есть поле income_per_hour для совместимости с БД
          income_per_hour: item.income_per_hour || item.income || 0
        };
        setItems([...items, newItem]);
        console.log('Добавлен новый предмет:', newItem);
      }
      
      // Пересчитываем доход
      const newItems = existingItemIndex !== -1 
        ? [...items.slice(0, existingItemIndex), 
           {...items[existingItemIndex], quantity: (items[existingItemIndex].quantity || 1) + 1}, 
           ...items.slice(existingItemIndex + 1)]
        : [...items, { 
            ...item, 
            id: itemId, 
            quantity: 1,
            income_per_hour: item.income_per_hour || item.income || 0
          }];
        
      const newIncome = newItems.reduce((sum, item) => {
        return sum + (parseFloat(item.income_per_hour || item.income || 0) * (item.quantity || 1));
      }, 0);
      
      setDailyIncome(newIncome);
      console.log(`Новый почасовой доход: ${newIncome} VL/час (${newIncome * 24} VL/день)`);
      
      // Сохраняем данные локально
      setTimeout(async () => {
        await saveData();
      }, 100);
      
      // Обновляем баланс и предметы в БД в одной операции (покупка)
      if (dbUser && dbUser.id) {
        try {
          const response = await executeApiRequest(`/users/${dbUser.id}/purchase`, 'POST', {
            itemId: itemId,
            expectedPrice: item.price
          });
          if (response && response.success) {
            // Синхронизируем баланс и предметы с ответом сервера
            setBalance(parseFloat(response.balance));
            if (Array.isArray(response.userItems)) {
              const formattedItems = response.userItems.map(userItem => {
                const item = userItem.item;
                return {
                  id: item.id,
                  name: item.name,
                  description: item.description,
                  price: item.price,
                  income_per_hour: item.income_per_hour,
                  image_url: item.image_url,
                  type: item.type,
                  quantity: userItem.quantity
                };
              });
              setItems(formattedItems);
            }
          } else {
            console.error('Ошибка покупки на сервере', response);
            return { success: false, error: response?.error || 'Ошибка покупки' };
          }
        } catch (error) {
          console.error('Ошибка при покупке предмета на сервере:', error);
          return { success: false, error: error.message };
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Ошибка при покупке предмета:', error);
      return { success: false, error: error.message };
    }
  };

  // Отправка запроса в друзья
  const sendFriendRequestHandler = async (friendId) => {
    try {
      if (!dbUser || !userData || !userData.userId) {
        return { success: false, error: 'Нет данных пользователя' };
      }
      
      const response = await sendFriendRequest(userData.userId, friendId);

      if (response && response.success) {
        // Если запрос успешно отправлен, обновляем данные о друзьях
        console.log('Запрос в друзья успешно отправлен, обновляем данные о друзьях');
        
        // Загружаем данные о друзьях принудительно
        try {
          // Загружаем список друзей
          const friendsList = await getFriends(userData.userId);
          console.log('Загружены друзья после отправки запроса:', friendsList);
          setFriends(friendsList || []);
          
          // Загружаем запросы в друзья
          const requests = await getFriendRequests(userData.userId);
          console.log('Загружены запросы в друзья после отправки запроса:', requests);
          setFriendRequests(requests || []);
        } catch (error) {
          console.error('Ошибка при обновлении данных о друзьях после отправки запроса:', error);
        }
      }
      
      return response || { success: false, error: 'Неизвестная ошибка' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Принятие запроса в друзья
  const acceptFriendRequest = async (friendId) => {
    try {
      if (!dbUser || !userData || !userData.userId) {
        return { success: false, error: 'Нет данных пользователя' };
      }
      
      const response = await acceptFriendRequestDb(userData.userId, friendId);

      if (response && response.success) {
        // Если запрос успешно принят, обновляем данные о друзьях
        console.log('Запрос в друзья успешно принят, обновляем данные о друзьях');
        
        // Загружаем данные о друзьях принудительно
        try {
          // Загружаем список друзей
          const friendsList = await getFriends(userData.userId);
          console.log('Загружены друзья после принятия запроса:', friendsList);
          setFriends(friendsList || []);
          
          // Загружаем запросы в друзья
          const requests = await getFriendRequests(userData.userId);
          console.log('Загружены запросы в друзья после принятия запроса:', requests);
          setFriendRequests(requests || []);
        } catch (error) {
          console.error('Ошибка при обновлении данных о друзьях после принятия запроса:', error);
        }
        
        setTimeout(() => {
          saveData();
        }, 100);
        
        await updateBalance(100, 50); // 100 VL и 50 XP за нового друга
      }
      
      return response || { success: false, error: 'Неизвестная ошибка' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Отклонение запроса в друзья
  const rejectFriendRequest = async (friendId) => {
    try {
      if (!dbUser || !userData || !userData.userId) {
        return { success: false, error: 'Нет данных пользователя' };
      }
      
      const response = await rejectFriendRequestDb(userData.userId, friendId);

      if (response && response.success) {
        // Если запрос успешно отклонен, обновляем данные о друзьях
        console.log('Запрос в друзья успешно отклонен, обновляем данные о друзьях');
        
        // Загружаем данные о друзьях принудительно
        try {
          // Загружаем список друзей
          const friendsList = await getFriends(userData.userId);
          console.log('Загружены друзья после отклонения запроса:', friendsList);
          setFriends(friendsList || []);
          
          // Загружаем запросы в друзья
          const requests = await getFriendRequests(userData.userId);
          console.log('Загружены запросы в друзья после отклонения запроса:', requests);
          setFriendRequests(requests || []);
        } catch (error) {
          console.error('Ошибка при обновлении данных о друзьях после отклонения запроса:', error);
        }
        
        setTimeout(() => {
          saveData();
        }, 100);
      }
      
      return response || { success: false, error: 'Неизвестная ошибка' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Обработка обновления профиля
  const handleProfileUpdate = (updates) => {
    setUserData(prev => ({ ...prev, ...updates }));
    
    // Сохраняем данные локально
    setTimeout(() => {
      saveData();
    }, 100);
  };

  // Performance logging effect
  useEffect(() => {
    performanceTrackingRef.current.renderCount++;
    
    if (performanceTrackingRef.current.renderCount % 10 === 0) {
      const renderTime = performance.now() - performanceTrackingRef.current.loadStartTime;
      console.group('App Performance');
      console.log(`Total renders: ${performanceTrackingRef.current.renderCount}`);
      console.log(`Cumulative render time: ${renderTime.toFixed(2)}ms`);
      console.groupEnd();
    }
  });

  // Функция для обновления друзей и запросов - вызывается только при переходе на экран друзей
  const handleFriendsScreenLoad = useCallback(() => {
    if (userData && userData.userId && currentScreen === 'friends') {
      // Всегда загружаем данные о друзьях при переходе на экран друзей
      console.log('Загрузка данных о друзьях при переходе на экран друзей');
      loadFriendsData(userData.userId, true); // Принудительное обновление
    }
  }, [userData, currentScreen, loadFriendsData]);

  // Эффект для одноразовой загрузки данных о друзьях при входе на экран друзей (без интервала)
  useEffect(() => {
    if (currentScreen === 'friends') {
      handleFriendsScreenLoad();
    }
  }, [currentScreen, handleFriendsScreenLoad]);

  // Обработчик использования артефакта
  const handleUseArtifact = (artifact) => {
    console.log('Использован артефакт:', artifact);
    
    // Здесь можно добавить логику эффектов артефактов
    // Например, временное увеличение дохода, бонус к опыту и т.д.
    
    // Пример: бонус к опыту
    if (artifact.effect && artifact.effect.includes('опыт')) {
      updateBalance(0, 50); // Добавляем 50 опыта
    }
    
    // Пример: бонус к доходу
    if (artifact.effect && artifact.effect.includes('доход')) {
      updateBalance(100, 0); // Добавляем 100 VL
    }
  };

  // Memoized screen rendering to prevent unnecessary re-renders
  const renderScreen = useMemo(() => {
    if (loading) {
      return <div>Loading...</div>; // Changed from LoadingSpinner to a simple div
    }

    const screenProps = {
      home: { onTap: () => updateBalance(0.01), balance, dailyIncome },
      earn: { onComplete: (reward) => updateBalance(reward) },
      farm: { balance, updateBalance },
      tasks: { onComplete: (reward) => updateBalance(reward) },
      shop: { balance, items, onBuy: buyItem },
      friends: { 
        userData, 
        friends, 
        friendRequests, 
        onSendRequest: sendFriendRequestHandler,
        onAcceptRequest: acceptFriendRequest,
        onRejectRequest: rejectFriendRequest,
        onLoadFriends: handleFriendsScreenLoad
      },
      profile: { 
        userData, 
        balance, 
        exp, 
        level, 
        nextLevelExp: calculateNextLevelExp(level),
        items,
        onUpdate: handleProfileUpdate
      },
      fun: { balance, onPlay: (amount) => updateBalance(amount) },
      artifacts: { items, balance, onUseArtifact: handleUseArtifact }
    };

    const screenComponents = {
      home: HomeScreen,
      earn: EarnScreen,
      farm: FarmScreen,
      tasks: TasksScreen,
      shop: ShopScreen,
      friends: FriendsScreen,
      profile: ProfileScreen,
      fun: FunScreen,
      artifacts: ArtifactsScreen
    };

    const Screen = screenComponents[currentScreen] || HomeScreen;
    return <Screen {...screenProps[currentScreen]} />;
  }, [
    loading, 
    currentScreen, 
    balance, 
    dailyIncome, 
    items, 
    friends, 
    friendRequests, 
    userData, 
    exp, 
    level, 
    calculateNextLevelExp,
    handleFriendsScreenLoad,
    handleUseArtifact
  ]);

  // Create cryptids in the background
  const createCryptids = () => {
    // Очищаем предыдущие криптиды, если они есть
    const existingLayer = document.querySelector('.cryptid-layer');
    if (existingLayer) {
      existingLayer.remove();
    }
    
    const cryptidLayer = document.createElement('div');
    cryptidLayer.className = 'cryptid-layer';
    document.body.appendChild(cryptidLayer);
    
    // Ограничиваем количество криптидов для улучшения производительности
    const maxCryptids = window.innerWidth < 768 ? 3 : 5;
    
    for (let i = 0; i < maxCryptids; i++) {
      const cryptid = document.createElement('div');
      cryptid.className = 'cryptid';
      
      // Случайное положение
      const posX = Math.random() * 90 + 5; // 5-95%
      const posY = Math.random() * 80 + 10; // 10-90%
      
      // Случайная задержка появления
      const delay = Math.random() * 30000; // 0-30 секунд
      
      // Стили
      Object.assign(cryptid.style, {
        left: `${posX}%`,
        top: `${posY}%`,
        backgroundImage: `url('/images/cryptid${i % 3 + 1}.png')`,
        animationDelay: `${delay}ms`
      });
      
      cryptidLayer.appendChild(cryptid);
      
      // Автоматически удаляем криптида через 30 секунд для экономии памяти
      setTimeout(() => {
        if (cryptid.parentNode) {
          cryptid.parentNode.removeChild(cryptid);
        }
      }, 30000 + delay);
    }
  };

  // Play guitar sound
  const playGuitar = () => {
    if (guitarAudioRef.current) {
      setPlayingGuitar(true);
      guitarAudioRef.current.currentTime = 0;
      guitarAudioRef.current.play();
      
      setTimeout(() => {
        setPlayingGuitar(false);
      }, 3000);
    }
  };

  // Toggle balance details
  const toggleBalanceDetails = () => {
    setShowBalanceDetails(!showBalanceDetails);
  };

  // Set current screen
  const setScreen = (screenId) => {
    // GSAP-like page transition via anime.js
    const overlay = document.getElementById('page-transition');
    if (overlay) {
      overlay.style.opacity = 0;
      anime({ targets: overlay, opacity: [0, 1], duration: 120, easing: 'easeInQuad', complete: () => {
        setCurrentScreen(screenId);
        anime({ targets: overlay, opacity: [1, 0], duration: 200, easing: 'easeOutQuad' });
      }});
      // Analytics
      if (window.gtag) {
        window.gtag('event', 'screen_view', { screen_name: screenId });
      }
      return;
    }
    setCurrentScreen(screenId);
    // Track screen change
    if (window.gtag) {
      window.gtag('event', 'screen_view', {
        screen_name: screenId
      });
    }
  };

  // Функция для начисления пассивного дохода
  const applyPassiveIncome = useCallback(async () => {
    try {
      console.log('Начисление пассивного дохода...');
      
      // Проверяем, есть ли доход для начисления
      if (!dailyIncome || dailyIncome <= 0) {
        console.log('Нет пассивного дохода для начисления');
        return;
      }
      
      // Проверяем, прошел ли час с последнего начисления
      const lastIncomeTime = localStorage.getItem('lastIncomeTime');
      const now = Date.now();
      
      if (lastIncomeTime) {
        const timeSinceLastIncome = now - parseInt(lastIncomeTime, 10);
        const oneHour = 60 * 60 * 1000; // 1 час в миллисекундах
        
        if (timeSinceLastIncome < oneHour) {
          const minutesLeft = Math.ceil((oneHour - timeSinceLastIncome) / (60 * 1000));
          console.log(`До следующего начисления осталось ${minutesLeft} минут`);
          return { success: false, message: `До следующего начисления осталось ${minutesLeft} минут` };
        }
      }
      
      // Сначала получаем актуальный баланс пользователя из базы данных
      if (dbUser && dbUser.id) {
        try {
          // Запрашиваем актуальные данные пользователя из базы
          const updatedUser = await getUserByTelegramId(userData.userId);
          
          if (updatedUser) {
            // Обновляем локальный баланс из базы данных
            const dbBalance = parseFloat(updatedUser.balance || 0);
            setBalance(dbBalance);
            console.log(`Баланс обновлен из базы данных: ${dbBalance.toFixed(2)}`);
            
            // Обновляем опыт и уровень, если они изменились
            if (updatedUser.exp !== undefined && updatedUser.exp !== exp) {
              const newExp = parseFloat(updatedUser.exp);
              setExp(newExp);
              const newLevel = calculateLevel(newExp);
              setLevel(newLevel);
            }
          }
        } catch (error) {
          console.error('Ошибка при получении актуальных данных пользователя:', error);
        }
      }
      
      // Рассчитываем доход на основе предметов
      let hourlyIncome = 0;
      
      // Базовый доход
      const baseIncome = 5.0;
      
      // Доход от предметов
      if (items && items.length > 0) {
        hourlyIncome = items.reduce((sum, item) => {
          // Проверяем, есть ли у предмета свойство income_per_hour или income
          const itemIncome = parseFloat(item.income_per_hour || item.income || 0) * (item.quantity || 1);
          console.log(`Пассивный доход от предмета ${item.name}: ${itemIncome} VL/час (${item.income_per_hour || item.income} × ${item.quantity || 1})`);
          return sum + itemIncome;
        }, 0);
      }
      
      // Если нет дохода от предметов, используем базовый
      if (hourlyIncome <= 0) {
        hourlyIncome = baseIncome;
        console.log(`Используем базовый доход: ${baseIncome} VL/час`);
      } else {
        console.log(`Общий доход от предметов: ${hourlyIncome} VL/час`);
      }
      
      // Добавляем доход от друзей: 2 VL за каждого друга
      if (friends && friends.length > 0) {
        hourlyIncome += friends.length * 2.0;
      }
      
      // Добавляем доход за уровень: 1 VL за каждый уровень выше 1
      if (level > 1) {
        hourlyIncome += (level - 1) * 1.0;
      }
      
      // Обновляем баланс
      const newBalance = balance + hourlyIncome;
      setBalance(newBalance);
      
      // Показываем уведомление о начислении дохода
      setBalanceChange(`+${hourlyIncome.toFixed(2)}`);
      setTimeout(() => {
        setBalanceChange(null);
      }, 3000);
      
      // Сохраняем время последнего начисления
      localStorage.setItem('lastIncomeTime', now.toString());
      
      // Обновляем баланс в базе данных
      if (dbUser && dbUser.id) {
        try {
          console.log(`Обновление баланса в БД: ${balance} + ${hourlyIncome} = ${newBalance}`);
          const updatedUser = await updateUserBalance(dbUser.id, newBalance);
          
          if (updatedUser) {
            setDbUser(updatedUser);
            console.log('Баланс успешно обновлен в БД после начисления дохода:', updatedUser.balance);
          }
        } catch (error) {
          console.error('Ошибка при обновлении баланса в БД:', error);
        }
      }
      
      // Сохраняем обновленные данные локально
      setTimeout(async () => {
        await saveData();
      }, 100);
      
      return { success: true, hourlyIncome };
    } catch (error) {
      console.error('Ошибка при начислении пассивного дохода:', error);
      return { success: false, error: error.message };
    }
  }, [dailyIncome, dbUser, balance, items, friends, level, saveData, userData.userId, calculateLevel, exp]);

  // Запускаем начисление пассивного дохода при загрузке и каждый час
  useEffect(() => {
    if (loading || !userData.userId) return;
    
    console.log('Запуск системы пассивного дохода');
    
    // Начисляем доход при загрузке только если прошел час с последнего начисления
    applyPassiveIncome();
    
    // Устанавливаем интервал для проверки каждый час
    const incomeInterval = setInterval(() => {
      applyPassiveIncome();
    }, 60 * 60 * 1000); // 1 час
    
    return () => clearInterval(incomeInterval);
  }, [loading, userData.userId, applyPassiveIncome]);

  // Обработчик клика по карте Таро
  const handleTarotCardClick = (screenId) => {
    if (screenId) {
      setScreen(screenId);
    }
  };
  
  // Обработчик переключения темы
  const toggleTheme = () => {
    const themes = ['mystical', 'cosmic', 'ethereal'];
    const currentIndex = themes.indexOf(visualTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setVisualTheme(themes[nextIndex]);
  };
  
  // Обработчик переключения звука
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  // High contrast toggle
  const [highContrast, setHighContrast] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [highContrast]);

  // Animate energy orb flying to the balance counter
  useEffect(() => {
    const handler = (e) => {
      const layer = document.getElementById('energy-orb-layer');
      if (!layer) return;
      const { x, y } = e.detail || {};
      const orb = document.createElement('div');
      Object.assign(orb.style, {
        position: 'fixed',
        left: x + 'px',
        top: y + 'px',
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, #A8C7FA, #1A3C34)',
        boxShadow: '0 0 15px rgba(168,199,250,0.8)'
      });
      layer.appendChild(orb);
      // Target roughly center of the balance control in header
      const header = document.querySelector('.app-header');
      const targetRect = header ? header.getBoundingClientRect() : { left: window.innerWidth/2, top: 20, width: 100, height: 40 };
      const tx = targetRect.left + targetRect.width/2;
      const ty = targetRect.top + targetRect.height/2;
      anime({
        targets: orb,
        translateX: tx - x,
        translateY: ty - y,
        scale: [1, 0.6],
        easing: 'easeInOutQuad',
        duration: 600,
        complete: () => {
          if (orb && orb.parentNode) orb.parentNode.removeChild(orb);
        }
      });
    };
    window.addEventListener('energy-collected', handler);
    return () => window.removeEventListener('energy-collected', handler);
  }, []);

  // Show Magic Circle VFX when portal opens
  const [showCircle, setShowCircle] = useState(false);
  useEffect(() => {
    const portalOpenListener = () => {
      setShowCircle(true);
      setTimeout(() => setShowCircle(false), 1100);
    };
    window.addEventListener('portal-opened', portalOpenListener);
    return () => window.removeEventListener('portal-opened', portalOpenListener);
  }, []);

  return (
    <div className="app-container">
      {/* Energy orbs to balance counter */}
      <div id="energy-orb-layer" style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex: 5 }} />
      {/* Page transition overlay */}
      <div id="page-transition" className="page-transition-overlay" />
      <MagicCircleVFX show={showCircle} color="#A8C7FA" />
      <MagicalBackground 
        theme={visualTheme} 
        soundEnabled={soundEnabled} 
        currentScreen={currentScreen}
        onCardClick={handleTarotCardClick}
        paused={currentScreen === 'farm'}
      />
      {loading ? (
        <div className="loading-screen">
          <div className="forest-background"></div>
          <div className="loader"></div>
          <QuillTextEffect 
            text="Открываем книгу мистического пространства..." 
            fontSize="1.5rem"
            speed={40}
            autoStart={true}
            style={{
              color: COLOR_PALETTE.beigeParchment,
              maxWidth: '80%',
              margin: '20px auto',
              textAlign: 'center'
            }}
          />
        </div>
      ) : (
        <>
          <div className="forest-background"></div>
          
          {/* Candles */}
          <div className="candle candle-left"></div>
          <div className="candle candle-right"></div>
          
          <div className="app-header" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <GothicBalance 
              balance={balance} 
              incomePerHour={dailyIncome}
              change={balanceChange}
              onClick={toggleBalanceDetails}
              symbol={currentScreen === 'farm' ? '☽' : currentScreen === 'artifacts' ? '♦' : currentScreen === 'shop' ? '♱' : '✦'}
              progress={Math.min(1, (exp || 0) / (calculateNextLevelExp(level) || 1))}
            />
          </div>
          
          {/* Balance Details Modal */}
          {showBalanceDetails && (
            <div className="modal-overlay" onClick={() => setShowBalanceDetails(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3>Ваша энергия</h3>
                <div className="balance-details">
                  <div className="balance-detail-item">
                    <span className="detail-label">Текущий баланс:</span>
                    <span className="detail-value">{balance.toFixed(2)} ✦</span>
                  </div>
                  <div className="balance-detail-item">
                    <span className="detail-label">Ежедневный доход:</span>
                    <span className="detail-value">{(dailyIncome * 24).toFixed(2)} VL</span>
                  </div>
                  <div className="balance-detail-item">
                    <span className="detail-label">Почасовой доход:</span>
                    <span className="detail-value">{dailyIncome.toFixed(2)} VL</span>
                  </div>
                  <div className="balance-detail-item">
                    <span className="detail-label">Уровень:</span>
                    <span className="detail-value">{level}</span>
                  </div>
                  <div className="balance-detail-item">
                    <span className="detail-label">Заработано нажатиями:</span>
                    <span className="detail-value">0.01 ✦ / нажатие</span>
                  </div>
                  <div className="balance-detail-item">
                    <span className="detail-label">Комбо бонус:</span>
                    <span className="detail-value">x2 после 5 нажатий</span>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={() => setShowBalanceDetails(false)}>
                  Закрыть
                </button>
              </div>
            </div>
          )}
          
          <div className="app-main">
            {renderScreen}
          </div>
          
          <div className="app-footer">
            <NavBar currentScreen={currentScreen} setScreen={setScreen} />
          </div>
          
          {/* Guitar icon */}
          <div className={`guitar-icon ${playingGuitar ? 'playing' : ''}`} onClick={playGuitar}>
            <div className="guitar-strings"></div>
          </div>
          
          {/* Кнопки управления темой и звуком */}
          <div className="settings-controls">
            <div className="settings-stack">
              <MusicControl
                soundEnabled={soundEnabled}
                onSoundToggle={setSoundEnabled}
                position="inline"
                className="gothic-music-control"
              />
              <button 
                className="theme-toggle-btn" 
                onClick={toggleTheme}
                title="Сменить визуальную тему"
              >
                {visualTheme === 'mystical' ? '☽' : visualTheme === 'cosmic' ? '✧' : '⚝'}
              </button>
              <button 
                className="sound-toggle-btn" 
                onClick={toggleSound}
                title={soundEnabled ? "Выключить звук" : "Включить звук"}
              >
                {soundEnabled ? '♫' : '♪'}
              </button>
              <button 
                className="contrast-toggle-btn" 
                onClick={() => setHighContrast(v => !v)}
                title={highContrast ? 'Обычный контраст' : 'Высокий контраст'}
              >
                {highContrast ? 'HC' : 'hc'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
