// Модуль для управления Telegram-ботами
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Константы (из переменных окружения)
const MAIN_BOT_TOKEN = process.env.MAIN_BOT_TOKEN;
const SUPPORT_BOT_TOKEN = process.env.SUPPORT_BOT_TOKEN;
const SUPPORT_STAFF_ID = process.env.SUPPORT_STAFF_ID;
const SUPPORT_USERNAME = process.env.SUPPORT_USERNAME || 'VL_TEX_BOT';

if (!MAIN_BOT_TOKEN || !SUPPORT_BOT_TOKEN || !SUPPORT_STAFF_ID) {
  console.error('Отсутствуют обязательные переменные окружения для ботов (MAIN_BOT_TOKEN, SUPPORT_BOT_TOKEN, SUPPORT_STAFF_ID)');
}

// Путь к файлу для хранения данных о чатах поддержки
const DATA_FILE_PATH = path.join(__dirname, 'support-chats.json');

// Инициализация основного бота
let mainBot = null;
// Инициализация бота поддержки
let supportBot = null;

// Хранилище активных чатов с пользователями для бота поддержки
let activeChats = {};
// Хранилище для режима ожидания ответа
const awaitingReply = {};

// Клавиатура для сотрудника поддержки
const staffKeyboard = {
  reply_markup: {
    keyboard: [
      [{ text: '📋 Список обращений' }],
      [{ text: '🧹 Очистить неактивные' }, { text: '❓ Помощь' }]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  }
};

// Загружаем данные из файла при запуске
function loadChatsData() {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const data = fs.readFileSync(DATA_FILE_PATH, 'utf8');
      activeChats = JSON.parse(data);
      console.log(`Загружены данные о ${Object.keys(activeChats).length} активных чатах`);
    } else {
      console.log('Файл с данными не найден. Создаем новый.');
      saveChatsData(); // Создаем пустой файл
    }
  } catch (error) {
    console.error('Ошибка при загрузке данных:', error);
    activeChats = {};
  }
}

// Сохраняем данные в файл
function saveChatsData() {
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(activeChats, null, 2), 'utf8');
    console.log(`Сохранены данные о ${Object.keys(activeChats).length} активных чатах`);
  } catch (error) {
    console.error('Ошибка при сохранении данных:', error);
  }
}

/**
 * Безопасная обработка ошибок
 */
function handleBotError(error, botName) {
  console.error(`Ошибка в ${botName}:`, error?.response?.body || error?.message || error);
}

/**
 * Инициализирует основной бот с функциональностью книгавл.ру
 */
function initializeMainBot() {
  try {
    mainBot = new TelegramBot(MAIN_BOT_TOKEN, { polling: { interval: 1000, autoStart: true, params: { timeout: 10 } } });
    console.log('Основной бот инициализирован');

    mainBot.on('error', (error) => handleBotError(error, 'Основной бот'));

    // Обработчик команды /start
    mainBot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;

      // 1. Отправляем приветственное сообщение
      mainBot.sendMessage(chatId, 'Привет! Это бот для книгавл.ру. Чем могу помочь?')
        .then(() => {
          // 2. Отправляем второе сообщение с кнопкой техподдержки
          const supportKeyboard = {
            inline_keyboard: [
              [
                {
                  text: 'Техподдержка 🛠',
                  url: `https://t.me/${SUPPORT_USERNAME}`
                }
              ]
            ]
          };

          mainBot.sendMessage(
            chatId,
            'Если у вас возникли вопросы, нажмите кнопку ниже:',
            { reply_markup: supportKeyboard }
          );
        })
        .catch((error) => {
          console.error('Ошибка при отправке сообщения:', error);
        });
    });

    // Обработчик нажатий на inline-кнопки
    mainBot.on('callback_query', (callbackQuery) => {
      const chatId = callbackQuery.message.chat.id;
      const data = callbackQuery.data;

      if (data === 'support') {
        mainBot.sendMessage(
          chatId, 
          `Контакт нашей поддержки: @${SUPPORT_USERNAME}\nИли напишите на email: support@knigavl.ru`
        );
      }

      // Отвечаем на callback query
      mainBot.answerCallbackQuery(callbackQuery.id);
    });

    console.log('Основной бот успешно запущен');
    return mainBot;
  } catch (error) {
    console.error('Ошибка при инициализации основного бота:', error);
    return null;
  }
}

/**
 * Инициализирует бот технической поддержки
 */
