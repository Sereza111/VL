const { User, Friend } = require('../models/associations');
const { Op } = require('sequelize');

// Отправка запроса в друзья
exports.sendFriendRequest = async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.body;
    
    console.log(`[DEBUG] Отправка запроса в друзья от ${fromUserId} к ${toUserId}`);
    console.log(`[DEBUG] Параметры запроса:`, JSON.stringify(req.body));
    
    // Проверяем, что ID не совпадают
    if (fromUserId === toUserId) {
      console.log(`[ERROR] Попытка добавить самого себя в друзья: ${fromUserId}`);
      return res.status(400).json({ error: 'Нельзя добавить самого себя в друзья' });
    }
    
    // Получаем пользователей из базы данных
    let fromUser = await User.findOne({ where: { telegram_id: fromUserId } });
    let toUser = await User.findOne({ where: { telegram_id: toUserId } });
    
    console.log(`[DEBUG] Отправитель:`, fromUser ? JSON.stringify(fromUser.toJSON()) : 'не найден');
    console.log(`[DEBUG] Получатель:`, toUser ? JSON.stringify(toUser.toJSON()) : 'не найден');
    
    if (!fromUser) {
      try {
        console.log(`[DEBUG] Создание нового пользователя для отправителя с ID ${fromUserId}`);
        const newFromUser = await User.create({
          telegram_id: fromUserId,
          username: `user${fromUserId}`,
          first_name: `Пользователь ${fromUserId}`,
          balance: 0
        });
        fromUser = newFromUser;
        console.log(`[DEBUG] Создан новый пользователь:`, JSON.stringify(fromUser.toJSON()));
      } catch (createError) {
        console.error(`[ERROR] Ошибка при создании пользователя-отправителя:`, createError);
        return res.status(500).json({ error: 'Ошибка при создании пользователя', details: createError.message });
      }
    }
    
    if (!toUser) {
      try {
        console.log(`[DEBUG] Создание нового пользователя для получателя с ID ${toUserId}`);
        const newToUser = await User.create({
          telegram_id: toUserId,
          username: `user${toUserId}`,
          first_name: `Пользователь ${toUserId}`,
          balance: 0
        });
        toUser = newToUser;
        console.log(`[DEBUG] Создан новый пользователь:`, JSON.stringify(toUser.toJSON()));
      } catch (createError) {
        console.error(`[ERROR] Ошибка при создании пользователя-получателя:`, createError);
        return res.status(500).json({ error: 'Ошибка при создании пользователя', details: createError.message });
      }
    }
    
    // Проверяем, существует ли уже запрос или принятая дружба
    const existingRelationship = await Friend.findOne({
      where: {
        [Op.or]: [
          { user_id: fromUser.id, friend_id: toUser.id },
          { user_id: toUser.id, friend_id: fromUser.id }
        ]
      }
    });
    
    console.log(`[DEBUG] Существующие отношения:`, existingRelationship ? JSON.stringify(existingRelationship.toJSON()) : 'не найдены');
    
    if (existingRelationship) {
      if (existingRelationship.status === 'accepted') {
        console.log(`[DEBUG] Пользователи ${fromUserId} и ${toUserId} уже друзья`);
        return res.json({ success: true, message: 'Вы уже друзья' });
      } else if (existingRelationship.status === 'pending') {
        console.log(`[DEBUG] Запрос в друзья между ${fromUserId} и ${toUserId} уже существует`);
        return res.json({ success: true, message: 'Запрос уже существует' });
      }
    }
    
    // Создаем запрос в друзья
    try {
      console.log(`[DEBUG] Создание нового запроса в друзья: ${fromUser.id} -> ${toUser.id}`);
      const newRequest = await Friend.create({
        user_id: fromUser.id,
        friend_id: toUser.id,
        status: 'pending'
      });
      
      console.log(`[DEBUG] Запрос в друзья успешно создан:`, JSON.stringify(newRequest.toJSON()));
      res.json({ success: true, message: 'Запрос в друзья отправлен' });
    } catch (createRequestError) {
      console.error(`[ERROR] Ошибка при создании запроса в друзья:`, createRequestError);
      return res.status(500).json({ error: 'Ошибка при создании запроса в друзья', details: createRequestError.message });
    }
  } catch (error) {
    console.error('Ошибка при отправке запроса в друзья:', error);
    res.status(500).json({ error: 'Ошибка при отправке запроса в друзья', details: error.message });
  }
};

