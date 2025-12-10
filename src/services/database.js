// Подключение к MongoDB через API запросы
import config from '../config';
import { getTelegramInitData } from './telegram';

// URL для API
const API_URL = config.api.baseUrl;

/**
 * Выполняет запрос к API сервера
 * @param {string} endpoint - Конечная точка API
 * @param {string} method - HTTP метод
 * @param {object} body - Тело запроса
 * @returns {Promise} - Результат запроса
 */
export const executeApiRequest = async (endpoint, method = 'GET', body = null) => {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    // Attach Telegram WebApp init data for auth (if available)
    const initData = getTelegramInitData?.() || null;
    if (initData) {
      options.headers['x-telegram-init-data'] = initData;
    }

    console.log(`Выполнение API запроса: ${API_URL}${endpoint}`, options);
    
    // Таймаут, чтобы не зависать бесконечно
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    options.signal = controller.signal;

    // Для реальных запросов к API
    const response = await fetch(`${API_URL}${endpoint}`, options).catch((e) => {
      console.error('Сетевой сбой при запросе к API:', e);
      throw e;
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`API request failed: ${response.status} ${text}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Ошибка при выполнении API запроса:', error);
    throw error;
  }
};

/**
 * Получает все данные пользователей из базы данных
 * @returns {Promise<Array>} - Массив пользователей
 */
export const getAllUsersData = async () => {
  try {
    const users = await executeApiRequest('/users');
    console.log('Все пользователи в базе данных:', users);
    return users;
  } catch (error) {
    console.error('Ошибка при получении данных пользователей:', error);
    return [];
  }
};

/**
 * Отправляет запрос в друзья
 * @param {string} fromUserId - ID отправителя запроса
 * @param {string} toUserId - ID получателя запроса
 * @returns {Promise<Object>} - Результат операции
 */
export const sendFriendRequest = async (fromUserId, toUserId) => {
  try {
    console.log(`Отправка запроса в друзья от ${fromUserId} к ${toUserId}`);
    const result = await executeApiRequest('/friends/request', 'POST', { fromUserId, toUserId });
    return result;
  } catch (error) {
    console.error('Ошибка при отправке запроса в друзья:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Получает все запросы в друзья для пользователя
 * @param {string} userId - ID пользователя
 * @returns {Promise<Array>} - Массив запросов в друзья
 */
export const getFriendRequests = async (userId) => {
  try {
    console.log(`Получение запросов в друзья для пользователя ${userId}`);
    return await executeApiRequest(`/friends/requests/telegram/${userId}`);
  } catch (error) {
    console.error('Ошибка при получении запросов в друзья:', error);
    return [];
  }
};

/**
 * Принимает запрос в друзья
 * @param {string} userId - ID пользователя, принимающего запрос
 * @param {string} friendId - ID пользователя, отправившего запрос
 * @returns {Promise<Object>} - Результат операции
 */
export const acceptFriendRequest = async (userId, friendId) => {
  try {
    console.log(`Принятие запроса в друзья от ${friendId} для ${userId}`);
    const result = await executeApiRequest('/friends/accept', 'POST', { userId, friendId });
    return result;
  } catch (error) {
    console.error('Ошибка при принятии запроса в друзья:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Отклоняет запрос в друзья
 * @param {string} userId - ID пользователя, отклоняющего запрос
 * @param {string} friendId - ID пользователя, отправившего запрос
 * @returns {Promise<Object>} - Результат операции
 */
export const rejectFriendRequest = async (userId, friendId) => {
  try {
    console.log(`Отклонение запроса в друзья от ${friendId} для ${userId}`);
    const result = await executeApiRequest('/friends/reject', 'POST', { userId, friendId });
    return result;
  } catch (error) {
    console.error('Ошибка при отклонении запроса в друзья:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Получает список друзей пользователя
 * @param {string} userId - ID пользователя
 * @returns {Promise<Array>} - Массив друзей
 */
export const getFriends = async (userId) => {
  try {
    console.log(`Получение списка друзей для пользователя ${userId}`);
    return await executeApiRequest(`/friends/telegram/${userId}`);
  } catch (error) {
    console.error('Ошибка при получении друзей:', error);
    return [];
  }
};