function initializeSupportBot() {
  try {
    supportBot = new TelegramBot(SUPPORT_BOT_TOKEN, { polling: { interval: 1000, autoStart: true, params: { timeout: 10 } } });
    console.log('Бот поддержки инициализирован');

    supportBot.on('error', (error) => handleBotError(error, 'Бот поддержки'));

    // Загружаем данные о чатах
    loadChatsData();

    // Обработчик команды /start
    supportBot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const username = msg.from.username || 'Неизвестный пользователь';
      
      // Сохраняем информацию о пользователе
      activeChats[userId] = {
        chatId: chatId,
        username: username,
        firstName: msg.from.first_name || '',
        lastName: msg.from.last_name || '',
        lastActivity: new Date().toISOString()
      };
      
      // Сохраняем обновленные данные
      saveChatsData();
      
      // Если это сотрудник поддержки, отправляем клавиатуру с командами
      if (userId.toString() === SUPPORT_STAFF_ID) {
        supportBot.sendMessage(
          chatId,
          'Здравствуйте! Вы авторизованы как сотрудник поддержки. Используйте кнопки для управления обращениями.',
          staffKeyboard
        );
        return;
      }
      
      // Отправляем приветствие обычному пользователю
      supportBot.sendMessage(
        chatId, 
        'Здравствуйте! Это бот технической поддержки книгавл.ру.\n\n' +
        'Опишите вашу проблему, и наш сотрудник ответит вам в ближайшее время.'
      );
      
      // Уведомляем сотрудника поддержки о новом обращении
      sendStaffNotification(userId);
    });

    // Обработчик всех сообщений от пользователей
    supportBot.on('message', (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      
      // Если сообщение от сотрудника поддержки
      if (userId.toString() === SUPPORT_STAFF_ID) {
        // Проверяем, находится ли сотрудник в режиме ответа
        if (awaitingReply[chatId]) {
          const targetUserId = awaitingReply[chatId];
          
          // Удаляем режим ожидания ответа
          delete awaitingReply[chatId];
          
          // Проверяем тип сообщения и пересылаем его пользователю
          if (msg.text) {
            // Текстовое сообщение
            sendReplyToUser(targetUserId, msg.text, chatId);
          } else if (msg.photo) {
            // Фотография
            forwardMediaToUser(targetUserId, msg, 'photo', chatId);
          } else if (msg.document) {
            // Документ
            forwardMediaToUser(targetUserId, msg, 'document', chatId);
          } else if (msg.video) {
            // Видео
            forwardMediaToUser(targetUserId, msg, 'video', chatId);
          } else if (msg.voice) {
            // Голосовое сообщение
            forwardMediaToUser(targetUserId, msg, 'voice', chatId);
          } else if (msg.audio) {
            // Аудио
            forwardMediaToUser(targetUserId, msg, 'audio', chatId);
          } else if (msg.sticker) {
            // Стикер
            forwardMediaToUser(targetUserId, msg, 'sticker', chatId);
          } else {
            // Другие типы сообщений
            supportBot.sendMessage(
              chatId,
              '❌ Этот тип сообщения не поддерживается для пересылки.',
              staffKeyboard
            );
          }
          return;
        }
        
        // Проверяем, является ли это ответом с командой /reply
        if (msg.text && msg.text.startsWith('/reply')) {
          handleReplyCommand(msg);
          return;
        }
        
        // Обрабатываем текстовые команды с кнопок
        if (msg.text === '📋 Список обращений') {
          sendActiveChats(chatId);
          return;
        } else if (msg.text === '🧹 Очистить неактивные') {
          clearInactiveChats(chatId);
          return;
        } else if (msg.text === '❓ Помощь') {
          sendHelpInfo(chatId, true);
          return;
        }
        
        return;
      }
      
      // Если сообщение от обычного пользователя
      // Сохраняем информацию о пользователе, если это новый пользователь
      if (!activeChats[userId]) {
        const username = msg.from.username || 'Неизвестный пользователь';
        activeChats[userId] = {
          chatId: chatId,
          username: username,
          firstName: msg.from.first_name || '',
          lastName: msg.from.last_name || '',
          lastActivity: new Date().toISOString()
        };
      } else {
        // Обновляем время последней активности
        activeChats[userId].lastActivity = new Date().toISOString();
      }
      
      // Сохраняем обновленные данные
      saveChatsData();
      
      // Пересылаем сообщение сотруднику поддержки
      forwardMessageToStaff(msg, userId);
      
      // Отправляем подтверждение пользователю
      supportBot.sendMessage(
        chatId,
        'Ваше сообщение получено. Сотрудник поддержки ответит вам в ближайшее время.'
      );
    });

    // Обработчик нажатий на inline-кнопки
    supportBot.on('callback_query', (callbackQuery) => {
      const action = callbackQuery.data;
      const msg = callbackQuery.message;
      const chatId = msg.chat.id;
      
      // Проверяем, что это кнопка для ответа пользователю
      if (action.startsWith('reply_to_')) {
        const userId = action.split('_')[2];
        
        // Проверяем, существует ли такой пользователь
        if (activeChats[userId]) {
          // Устанавливаем режим ожидания ответа
          awaitingReply[chatId] = userId;
          
          // Отправляем сообщение с инструкцией для ответа
          supportBot.sendMessage(
            chatId,
            `✏️ Введите ответ для пользователя ${activeChats[userId].username}:\n\n` +
            `Просто напишите текст сообщения или отправьте фото/документ/стикер.`
          );
        } else {
          // Пользователь не найден
          supportBot.sendMessage(
            chatId,
            `❌ Ошибка: пользователь с ID ${userId} не найден в активных чатах.`,
            staffKeyboard
          );
        }
      }
      
      // Отвечаем на callback query
      supportBot.answerCallbackQuery(callbackQuery.id);
    });

    // Обработчики команд
    supportBot.onText(/\/list/, (msg) => {
      const userId = msg.from.id;
      if (userId.toString() !== SUPPORT_STAFF_ID) return;
      sendActiveChats(msg.chat.id);
    });

    supportBot.onText(/\/help/, (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      sendHelpInfo(chatId, userId.toString() === SUPPORT_STAFF_ID);
    });

    supportBot.onText(/\/clear/, (msg) => {
      const userId = msg.from.id;
      if (userId.toString() !== SUPPORT_STAFF_ID) return;
      clearInactiveChats(msg.chat.id);
    });

    console.log('Бот технической поддержки успешно запущен');
    return supportBot;
  } catch (error) {
    console.error('Ошибка при инициализации бота поддержки:', error);
    return null;
  }
}