// Получение запросов в друзья
exports.getFriendRequests = async (req, res) => {
  try {
    console.log(`[DEBUG] Получен запрос на получение запросов в друзья для пользователя ${req.params.userId}`);
    console.log(`[DEBUG] Параметры запроса:`, JSON.stringify(req.params));
    
    const user = await User.findOne({ where: { telegram_id: req.params.userId } });
    console.log(`[DEBUG] Найден пользователь:`, user ? JSON.stringify(user.toJSON()) : 'не найден');
    
    if (!user) {
      console.log(`[ERROR] Пользователь с ID ${req.params.userId} не найден`);
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Получаем все запросы в друзья, где текущий пользователь - получатель
    try {
      const requests = await Friend.findAll({
        where: {
          friend_id: user.id,
          status: 'pending'
        },
        include: {
          model: User, // Включаем информацию об отправителе
          as: 'sender', // Используем алиас, определенный в associations.js
          attributes: ['id', 'telegram_id', 'username', 'first_name', 'last_name', 'name'] // Выбираем нужные поля отправителя
        }
      });
      
      console.log(`[DEBUG] Найдено ${requests.length} запросов в друзья для пользователя ${req.params.userId}`);
      console.log(`[DEBUG] Запросы в друзья:`, JSON.stringify(requests.map(r => r.toJSON())));
      
      // Преобразуем результат в более удобный формат для клиента
      const formattedRequests = requests.map(request => ({
        id: request.id,
        sender_id: request.user_id,
        sender_telegram_id: request.sender.telegram_id,
        sender_username: request.sender.username,
        sender_name: request.sender.first_name || request.sender.name,
        status: request.status,
        created_at: request.created_at
      }));
      
      console.log(`[DEBUG] Форматированные запросы:`, JSON.stringify(formattedRequests));
      
      res.json(formattedRequests);
    } catch (requestsError) {
      console.error(`[ERROR] Ошибка при получении запросов в друзья:`, requestsError);
      return res.status(500).json({ error: 'Ошибка при получении запросов в друзья', details: requestsError.message });
    }
  } catch (error) {
    console.error('Ошибка при получении запросов в друзья:', error);
    res.status(500).json({ error: 'Ошибка при получении запросов в друзья', details: error.message, stack: error.stack });
  }
};

// Принятие запроса в друзья
exports.acceptFriendRequest = async (req, res) => {
  try {
    const { userId, friendId } = req.body;
    
    const user = await User.findOne({ where: { telegram_id: userId } });
    const friend = await User.findOne({ where: { telegram_id: friendId } });
    
    if (!user || !friend) {
      return res.status(404).json({ error: 'Один из пользователей не найден' });
    }
    
    // Обновляем статус запроса
    const [updatedRequestsCount] = await Friend.update(
      { status: 'accepted' },
      { where: { user_id: friend.id, friend_id: user.id, status: 'pending' } }
    );

    if (updatedRequestsCount === 0) {
      return res.status(404).json({ error: 'Запрос в друзья не найден или уже принят/отклонен' });
    }
    
    // Создаем обратную связь (взаимная дружба), если ее нет
    await Friend.findOrCreate({
      where: { user_id: user.id, friend_id: friend.id },
      defaults: { status: 'accepted' }
    });
    
    res.json({ success: true, message: 'Запрос в друзья принят' });
  } catch (error) {
    console.error('Ошибка при принятии запроса в друзья:', error);
    res.status(500).json({ error: 'Ошибка при принятии запроса в друзья' });
  }
};

// Отклонение запроса в друзья
exports.rejectFriendRequest = async (req, res) => {
  try {
    const { userId, friendId } = req.body;
    
    const user = await User.findOne({ where: { telegram_id: userId } });
    const friend = await User.findOne({ where: { telegram_id: friendId } });
    
    if (!user || !friend) {
      return res.status(404).json({ error: 'Один из пользователей не найден' });
    }
    
    // Удаляем запрос
    const deletedRows = await Friend.destroy({
      where: {
        user_id: friend.id,
        friend_id: user.id,
        status: 'pending'
      }
    });

    if (deletedRows === 0) {
      return res.status(404).json({ error: 'Запрос в друзья не найден или уже обработан' });
    }
    
    res.json({ success: true, message: 'Запрос в друзья отклонен' });
  } catch (error) {
    console.error('Ошибка при отклонении запроса в друзья:', error);
    res.status(500).json({ error: 'Ошибка при отклонении запроса в друзья' });
  }
};

// Получение списка друзей
exports.getFriendsList = async (req, res) => {
  try {
    const user = await User.findOne({ where: { telegram_id: req.params.userId } });
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Получаем всех друзей текущего пользователя, где он является отправителем или получателем
    const friends = await Friend.findAll({
      where: {
        [Op.or]: [
          { user_id: user.id },
          { friend_id: user.id }
        ],
        status: 'accepted'
      },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'telegram_id', 'username', 'first_name', 'last_name', 'name'] },
        { model: User, as: 'receiver', attributes: ['id', 'telegram_id', 'username', 'first_name', 'last_name', 'name'] }
      ]
    });
    
    // Фильтруем и преобразуем список друзей
    const friendsList = friends.map(friendship => {
      if (friendship.sender.id === user.id) {
        return friendship.receiver; // Текущий пользователь - отправитель, возвращаем получателя
      } else {
        return friendship.sender; // Текущий пользователь - получатель, возвращаем отправителя
      }
    }).filter(Boolean); // Удаляем возможные null/undefined, если вдруг возникнут

    // Убираем дубликаты по telegram_id, если они есть
    const uniqueFriends = Array.from(new Map(friendsList.map(item => [item['telegram_id'], item])).values());
    
    res.json(uniqueFriends);
  } catch (error) {
    console.error('Ошибка при получении списка друзей:', error);
    res.status(500).json({ error: 'Ошибка при получении списка друзей' });
  }
};

