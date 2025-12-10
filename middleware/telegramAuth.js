const crypto = require('crypto');

/**
 * Middleware для проверки аутентичности данных Telegram WebApp
 * Основан на официальной документации Telegram WebApp
 */

/**
 * Проверяет подпись данных Telegram WebApp
 * @param {string} initData - Строка с данными инициализации
 * @param {string} botToken - Токен бота
 * @returns {boolean} - true если подпись корректна
 */
function verifyTelegramWebAppData(initData, botToken) {
  try {
    // Парсим данные
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    
    // Сортируем параметры
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    // Создаем секретный ключ
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();
    
    // Создаем подпись
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
    
    return calculatedHash === hash;
  } catch (error) {
    console.error('Ошибка при проверке подписи Telegram WebApp:', error);
    return false;
  }
}

/**
 * Парсит данные пользователя из Telegram WebApp
 * @param {string} initData - Строка с данными инициализации
 * @returns {object|null} - Данные пользователя или null
 */
function parseTelegramWebAppData(initData) {
  try {
    const urlParams = new URLSearchParams(initData);
    const userParam = urlParams.get('user');
    
    if (!userParam) {
      return null;
    }
    
    const userData = JSON.parse(decodeURIComponent(userParam));
    
    return {
      id: userData.id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      username: userData.username,
      language_code: userData.language_code,
      is_premium: userData.is_premium || false
    };
  } catch (error) {
    console.error('Ошибка при парсинге данных Telegram WebApp:', error);
    return null;
  }
}

/**
 * Middleware для проверки аутентификации Telegram WebApp
 * @param {boolean} strict - Строгий режим (обязательная проверка)
 */
function telegramWebAppAuth(strict = false) {
  return (req, res, next) => {
    // В режиме разработки можем пропускать проверку
    if (process.env.NODE_ENV === 'development' && !strict) {
      req.user = {
        id: '7121428208', // Тестовый пользователь
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        is_premium: false
      };
      return next();
    }
    
    const authHeader = req.headers.authorization;
    const initData = req.headers['x-telegram-init-data'];
    
    // Проверяем наличие данных аутентификации
    if (!initData && !authHeader) {
      if (strict) {
        return res.status(401).json({
          error: 'Требуется аутентификация',
          message: 'Отсутствуют данные Telegram WebApp'
        });
      }
      return next();
    }
    
    // Используем данные из заголовка
    const dataToVerify = initData || (authHeader && authHeader.replace('Bearer ', ''));
    
    if (!dataToVerify) {
      return res.status(401).json({
        error: 'Некорректные данные аутентификации'
      });
    }
    
    // Проверяем подпись (используем токен основного бота)
    const botToken = process.env.MAIN_BOT_TOKEN;
    
    if (!botToken) {
      console.error('Отсутствует токен бота для проверки подписи');
      if (strict) {
        return res.status(500).json({
          error: 'Ошибка конфигурации сервера'
        });
      }
      return next();
    }
    
    // Проверяем подпись
    const isValid = verifyTelegramWebAppData(dataToVerify, botToken);
    
    if (!isValid) {
      return res.status(401).json({
        error: 'Некорректная подпись данных',
        message: 'Данные Telegram WebApp не прошли проверку подписи'
      });
    }
    
    // Парсим данные пользователя
    const userData = parseTelegramWebAppData(dataToVerify);
    
    if (!userData) {
      return res.status(401).json({
        error: 'Некорректные данные пользователя'
      });
    }
    
    // Проверяем время действия данных (опционально)
    const urlParams = new URLSearchParams(dataToVerify);
    const authDate = urlParams.get('auth_date');
    
    if (authDate) {
      const authTimestamp = parseInt(authDate) * 1000;
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 часа
      
      if (now - authTimestamp > maxAge) {
        return res.status(401).json({
          error: 'Данные аутентификации устарели',
          message: 'Необходимо обновить страницу'
        });
      }
    }
    
    // Добавляем данные пользователя в запрос
    req.user = userData;
    req.telegramData = {
      raw: dataToVerify,
      verified: true,
      auth_date: authDate
    };
    
    next();
  };
}

/**
 * Middleware для проверки роли администратора
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Требуется аутентификация'
    });
  }
  
  // Проверяем, является ли пользователь администратором
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map(id => id.trim());
  
  if (!adminIds.includes(req.user.id.toString())) {
    return res.status(403).json({
      error: 'Недостаточно прав',
      message: 'Требуются права администратора'
    });
  }
  
  next();
}

/**
 * Middleware для логирования запросов аутентификации
 */
function logAuth(req, res, next) {
  const timestamp = new Date().toISOString();
  const userInfo = req.user ? `User ${req.user.id} (${req.user.username || req.user.first_name})` : 'Anonymous';
  const ip = req.ip || req.connection.remoteAddress;
  
  console.log(`[${timestamp}] AUTH: ${userInfo} - ${req.method} ${req.originalUrl} from ${ip}`);
  next();
}

module.exports = {
  telegramWebAppAuth,
  requireAdmin,
  logAuth,
  verifyTelegramWebAppData,
  parseTelegramWebAppData
};