// Вспомогательные функции для бота поддержки
function sendStaffNotification(userId) {
  const user = activeChats[userId];
  if (!user) return;
  
  // Создаем inline-клавиатуру для быстрого ответа
  const inlineKeyboard = {
    inline_keyboard: [
      [{ text: '✏️ Ответить', callback_data: `reply_to_${userId}` }]
    ]
  };
  
  supportBot.sendMessage(
    SUPPORT_STAFF_ID,
    `📩 Новое обращение в техподдержку!\n\n` +
    `От: ${user.username} (${user.firstName} ${user.lastName})\n` +
    `ID: ${userId}\n\n` +
    `Для ответа нажмите кнопку ниже:`,
    { reply_markup: inlineKeyboard }
  );
}

function sendReplyToUser(userId, replyText, staffChatId) {
  if (!activeChats[userId]) {
    supportBot.sendMessage(
      staffChatId,
      `❌ Ошибка: пользователь с ID ${userId} не найден в активных чатах.`,
      staffKeyboard
    );
    return;
  }
  
  supportBot.sendMessage(
    activeChats[userId].chatId,
    `💬 Ответ от службы поддержки:\n\n${replyText}`
  );
  
  activeChats[userId].lastActivity = new Date().toISOString();
  saveChatsData();
  
  supportBot.sendMessage(
    staffChatId,
    `✅ Ответ пользователю ${activeChats[userId].username} отправлен!`,
    staffKeyboard
  );
}

