import { executeApiRequest } from './database';
import config from '../config';

// API URL
const API_URL = config.api.baseUrl;

/**
 * Создает нового пользователя или обновляет существующего
 * @param {Object} userData - Данные пользователя
 * @returns {Promise<Object>} - Созданный или обновленный пользователь
 */
export const createOrUpdateUser = async (userData) => {
  try {
    console.log('Создание/обновление пользователя:', userData);
    const response = await executeApiRequest('/users', 'POST', userData);
    return response;
  } catch (error) {
    console.error('Ошибка при создании/обновлении пользователя:', error);
    throw error;
  }
};

/**
 * Получает пользователя по Telegram ID
 * @param {string} telegramId - Telegram ID пользователя
 * @returns {Promise<Object|null>} - Данные пользователя или null
 */
export const getUserByTelegramId = async (telegramId) => {
  try {
    const response = await executeApiRequest(`/users/by-telegram/${telegramId}`);
    return response;
  } catch (error) {
    // Если мы не в Telegram WebApp, не блокируем UI — вернём null и продолжим локально
    console.warn('Не удалось получить пользователя с сервера (возможно не Telegram WebApp):', error?.message || error);
    return null;
  }
};

/**
 * Проверяет существование пользователя по Telegram ID
 * @param {string} telegramId - Telegram ID пользователя
 * @returns {Promise<boolean>} - true если пользователь существует, иначе false
 */
export const checkUserExists = async (telegramId) => {
  try {
    console.log('Проверка существования пользователя с ID:', telegramId);
    const user = await getUserByTelegramId(telegramId);
    return !!user;
  } catch (error) {
    console.error('Ошибка при проверке существования пользователя:', error);
    return false;
  }
};

/**
 * Ищет пользователей по части Telegram ID или имени пользователя
 * @param {string} searchQuery - Поисковый запрос
 * @param {number} limit - Максимальное количество результатов
 * @returns {Promise<Array>} - Массив найденных пользователей
 */
export const searchUsers = async (searchQuery, limit = 10) => {
  try {
    if (!searchQuery) return [];
    
    const response = await executeApiRequest(`/users/search?q=${encodeURIComponent(searchQuery)}&limit=${limit}`);
    return response;
  } catch (error) {
    console.error('Ошибка при поиске пользователей:', error);
    return [];
  }
};

/**
 * Обновляет баланс пользователя
 * @param {string} userId - ID пользователя
 * @param {number|string} amount - Новый баланс пользователя
 * @returns {Promise<Object>} - Обновленные данные пользователя
 */
export const updateUserBalance = async (userId, amount) => {
  try {
    // Проверяем, что userId и amount определены
    if (!userId) {
      console.error('Ошибка: userId не указан');
      throw new Error('ID пользователя не указан');
    }
    
    // Преобразуем amount в число и проверяем его корректность
    const numericAmount = parseFloat(amount);
    
    if (isNaN(numericAmount)) {
      console.error('Ошибка: amount не является числом', amount);
      throw new Error('Некорректное значение баланса');
    }
    
    // Используем форматированное значение с двумя знаками после запятой
    const formattedAmount = numericAmount.toFixed(2);
    
    console.log(`Обновление баланса пользователя ${userId} на ${formattedAmount}`);
    
    // Реальный запрос к API
    const response = await executeApiRequest(`/users/${userId}/balance`, 'PUT', { 
      amount: formattedAmount 
    });
    
    return response;
  } catch (error) {
    console.error('Ошибка при обновлении баланса пользователя:', error);
    // Возвращаем объект с ошибкой вместо выбрасывания исключения
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Получает список всех пользователей
 * @returns {Promise<Array>} - Список пользователей
 */
export const getAllUsers = async () => {
  try {
    return await executeApiRequest('/users');
  } catch (error) {
    console.error('Ошибка при получении списка пользователей:', error);
    return [];
  }
}; 

// Получение предметов пользователя
export const getUserItems = async (userId) => {
  try {
    console.log(`Запрос предметов пользователя с ID: ${userId}`);
    const response = await executeApiRequest(`/users/${userId}/items`);
    console.log(`Получено ${response.length} предметов пользователя`);
    return response;
  } catch (error) {
    console.error('Ошибка при получении предметов пользователя:', error);
    // Возвращаем пустой массив в случае ошибки
    return [];
  }
}; 