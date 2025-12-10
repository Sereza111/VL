const { User, Friend, Task, UserTask } = require('../models/associations'); // Импортируем модели через associations
const sequelize = require('../config/database'); // Нужен для sequelize.literal
const { Op } = require('sequelize'); // Добавляем импорт Op из sequelize

// Получение всех пользователей
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({ order: [['createdAt', 'DESC']] });
    res.json(users);
  } catch (error) {
    console.error('Ошибка при получении пользователей:', error);
    res.status(500).json({ error: 'Ошибка при получении пользователей' });
  }
};

// Получение пользователя по telegram_id
exports.getUserByTelegramId = async (req, res) => {
  try {
    const user = await User.findOne({ where: { telegram_id: req.params.telegramId } });
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json(user);
  } catch (error) {
    console.error('Ошибка при получении пользователя:', error);
    res.status(500).json({ error: 'Ошибка при получении пользователя' });
  }
};

// Создание или обновление пользователя
exports.createOrUpdateUser = async (req, res) => {
  try {
    const userData = req.body;
    console.log('Попытка создания/обновления пользователя:', userData);
    
    let existingUser = null;
    if (userData.telegram_id) {
      existingUser = await User.findOne({ where: { telegram_id: userData.telegram_id } });
      console.log('Существующий пользователь:', existingUser ? existingUser.toJSON() : 'Нет');
    }
    
    let savedUser;
    if (existingUser) {
      // Обновляем существующего пользователя
      existingUser.username = userData.username !== undefined ? userData.username : existingUser.username;
      existingUser.first_name = userData.first_name !== undefined ? userData.first_name : existingUser.first_name;
      existingUser.last_name = userData.last_name !== undefined ? userData.last_name : existingUser.last_name;
      if (userData.balance !== undefined) {
        existingUser.balance = userData.balance;
      }
      
      savedUser = await existingUser.save();
      console.log('Пользователь успешно обновлен:', savedUser.toJSON());
    } else {
      // Создаем нового пользователя
      savedUser = await User.create(userData);
      console.log('Пользователь успешно создан:', savedUser.toJSON());
    }
    
    res.status(201).json(savedUser);
  } catch (error) {
    console.error('Ошибка при создании/обновлении пользователя:', error);
    res.status(500).json({ 
      error: 'Ошибка при создании/обновлении пользователя',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Получение пользователя по ID
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(`Получение данных пользователя с ID: ${userId}`);
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      console.log(`Пользователь с ID ${userId} не найден`);
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    console.log(`Пользователь найден:`, user.toJSON());
    res.json(user);
  } catch (error) {
    console.error('Ошибка при получении данных пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Обновление пользователя по ID
exports.updateUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const userData = req.body;
    console.log(`Обновление данных пользователя ${userId}:`, userData);
    
    const [updatedRowsCount] = await User.update(userData, { where: { id: userId } });
    
    if (updatedRowsCount === 0) {
      console.log(`Пользователь с ID ${userId} не найден или данные не изменились`);
      return res.status(404).json({ error: 'Пользователь не найден или данные не изменились' });
    }

    const updatedUser = await User.findByPk(userId);
    
    console.log('Пользователь успешно обновлен:', updatedUser.toJSON());
    res.json(updatedUser);
  } catch (error) {
    console.error('Ошибка при обновлении пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Получение баланса пользователя
exports.getUserBalance = async (req, res) => {
  try {
    const user = await User.findOne({ where: { telegram_id: req.params.telegramId } });
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    res.json({ balance: user.balance });
  } catch (error) {
    console.error('Ошибка при получении баланса пользователя:', error);
    res.status(500).json({ error: 'Ошибка при получении баланса пользователя' });
  }
};

// Обновление баланса пользователя (POST метод)
exports.updateUserBalancePost = async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: 'Некорректная сумма' });
    }
    
    const user = await User.findOne({ where: { telegram_id: req.params.telegramId } });
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Сохраняем баланс как число с плавающей точкой с округлением до 2 знаков после запятой
    const newBalance = parseFloat(Number(amount).toFixed(2));
    user.balance = newBalance;
    await user.save();
    
    res.json({ success: true, balance: user.balance });
  } catch (error) {
    console.error('Ошибка при обновлении баланса пользователя:', error);
    res.status(500).json({ error: 'Ошибка при обновлении баланса пользователя' });
  }
};

// Обновление баланса пользователя (PUT метод)
exports.updateUserBalancePut = async (req, res) => {
  try {
    const { amount } = req.body;
    
    console.log(`[DEBUG] Получен запрос на обновление баланса для пользователя ${req.params.telegramId}, сумма: ${amount}`);
    
    if (!amount || isNaN(amount)) {
      console.log(`[ERROR] Некорректная сумма: ${amount}`);
      return res.status(400).json({ error: 'Некорректная сумма' });
    }
    
    const user = await User.findOne({ where: { telegram_id: req.params.telegramId } });
    if (!user) {
      console.log(`[ERROR] Пользователь с ID ${req.params.telegramId} не найден`);
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    console.log(`[DEBUG] Текущий баланс пользователя: ${user.balance}`);
    
    // Сохраняем баланс как число с плавающей точкой с округлением до 2 знаков после запятой
    const newBalance = parseFloat(Number(amount).toFixed(2));
    user.balance = newBalance;
    await user.save();
    
    console.log(`[DEBUG] Баланс успешно обновлен: ${user.balance}`);
    res.json(user);
  } catch (error) {
    console.error('Ошибка при обновлении баланса пользователя:', error);
    res.status(500).json({ error: 'Ошибка при обновлении баланса пользователя' });
  }
};

// Обновление баланса пользователя по ID
exports.updateUserBalanceById = async (req, res) => {
  try {
    const userId = req.params.id;
    const { amount } = req.body;

    console.log(`[DEBUG] Получен запрос на обновление баланса для пользователя ID: ${userId}, сумма: ${amount}`);

    if (!amount || isNaN(amount)) {
      console.log(`[ERROR] Некорректная сумма: ${amount}`);
      return res.status(400).json({ error: 'Некорректная сумма' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      console.log(`[ERROR] Пользователь с ID ${userId} не найден`);
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    console.log(`[DEBUG] Текущий баланс пользователя: ${user.balance}`);

    // Сохраняем баланс как число с плавающей точкой с округлением до 2 знаков после запятой
    user.balance = parseFloat(Number(amount).toFixed(2));
    await user.save();

    console.log(`[DEBUG] Баланс успешно обновлен: ${user.balance}`);
    res.json(user);
  } catch (error) {
    console.error('Ошибка при обновлении баланса пользователя по ID:', error);
    res.status(500).json({ error: 'Ошибка при обновлении баланса пользователя по ID' });
  }
};

// Начисление пассивного дохода всем пользователям
exports.distributePassiveIncome = async (req, res) => {
  try {
    console.log('Начисление пассивного дохода...');
    
    // Получаем всех пользователей
    const users = await User.findAll();
    
    let updatedCount = 0;
    
    for (const user of users) {
      try {
        // Базовый доход для всех пользователей
        let hourlyIncome = 0; // Начинаем с 0 и добавляем все источники дохода
        
        // Проверяем, есть ли у пользователя предметы
        try {
          const { Item, UserItem } = require('../models/associations');
          
          // Настраиваем связи на случай, если они не были установлены
          if (!UserItem.associations.item) {
            UserItem.belongsTo(Item, { foreignKey: 'item_id', as: 'item' });
          }
          
          const userItems = await UserItem.findAll({
            where: { user_id: user.id },
            include: [{
              model: Item,
              as: 'item'
            }]
          });
          
          if (userItems && userItems.length > 0) {
            // Суммируем доход от всех предметов
            const itemsIncome = userItems.reduce((sum, userItem) => {
              if (userItem.item && userItem.item.income_per_hour) {
                return sum + parseFloat(userItem.item.income_per_hour || 0) * (userItem.quantity || 1);
              }
              return sum;
            }, 0);
            
            if (itemsIncome > 0) {
              hourlyIncome += itemsIncome; // Добавляем доход от предметов к общему доходу
              console.log(`Доход от предметов для пользователя ${user.telegram_id || user.id}: ${itemsIncome.toFixed(2)} VL/час`);
            }
          }
        } catch (itemError) {
          console.warn('Не удалось получить предметы пользователя:', itemError.message);
          // Продолжаем с базовым доходом
        }
        
        // Получаем количество друзей пользователя со статусом accepted
        const friendCount = await Friend.count({
          where: {
            [Op.or]: [
              { user_id: user.id, status: 'accepted' },
              { friend_id: user.id, status: 'accepted' }
            ]
          }
        });
        
        // Добавляем доход за друзей: 2 VL за каждого друга
        hourlyIncome += friendCount * 2.00;
        
        // Добавляем доход за уровень: 1 VL за каждый уровень выше 1
        if (user.level > 1) {
          hourlyIncome += (user.level - 1) * 1.00;
        }
        
        // Добавляем базовый доход только если нет дохода от предметов
        if (hourlyIncome === 0) {
          hourlyIncome = 5.00; // Базовый доход 5 VL в час только если нет других источников
        }
        
        if (hourlyIncome > 0) {
          // Текущий баланс (с проверкой на null/undefined)
          const currentBalance = parseFloat(user.balance || 0);
          
          // Новый баланс с округлением до 2 знаков после запятой
          const newBalance = parseFloat((currentBalance + hourlyIncome).toFixed(2));
          
          // Обновляем баланс пользователя
          user.balance = newBalance;
          await user.save();
          
          updatedCount++;
          console.log(`Пользователю ${user.telegram_id || user.id} начислено ${hourlyIncome.toFixed(2)} VL пассивного дохода. Новый баланс: ${newBalance.toFixed(2)} VL`);
        }
      } catch (userError) {
        console.error(`Ошибка при начислении пассивного дохода пользователю ${user.id}:`, userError);
        // Продолжаем с другими пользователями
      }
    }
    
    console.log(`Пассивный доход успешно начислен ${updatedCount} пользователям`);
    res.json({ 
      success: true, 
      message: `Пассивный доход успешно начислен ${updatedCount} пользователям` 
    });
  } catch (error) {
    console.error('Ошибка при начислении пассивного дохода:', error);
    res.status(500).json({ error: 'Ошибка при начислении пассивного дохода' });
  }
};

// Получение задач пользователя по ID
exports.getUserTasksById = async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(`Попытка получения задач для пользователя ID: ${userId}`);

    const userTasks = await UserTask.findAll({
      where: { user_id: userId },
      include: [{
        model: Task,
        as: 'task' 
      }]
    });

    if (userTasks.length === 0) {
      console.log(`Задачи для пользователя ID ${userId} не найдены`);
      return res.status(404).json({ message: 'Задачи для пользователя не найдены' });
    }

    console.log(`Задачи для пользователя ID ${userId} успешно получены:`, userTasks.map(ut => ut.toJSON()));
    res.json(userTasks);
  } catch (error) {
    console.error('Ошибка при получении задач пользователя по ID:', error);
    res.status(500).json({ error: 'Ошибка при получении задач пользователя по ID', details: error.message });
  }
};

// Добавление предмета пользователю
exports.addItemToUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { itemId, quantity = 1 } = req.body;
    
    console.log(`Добавление предмета ${itemId} пользователю ${userId} в количестве ${quantity}`);
    
    // Проверяем, существует ли пользователь
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Получаем модели из associations
    const { Item, UserItem } = require('../models/associations');
    
    // Настраиваем связи на случай, если они не были установлены
    if (!UserItem.associations.item) {
      UserItem.belongsTo(Item, { foreignKey: 'item_id', as: 'item' });
    }
    
    // Проверяем, существует ли предмет
    const item = await Item.findByPk(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Предмет не найден' });
    }
    
    // Проверяем, есть ли у пользователя уже такой предмет
    let userItem = await UserItem.findOne({
      where: {
        user_id: userId,
        item_id: itemId
      }
    });
    
    if (userItem) {
      // Если предмет уже есть, увеличиваем количество
      userItem.quantity += quantity;
      await userItem.save();
    } else {
      // Если предмета нет, создаем новую запись
      userItem = await UserItem.create({
        user_id: userId,
        item_id: itemId,
        quantity: quantity
      });
    }
    
    // Возвращаем обновленные данные
    const userItems = await UserItem.findAll({
      where: { user_id: userId },
      include: [{
        model: Item,
        as: 'item'
      }]
    });
    
    res.json({
      success: true,
      message: 'Предмет успешно добавлен пользователю',
      userItems: userItems
    });
  } catch (error) {
    console.error('Ошибка при добавлении предмета пользователю:', error);
    res.status(500).json({ error: 'Ошибка при добавлении предмета пользователю' });
  }
};

// Получение предметов пользователя
exports.getUserItems = async (req, res) => {
  try {
    const userId = req.params.id;
    
    console.log(`Получение предметов пользователя ${userId}`);
    
    // Проверяем, существует ли пользователь
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Получаем модели из associations
    const { Item, UserItem } = require('../models/associations');
    
    // Настраиваем связи на случай, если они не были установлены
    if (!UserItem.associations.item) {
      UserItem.belongsTo(Item, { foreignKey: 'item_id', as: 'item' });
    }
    
    const userItems = await UserItem.findAll({
      where: { user_id: userId },
      include: [{
        model: Item,
        as: 'item'
      }]
    });
    
    console.log(`Найдено ${userItems.length} предметов для пользователя ${userId}`);
    res.json(userItems);
  } catch (error) {
    console.error('Ошибка при получении предметов пользователя:', error);
    res.status(500).json({ error: 'Ошибка при получении предметов пользователя' });
  }
};

// Покупка предмета пользователем (атомарно в транзакции)
exports.purchaseItem = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.params.id;
    const { itemId, expectedPrice } = req.body;

    if (!itemId) {
      await t.rollback();
      return res.status(400).json({ error: 'Не указан itemId' });
    }

    // Загружаем пользователя с блокировкой строки
    const user = await User.findByPk(userId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Загружаем предмет
    const { Item, UserItem } = require('../models/associations');

    const item = await Item.findByPk(itemId, { transaction: t });
    if (!item) {
      await t.rollback();
      return res.status(404).json({ error: 'Предмет не найден' });
    }

    const price = parseFloat(item.price || 0);
    if (expectedPrice !== undefined && parseFloat(expectedPrice) !== price) {
      await t.rollback();
      return res.status(409).json({ error: 'Цена предмета изменилась', actualPrice: price });
    }

    const currentBalance = parseFloat(user.balance || 0);
    if (currentBalance < price) {
      await t.rollback();
      return res.status(400).json({ error: 'Недостаточно средств' });
    }

    // Списываем баланс
    const newBalance = parseFloat((currentBalance - price).toFixed(2));
    user.balance = newBalance;
    await user.save({ transaction: t });

    // Добавляем/увеличиваем предмет
    let userItem = await UserItem.findOne({
      where: { user_id: user.id, item_id: item.id },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (userItem) {
      userItem.quantity += 1;
      await userItem.save({ transaction: t });
    } else {
      userItem = await UserItem.create({
        user_id: user.id,
        item_id: item.id,
        quantity: 1
      }, { transaction: t });
    }

    await t.commit();

    // Возвращаем обновлённые предметы
    const userItems = await UserItem.findAll({
      where: { user_id: user.id },
      include: [{ model: Item, as: 'item' }]
    });

    return res.json({
      success: true,
      balance: user.balance,
      userItems
    });
  } catch (error) {
    try { await t.rollback(); } catch (_) {}
    console.error('Ошибка при покупке предмета:', error);
    return res.status(500).json({ error: 'Ошибка при покупке предмета' });
  }
};