function forwardMediaToUser(userId, msg, mediaType, staffChatId) {
  if (!activeChats[userId]) {
    supportBot.sendMessage(
      staffChatId,
      `❌ Ошибка: пользователь с ID ${userId} не найден в активных чатах.`,
      staffKeyboard
    );
    return;
  }
  
  const userChatId = activeChats[userId].chatId;
  const caption = msg.caption ? `💬 Ответ от службы поддержки:\n\n${msg.caption}` : '💬 Ответ от службы поддержки:';
  
  try {
    switch (mediaType) {
      case 'photo':
        const photoId = msg.photo[msg.photo.length - 1].file_id;
        supportBot.sendPhoto(userChatId, photoId, { caption: caption });
        break;
      case 'document':
        supportBot.sendDocument(userChatId, msg.document.file_id, { caption: caption });
        break;
      case 'video':
        supportBot.sendVideo(userChatId, msg.video.file_id, { caption: caption });
        break;
      case 'voice':
        supportBot.sendVoice(userChatId, msg.voice.file_id, { caption: caption });
        break;
      case 'audio':
        supportBot.sendAudio(userChatId, msg.audio.file_id, { caption: caption });
        break;
      case 'sticker':
        supportBot.sendSticker(userChatId, msg.sticker.file_id);
        break;
      default:
        supportBot.sendMessage(staffChatId, '❌ Этот тип медиа не поддерживается.', staffKeyboard);
        return;
    }
    
    activeChats[userId].lastActivity = new Date().toISOString();
    saveChatsData();
    
    supportBot.sendMessage(
      staffChatId,
      `✅ Медиа-сообщение отправлено пользователю ${activeChats[userId].username}!`,
      staffKeyboard
    );
  } catch (error) {
    console.error('Ошибка при отправке медиа:', error);
    supportBot.sendMessage(
      staffChatId,
      `❌ Ошибка при отправке медиа: ${error.message}`,
      staffKeyboard
    );
  }
}

function handleReplyCommand(msg) {
  const parts = msg.text.split(' ');
  if (parts.length >= 3) {
    const targetUserId = parts[1];
    const replyText = parts.slice(2).join(' ');
    
    sendReplyToUser(targetUserId, replyText, msg.chat.id);
  } else {
    supportBot.sendMessage(
      msg.chat.id,
      '❌ Неверный формат команды. Используйте:\n/reply USER_ID Ваш ответ',
      staffKeyboard
    );
  }
}

function forwardMessageToStaff(msg, userId) {
  const inlineKeyboard = {
    inline_keyboard: [
      [{ text: '✏️ Ответить', callback_data: `reply_to_${userId}` }]
    ]
  };
  
  if (msg.text) {
    // Текстовое сообщение
    let forwardText = `📨 Сообщение от пользователя:\n\n`;
    forwardText += `От: ${activeChats[userId].username} (${activeChats[userId].firstName} ${activeChats[userId].lastName})\n`;
    forwardText += `ID: ${userId}\n\n`;
    forwardText += `Сообщение: ${msg.text}\n\n`;
    forwardText += `Для ответа нажмите кнопку ниже:`;
    
    supportBot.sendMessage(SUPPORT_STAFF_ID, forwardText, { reply_markup: inlineKeyboard });
  } else {
    // Сначала отправляем информацию о пользователе
    let userInfo = `📨 Сообщение от пользователя:\n\n`;
    userInfo += `От: ${activeChats[userId].username} (${activeChats[userId].firstName} ${activeChats[userId].lastName})\n`;
    userInfo += `ID: ${userId}\n\n`;
    userInfo += `Для ответа нажмите кнопку ниже:`;
    
    supportBot.sendMessage(SUPPORT_STAFF_ID, userInfo, { reply_markup: inlineKeyboard });
    
    // Затем пересылаем само медиа-сообщение
    if (msg.photo) {
      // Фотография
      const photoId = msg.photo[msg.photo.length - 1].file_id;
      const caption = msg.caption ? msg.caption : '';
      supportBot.sendPhoto(SUPPORT_STAFF_ID, photoId, { 
        caption: `📷 Фото от пользователя ${activeChats[userId].username} (ID: ${userId})\n${caption}`,
        reply_markup: inlineKeyboard
      });
    } else if (msg.document) {
      // Документ
      supportBot.sendDocument(SUPPORT_STAFF_ID, msg.document.file_id, {
        caption: `📎 Документ от пользователя ${activeChats[userId].username} (ID: ${userId})`,
        reply_markup: inlineKeyboard
      });
    } else if (msg.video) {
      // Видео
      supportBot.sendVideo(SUPPORT_STAFF_ID, msg.video.file_id, {
        caption: `🎥 Видео от пользователя ${activeChats[userId].username} (ID: ${userId})`,
        reply_markup: inlineKeyboard
      });
    } else if (msg.voice) {
      // Голосовое сообщение
      supportBot.sendVoice(SUPPORT_STAFF_ID, msg.voice.file_id, {
        caption: `🎤 Голосовое сообщение от пользователя ${activeChats[userId].username} (ID: ${userId})`,
        reply_markup: inlineKeyboard
      });
    } else if (msg.audio) {
      // Аудио
      supportBot.sendAudio(SUPPORT_STAFF_ID, msg.audio.file_id, {
        caption: `🎵 Аудио от пользователя ${activeChats[userId].username} (ID: ${userId})`,
        reply_markup: inlineKeyboard
      });
    } else if (msg.sticker) {
      // Стикер
      supportBot.sendSticker(SUPPORT_STAFF_ID, msg.sticker.file_id)
        .then(() => {
          supportBot.sendMessage(
            SUPPORT_STAFF_ID,
            `🎭 Стикер от пользователя ${activeChats[userId].username} (ID: ${userId})`,
            { reply_markup: inlineKeyboard }
          );
        });
    } else {
      // Неизвестный тип сообщения
      supportBot.sendMessage(
        SUPPORT_STAFF_ID,
        `⚠️ Получено сообщение неподдерживаемого типа от пользователя ${activeChats[userId].username} (ID: ${userId})`,
        { reply_markup: inlineKeyboard }
      );
    }
  }
}

