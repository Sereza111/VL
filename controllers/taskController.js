const { Task, UserTask, User } = require('../models/associations');
const sequelize = require('../config/database');
const { checkChannelSubscription } = require('../services/telegramService');
const userController = require('./userController');
const { Op } = require('sequelize');
const { startOfDay, endOfDay } = require('date-fns');

// Получение всех задач
exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll({ where: { status: 'active' } });
    res.json(tasks);
  } catch (error) {
    console.error('Ошибка при получении задач:', error);
    res.status(500).json({ error: 'Ошибка при получении задач', details: error.message });
  }
};

// Получение задач пользователя
exports.getUserTasks = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    console.log(`[DEBUG] Получение задач для пользователя с ID: ${userId}`);
    
    // Проверяем, существует ли пользователь
    const user = await User.findByPk(userId);
    if (!user) {
      console.log(`[ERROR] Пользователь с ID ${userId} не найден`);
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    console.log(`[DEBUG] Пользователь найден: ${JSON.stringify(user.toJSON())}`);
    
    try {
      // Находим все задачи пользователя через связь UserTask
      const userTasks = await UserTask.findAll({
        where: { user_id: userId },
        include: [{ 
          model: Task, 
          as: 'task', // Добавляем as: 'task'
          attributes: ['id', 'title', 'description', 'reward', 'status'] 
        }]
      });

      console.log(`[DEBUG] Найдено задач пользователя: ${userTasks.length}`);
      
      // Проверяем, есть ли задачи
      if (userTasks.length === 0) {
        console.log(`У пользователя ${userId} нет задач`);
        return res.json([]);
      }

      // Преобразуем результат в более удобный формат
      const tasks = userTasks.map(userTask => {
        console.log(`[DEBUG] Задача: ${JSON.stringify(userTask.toJSON())}`);
        return {
          id: userTask.task.id,
          title: userTask.task.title,
          description: userTask.task.description,
          reward: userTask.task.reward,
          task_status: userTask.task.status, // Статус задачи
          user_task_status: userTask.status, // Статус выполнения пользователем
          completed_at: userTask.completed_at ? userTask.completed_at.toISOString() : null
        };
      });

      console.log(`[DEBUG] Преобразованные задачи: ${JSON.stringify(tasks)}`);
      res.json(tasks);
    } catch (includeError) {
      console.error('[ERROR] Ошибка при включении связанных моделей:', includeError);
      console.error('[ERROR] Стек ошибки:', includeError.stack);
      
      // Попробуем получить задачи без включения связанных моделей
      console.log('[INFO] Пробуем получить задачи без включения связанных моделей');
      const userTasksSimple = await UserTask.findAll({
        where: { user_id: userId }
      });
      
      console.log(`[DEBUG] Найдено простых задач пользователя: ${userTasksSimple.length}`);
      
      if (userTasksSimple.length === 0) {
        console.log(`У пользователя ${userId} нет задач (простой запрос)`);
        return res.json([]);
      } else {
        // Вернем пустой массив, чтобы клиент не получал ошибку
        console.log('[INFO] Возвращаем пустой массив задач из-за ошибки');
        return res.json([]);
      }
    }
  } catch (error) {
    console.error('Подробная ошибка при получении задач пользователя:', error);
    console.error('Стек ошибки:', error.stack);
    console.error('Тип ошибки:', error.name);
    console.error('Сообщение ошибки:', error.message);
    
    // Проверка наличия таблиц в базе данных
    try {
      console.log('[INFO] Проверка наличия таблиц в базе данных');
      const [results] = await sequelize.query('SHOW TABLES');
      console.log('[INFO] Таблицы в базе данных:', results);
    } catch (dbError) {
      console.error('[ERROR] Ошибка при проверке таблиц в базе данных:', dbError);
    }
    
    res.status(500).json({ 
      error: 'Ошибка при получении задач пользователя', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Назначение задачи пользователю
exports.assignTaskToUser = async (req, res) => {
  try {
    const { userId, taskId } = req.body;
    
    // Проверяем, существует ли пользователь и задача
    const user = await User.findByPk(userId);
    const task = await Task.findByPk(taskId);
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    if (!task) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }
    
    // Проверяем, не назначена ли задача уже пользователю
    const existingUserTask = await UserTask.findOne({
      where: { user_id: userId, task_id: taskId }
    });
    
    if (existingUserTask) {
      return res.status(400).json({ error: 'Задача уже назначена пользователю' });
    }
    
    // Создаем новую связь UserTask
    const userTask = await UserTask.create({
      user_id: userId,
      task_id: taskId,
      status: 'pending'
    });
    
    res.status(201).json(userTask);
  } catch (error) {
    console.error('Ошибка при назначении задачи пользователю:', error);
    res.status(500).json({ 
      error: 'Ошибка при назначении задачи пользователю', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Завершение задачи пользователя
exports.completeUserTask = async (req, res) => {
  try {
    const { userId, taskId } = req.body;
    
    console.log(`[DEBUG] Попытка завершения задачи для пользователя ${userId}, задача ${taskId}`);
    
    // Находим связь UserTask
    const userTask = await UserTask.findOne({
      where: { user_id: userId, task_id: taskId },
      include: [{ model: Task }] // Включаем связанную задачу
    });
    
    if (!userTask) {
      console.log(`[ERROR] Задача пользователя не найдена: userId=${userId}, taskId=${taskId}`);
      return res.status(404).json({ error: 'Задача пользователя не найдена' });
    }
    
    // Проверяем, что задача еще не завершена
    if (userTask.status === 'completed') {
      console.log(`[WARN] Задача уже завершена: userId=${userId}, taskId=${taskId}`);
      return res.status(400).json({ error: 'Задача уже завершена' });
    }
    
    // Обновляем статус задачи
    userTask.status = 'completed';
    userTask.completed_at = new Date(); // Устанавливаем текущую дату
    await userTask.save();
    
    console.log(`[DEBUG] Задача успешно завершена: ${JSON.stringify(userTask.toJSON())}`);
    
    res.json({
      id: userTask.id,
      user_id: userTask.user_id,
      task_id: userTask.task_id,
      status: userTask.status,
      completed_at: userTask.completed_at.toISOString(),
      reward: userTask.task.reward // Возвращаем награду за задачу
    });
  } catch (error) {
    console.error('Ошибка при завершении задачи пользователя:', error);
    res.status(500).json({ 
      error: 'Ошибка при завершении задачи пользователя', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Проверка подписки на канал
exports.checkChannelSubscriptionTask = async (req, res) => {
  const { userId, telegramUserId } = req.body;
  
  try {
    // Проверяем подписку через Telegram API
    const isSubscribed = await checkChannelSubscription(telegramUserId);
    
    if (isSubscribed) {
      // Находим задачу "Подписка на канал"
      const channelSubscriptionTask = await Task.findOne({
        where: { title: 'Подписка на канал' }
      });
      
      if (!channelSubscriptionTask) {
        return res.status(404).json({ error: 'Задача не найдена' });
      }
      
      // Проверяем, не выполнял ли пользователь уже эту задачу
      const existingUserTask = await UserTask.findOne({
        where: { 
          user_id: userId, 
          task_id: channelSubscriptionTask.id,
          status: 'completed' 
        }
      });
      
      if (existingUserTask) {
        return res.status(400).json({ error: 'Награда уже получена' });
      }
      
      // Начисляем награду
      await userController.updateUserBalance(userId, channelSubscriptionTask.reward);
      
      // Создаем запись о выполнении задачи
      await UserTask.create({
        user_id: userId,
        task_id: channelSubscriptionTask.id,
        status: 'completed',
        completed_at: new Date()
      });
      
      return res.json({ 
        success: true, 
        reward: channelSubscriptionTask.reward, 
        message: 'Награда за подписку начислена' 
      });
    } else {
      return res.json({ 
        success: false, 
        message: 'Подписка на канал не подтверждена' 
      });
    }
  } catch (error) {
    console.error('Ошибка при проверке подписки:', error);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Получение ежедневного бонуса
exports.claimDailyBonus = async (req, res) => {
  const { userId } = req.body;
  
  try {
    const user = await User.findByPk(userId);
    const today = new Date();
    
    // Находим задачу "Ежедневный бонус"
    const dailyBonusTask = await Task.findOne({
      where: { title: 'Ежедневный бонус' }
    });
    
    if (!dailyBonusTask) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }
    
    // Проверка последнего полученного бонуса
    const existingUserTask = await UserTask.findOne({
      where: { 
        user_id: userId, 
        task_id: dailyBonusTask.id,
        completed_at: {
          [Op.gte]: startOfDay(today),
          [Op.lt]: endOfDay(today)
        }
      }
    });
    
    if (existingUserTask) {
      return res.status(400).json({ error: 'Бонус уже получен сегодня' });
    }
    
    // Начисляем награду
    await userController.updateUserBalance(userId, dailyBonusTask.reward);
    
    // Создаем запись о выполнении задачи
    await UserTask.create({
      user_id: userId,
      task_id: dailyBonusTask.id,
      status: 'completed',
      completed_at: today
    });
    
    return res.json({ 
      success: true, 
      reward: dailyBonusTask.reward, 
      message: 'Ежедневный бонус начислен' 
    });
  } catch (error) {
    console.error('Ошибка при начислении ежедневного бонуса:', error);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};
