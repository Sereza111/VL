import { executeApiRequest } from './database';
import { updateUserBalance } from './userService';

/**
 * Создает новую задачу
 * @param {Object} taskData - Данные задачи
 * @returns {Promise<Object>} - Созданная задача
 */
export const createTask = async (taskData) => {
  try {
    return await executeApiRequest('/tasks', 'POST', taskData);
  } catch (error) {
    console.error('Ошибка при создании задачи:', error);
    throw error;
  }
};

/**
 * Получает список всех активных задач
 * @returns {Promise<Array>} - Список задач
 */
export const getActiveTasks = async () => {
  try {
    return await executeApiRequest('/tasks');
  } catch (error) {
    console.error('Ошибка при получении списка задач:', error);
    return [];
  }
};

/**
 * Получает задачу по ID
 * @param {number} taskId - ID задачи
 * @returns {Promise<Object|null>} - Данные задачи или null
 */
export const getTaskById = async (taskId) => {
  try {
    return await executeApiRequest(`/tasks/${taskId}`);
  } catch (error) {
    console.error('Ошибка при получении задачи:', error);
    return null;
  }
};

/**
 * Назначает задачу пользователю
 * @param {number} userId - ID пользователя
 * @param {number} taskId - ID задачи
 * @returns {Promise<Object>} - Данные о назначении
 */
export const assignTaskToUser = async (userId, taskId) => {
  try {
    return await executeApiRequest('/tasks/assign', 'POST', { userId, taskId });
  } catch (error) {
    console.error('Ошибка при назначении задачи пользователю:', error);
    throw error;
  }
};

/**
 * Завершает задачу пользователя и начисляет награду
 * @param {number} userId - ID пользователя
 * @param {number} taskId - ID задачи
 * @returns {Promise<Object>} - Обновленные данные о назначении
 */
export const completeUserTask = async (userId, taskId) => {
  try {
    return await executeApiRequest('/tasks/complete', 'POST', { userId, taskId });
  } catch (error) {
    console.error('Ошибка при завершении задачи пользователя:', error);
    throw error;
  }
};

/**
 * Получает список задач пользователя
 * @param {number} userId - ID пользователя
 * @returns {Promise<Array>} - Список задач пользователя
 */
export const getUserTasks = async (userId) => {
  try {
    const tasks = await executeApiRequest(`/tasks/user/${userId}`);
    return tasks || [];
  } catch (error) {
    console.error('Ошибка при получении списка задач пользователя:', error);
    return []; // Возвращаем пустой массив вместо выброса ошибки
  }
}; 