function sendActiveChats(chatId) {
  let chatsList = '📋 Список активных обращений:\n\n';
  
  const userIds = Object.keys(activeChats);
  if (userIds.length === 0) {
    chatsList += 'Нет активных обращений';
    supportBot.sendMessage(chatId, chatsList, staffKeyboard);
    return;
  }
  
  // Сортируем пользователей по времени последней активности (сначала новые)
  userIds.sort((a, b) => {
    const dateA = new Date(activeChats[a].lastActivity);
    const dateB = new Date(activeChats[b].lastActivity);
    return dateB - dateA;
  });
  
  // Отправляем информацию о каждом пользователе с кнопкой для ответа
  userIds.forEach((id, index) => {
    const user = activeChats[id];
    const lastActivityDate = new Date(user.lastActivity);
    const formattedDate = `${lastActivityDate.toLocaleDateString()} ${lastActivityDate.toLocaleTimeString()}`;
    
    const userInfo = `${index + 1}. ${user.username} (${user.firstName} ${user.lastName})\n` +
                    `ID: ${id}\n` +
                    `Последняя активность: ${formattedDate}`;
    
    // Создаем inline-клавиатуру для быстрого ответа
    const inlineKeyboard = {
      inline_keyboard: [
        [{ text: '✏️ Ответить', callback_data: `reply_to_${id}` }]
      ]
    };
    
    supportBot.sendMessage(chatId, userInfo, { reply_markup: inlineKeyboard });
  });
}

function clearInactiveChats(chatId) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 дней назад
  let removedCount = 0;
  
  Object.keys(activeChats).forEach(id => {
    const lastActivity = new Date(activeChats[id].lastActivity);
    if (lastActivity < thirtyDaysAgo) {
      delete activeChats[id];
      removedCount++;
    }
  });
  
  saveChatsData();
  
  supportBot.sendMessage(
    chatId,
    `🧹 Очистка завершена. Удалено ${removedCount} неактивных чатов.\n` +
    `Осталось активных чатов: ${Object.keys(activeChats).length}`,
    staffKeyboard
  );
}

function sendHelpInfo(chatId, isStaff) {
  if (isStaff) {
    supportBot.sendMessage(
      chatId,
      '🔍 Команды для сотрудника поддержки:\n\n' +
      '📋 Список обращений - показать список активных обращений\n' +
      '✏️ Ответить - кнопка для быстрого ответа пользователю\n' +
      '🧹 Очистить неактивные - удалить чаты старше 30 дней\n' +
      '❓ Помощь - показать эту справку\n\n' +
      'После нажатия на кнопку "Ответить" просто введите текст ответа или отправьте фото/документ/стикер.\n' +
      'Все типы медиа поддерживаются как для получения от пользователя, так и для отправки пользователю.',
      staffKeyboard
    );
  } else {
    supportBot.sendMessage(
      chatId,
      '🔍 Справка:\n\n' +
      'Просто отправьте ваш вопрос или проблему в этот чат, и наш сотрудник ответит вам в ближайшее время.\n\n' +
      'Вы можете отправлять текст, фотографии, документы и другие типы сообщений.'
    );
  }
}

// Функция для закрытия ботов при завершении работы
function stopBots() {
  if (mainBot) {
    mainBot.stopPolling();
    console.log('Основной бот остановлен');
  }
  
  if (supportBot) {
    saveChatsData();
    supportBot.stopPolling();
    console.log('Бот технической поддержки остановлен');
  }
}

// Экспорт функций для использования в основном приложении
module.exports = {
  initializeMainBot,
  initializeSupportBot,
  stopBots
}; 