// Получение запросов в друзья по Telegram ID
exports.getFriendRequestsByTelegramId = async (req, res) => {
  try {
    console.log(`[DEBUG] Получен запрос на получение запросов в друзья для пользователя с Telegram ID ${req.params.telegramId}`);
    console.log(`[DEBUG] Параметры запроса:`, JSON.stringify(req.params));
    
    const user = await User.findOne({ where: { telegram_id: req.params.telegramId } });
    console.log(`[DEBUG] Найден пользователь:`, user ? JSON.stringify(user.toJSON()) : 'не найден');
    
    if (!user) {
      console.log(`[ERROR] Пользователь с Telegram ID ${req.params.telegramId} не найден`);
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Получаем все запросы в друзья, где текущий пользователь - получатель
    try {
      const requests = await Friend.findAll({
        where: {
          friend_id: user.id,
          status: 'pending'
        },
        include: {
          model: User,
          as: 'sender',
          attributes: ['id', 'telegram_id', 'username', 'first_name', 'last_name', 'name']
        }
      });
      
      console.log(`[DEBUG] Найдено ${requests.length} запросов в друзья для пользователя с Telegram ID ${req.params.telegramId}`);
      
      // Преобразуем результат в более удобный формат для клиента
      const formattedRequests = requests.map(request => ({
        id: request.id,
        sender_id: request.user_id,
        sender_telegram_id: request.sender.telegram_id,
        sender_username: request.sender.username,
        sender_name: request.sender.first_name || request.sender.name,
        status: request.status,
        created_at: request.created_at
      }));
      
      console.log(`[DEBUG] Форматированные запросы:`, JSON.stringify(formattedRequests));
      
      res.json(formattedRequests);
    } catch (requestsError) {
      console.error(`[ERROR] Ошибка при получении запросов в друзья:`, requestsError);
      return res.status(500).json({ error: 'Ошибка при получении запросов в друзья', details: requestsError.message });
    }
  } catch (error) {
    console.error('Ошибка при получении запросов в друзья:', error);
    res.status(500).json({ error: 'Ошибка при получении запросов в друзья', details: error.message });
  }
};

// Получение списка друзей по Telegram ID
exports.getFriendsListByTelegramId = async (req, res) => {
  try {
    console.log(`[DEBUG] Получен запрос на получение списка друзей для пользователя с Telegram ID ${req.params.telegramId}`);
    console.log(`[DEBUG] Параметры запроса:`, JSON.stringify(req.params));
    
    const user = await User.findOne({ where: { telegram_id: req.params.telegramId } });
    console.log(`[DEBUG] Найден пользователь:`, user ? JSON.stringify(user.toJSON()) : 'не найден');
    
    if (!user) {
      console.log(`[ERROR] Пользователь с Telegram ID ${req.params.telegramId} не найден`);
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Получаем всех друзей текущего пользователя, где он является отправителем или получателем
    const friends = await Friend.findAll({
      where: {
        [Op.or]: [
          { user_id: user.id },
          { friend_id: user.id }
        ],
        status: 'accepted'
      },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'telegram_id', 'username', 'first_name', 'last_name', 'name'] },
        { model: User, as: 'receiver', attributes: ['id', 'telegram_id', 'username', 'first_name', 'last_name', 'name'] }
      ]
    });
    
    console.log(`[DEBUG] Найдено ${friends.length} друзей для пользователя с Telegram ID ${req.params.telegramId}`);
    
    // Фильтруем и преобразуем список друзей
    const friendsList = friends.map(friendship => {
      if (friendship.sender.id === user.id) {
        return friendship.receiver; // Текущий пользователь - отправитель, возвращаем получателя
      } else {
        return friendship.sender; // Текущий пользователь - получатель, возвращаем отправителя
      }
    }).filter(Boolean); // Удаляем возможные null/undefined, если вдруг возникнут

    // Убираем дубликаты по telegram_id, если они есть
    const uniqueFriends = Array.from(new Map(friendsList.map(item => [item['telegram_id'], item])).values());
    
    console.log(`[DEBUG] Форматированный список друзей:`, JSON.stringify(uniqueFriends));
    
    res.json(uniqueFriends);
  } catch (error) {
    console.error('Ошибка при получении списка друзей:', error);
    res.status(500).json({ error: 'Ошибка при получении списка друзей' });
  }
};
