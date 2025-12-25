// Добавляем функции для работы с Telegram-ботом

// Константа для username чата поддержки
const SUPPORT_CHAT_USERNAME = 'VL_BOT_SUPPORT';

// Константа для username бота поддержки
const SUPPORT_BOT_USERNAME = 'VLSupportBot';

// Функция открытия чата поддержки
export const openSupportChat = () => {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    // Открываем чат поддержки через ссылку Telegram
    const supportLink = `https://t.me/${SUPPORT_CHAT_USERNAME}`;
    
    // Если это веб-версия Telegram
    if (tg.platform === 'web') {
      window.open(supportLink, '_blank');
    } 
    // Если мобильное приложение Telegram
    else {
      tg.openTelegramLink(supportLink);
    }
  }
};

// Функция открытия бота поддержки
export const openSupportBot = () => {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    // Создаем ссылку для открытия бота поддержки
    const supportBotLink = `https://t.me/${SUPPORT_BOT_USERNAME}`;
    
    // Если это веб-версия Telegram
    if (tg.platform === 'web') {
      window.open(supportBotLink, '_blank');
    } 
    // Если мобильное приложение Telegram
    else {
      tg.openTelegramLink(supportBotLink);
    }

    // Дополнительное уведомление
    tg.HapticFeedback.impactOccurred('light');
  }
};

// Обновляем функцию создания главного меню
export const createMainMenuButtons = () => {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    // Главная кнопка
    tg.MainButton.setText('Начать путешествие');
    tg.MainButton.show();
    tg.MainButton.onClick(() => {
      tg.MainButton.hide();
    });

    // Создаем кнопку поддержки
    const supportButton = tg.BackButton;
    supportButton.setText('Поддержка 🆘');
    supportButton.show();
    supportButton.onClick(openSupportBot);

    // Стилизация
    tg.setBackgroundColor('#1B263B');
    tg.MainButton.color = '#3C2F4F';
  }
};

// Отправляем приветственное сообщение
export const sendWelcomeMessage = (userData) => {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    const welcomeText = `
🌟 Привет, ${userData.firstName}! 

Добро пожаловать в мистический мир VL-BOT 🔮

Здесь ты сможешь:
✨ Собирать магическую энергию
📔 Вести личный дневник мага
🏆 Развиваться и получать награды

Нажми "Начать путешествие", чтобы начать свой мистический путь!
    `;

    // Показываем приветственное сообщение
    tg.sendMessage(welcomeText);
  }
};

let currentInitData = null;

export const getTelegramInitData = () => currentInitData;

// Обновляем существующую функцию инициализации
export const initTelegramApp = () => {
  try {
    // Check if we're in Telegram WebApp environment
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      // Initialize and expand the WebApp
      tg.ready();
      tg.expand();

      // Get user data from Telegram
      const user = tg.initDataUnsafe?.user;
      if (!user?.id) {
        console.warn("Telegram user data not available");
        return createDevUser();
      }

      // Store init data for backend auth
      currentInitData = tg.initData || null;

      // Return user data
      return {
        userId: user.id.toString(),
        firstName: user.first_name || "User",
        username: user.username || "",
        theme: tg.colorScheme || "dark",
        isTelegram: true,
        initData: currentInitData
      };
    }
  } catch (error) {
    console.error("Error initializing Telegram WebApp:", error);
  }

  return createDevUser();
};

// Helper function to create a development user
const createDevUser = () => {
  const devId = Math.floor(Math.random() * 1000000).toString();
  return {
    userId: `dev-${devId}`,
    firstName: "Developer",
    username: "dev",
    theme: "dark",
    isTelegram: false,
    initData: null
  };
};

// Save data to storage
export const saveToStorage = async (key, data) => {
  try {
    const tg = window.Telegram?.WebApp;
    const storage = tg?.CloudStorage;
    
    if (storage) {
      await new Promise((resolve, reject) => {
        storage.setItem(key, JSON.stringify(data), (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    } else {
      localStorage.setItem(key, JSON.stringify(data));
    }
    return true;
  } catch (error) {
    console.error("Storage error:", error);
    return false;
  }
};

// Load data from storage
export const loadFromStorage = async (key) => {
  try {
    const tg = window.Telegram?.WebApp;
    const storage = tg?.CloudStorage;

    if (storage) {
      const value = await new Promise((resolve, reject) => {
        storage.getItem(key, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
      });
      return value ? JSON.parse(value) : null;
    }
    
    const localData = localStorage.getItem(key);
    return localData ? JSON.parse(localData) : null;
  } catch (error) {
    console.error("Load error:", error);
    return null;
  }
};