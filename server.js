const express = require('express');
// const mongoose = require('mongoose'); // Удаляем Mongoose
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Импорт Sequelize и моделей
const sequelize = require('./config/database');
const { User, Task, UserTask, Friend, Item, UserItem } = require('./models/associations');

// Импорт маршрутов
const userRoutes = require('./routes/userRoutes');
const friendRoutes = require('./routes/friendRoutes');
const taskRoutes = require('./routes/taskRoutes');

// Импорт контроллеров для запланированных задач
const userController = require('./controllers/userController');
// Telegram WebApp auth middleware
const { telegramWebAppAuth } = require('./middleware/telegramAuth');

// Импорт модуля Telegram-ботов
const telegramBots = require('./bots');

// Создаем Express приложение
const app = express();
const PORT = process.env.PORT || 10001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // Разрешаем загрузку стилей с Google Fonts и инлайн-стили для совместимости
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      // Разрешаем загрузку скрипта Telegram WebApp и (в dev) unsafe-eval для некоторых бандлеров
      scriptSrc: [
        "'self'",
        'https://telegram.org',
        process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : null
      ].filter(Boolean),
      // Шрифты с fonts.gstatic.com и data:
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'https:'],
      // Для Tone.js и других библиотек, создающих web workers из blob:
      workerSrc: ["'self'", 'blob:'],
      // Разрешаем соединения с Telegram API и собственным доменом
      connectSrc: ["'self'", 'https://api.telegram.org']
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS allowlist
const allowedOrigins = ['https://knigavl.ru', 'https://www.knigavl.ru'];
if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push('http://localhost:3000', 'http://localhost:3001', 'http://localhost:8000');
}
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    return callback(new Error('CORS not allowed'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-telegram-init-data']
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
const strictLimiter = rateLimit({ windowMs: 5 * 60 * 1000, max: 10 });
app.use('/api/', apiLimiter);
app.use('/api/users/*/balance', strictLimiter);
app.use('/api/users/admin/', strictLimiter);

// Обработка предварительных запросов OPTIONS для CORS
app.options('*', cors());

// Маршрут для проверки работоспособности API
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    await sequelize.authenticate();
    dbStatus = 'connected';
  } catch (error) {
    console.error('Ошибка проверки подключения к MySQL:', error.message);
    dbStatus = 'error';
  }
  res.json({ 
    status: 'ok',
    mysql: dbStatus,
    timestamp: new Date().toISOString(),
    env: {
      node_env: process.env.NODE_ENV,
      mysql_host: process.env.MYSQL_HOST ? 'set' : 'not set',
      mysql_database: process.env.MYSQL_DATABASE ? 'set' : 'not set'
    }
  });
});

// Подключение к MySQL и синхронизация моделей
const connectAndSyncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Подключение к MySQL установлено успешно.');
    
    try {
      const [tables] = await sequelize.query('SHOW TABLES');
      console.log('Таблицы в базе данных:', tables);
      
      try {
        const [userTasksDesc] = await sequelize.query('DESCRIBE user_tasks');
        console.log('Структура таблицы user_tasks:', userTasksDesc);
      } catch (descError) {
        console.error('Ошибка при получении структуры таблицы user_tasks:', descError);
      }
    } catch (tableError) {
      console.error('Ошибка при получении списка таблиц:', tableError);
    }

    await sequelize.sync({ force: false });
    console.log('Все модели успешно синхронизированы с базой данных.');
    await initDatabase();
    startScheduledTasks();
    startTelegramBots();
  } catch (error) {
    console.error('Невозможно подключиться к базе данных MySQL:', error);
    process.exit(1);
  }
};

// Инициализация Telegram-ботов
const startTelegramBots = () => {
  console.log('Запуск Telegram-ботов...');
  try {
    const mainBot = telegramBots.initializeMainBot();
    const supportBot = telegramBots.initializeSupportBot();
    
    if (mainBot && supportBot) {
      console.log('Все Telegram-боты успешно запущены');
    } else {
      console.error('Не удалось запустить один или оба Telegram-бота');
    }
  } catch (error) {
    console.error('Ошибка при запуске Telegram-ботов:', error);
  }
};

// Инициализация базы данных
const initDatabase = async () => {
  try {
    console.log('Начало инициализации базы данных...');
    const existingTasks = await Task.count();
    console.log(`Найдено существующих задач: ${existingTasks}`);
    
    if (existingTasks === 0) {
      console.log('Создание начальных задач...');
      const tasks = await Task.bulkCreate([
        {
          title: 'Пригласить друга',
          description: 'Пригласите друга в приложение и получите награду',
          reward: 100,
          status: 'active'
        },
        {
          title: 'Выполнить 10 заданий',
          description: 'Выполните 10 любых заданий',
          reward: 200,
          status: 'active'
        },
        {
          title: 'Достичь 5 уровня',
          description: 'Достигните 5 уровня в приложении',
          reward: 300,
          status: 'active'
        },
        {
          title: 'Заработать 1000 VL',
          description: 'Заработайте 1000 VL любым способом',
          reward: 500,
          status: 'active'
        },
        // Новые задачи
        {
          title: 'Подписка на канал',
          description: 'Подпишитесь на официальный канал VLTOKEN',
          reward: 50,
          status: 'active'
        },
        {
          title: 'Ежедневный бонус',
          description: 'Получите ежедневный бонус',
          reward: 10,
          status: 'active'
        }
      ]);
      console.log(`Создано ${tasks.length} начальных задач`);
    }

    // Проверяем и создаем начальные предметы
    const existingItems = await Item.count();
    console.log(`Найдено существующих предметов: ${existingItems}`);
    
    if (existingItems === 0) {
      console.log('Создание начальных предметов...');
      const items = await Item.bulkCreate([
        {
          name: 'Крипто-майнер',
          description: 'Генерирует 0.5 VL/час',
          price: 100,
          income_per_hour: 0.5,
          image_url: '/assets/items/crypto-miner.svg',
          type: 'artifact',
          status: 'active'
        },
        {
          name: 'VL Ферма',
          description: 'Генерирует 2.5 VL/час',
          price: 500,
          income_per_hour: 2.5,
          image_url: '/assets/items/vl-farm.svg',
          type: 'artifact',
          status: 'active'
        },
        {
          name: 'Бизнес',
          description: 'Генерирует 10 VL/час',
          price: 2000,
          income_per_hour: 10,
          image_url: '/assets/items/business.svg',
          type: 'artifact',
          status: 'active'
        }
      ]);
      console.log(`Создано ${items.length} начальных предметов`);
    }

    const existingUserTasks = await UserTask.count();
    console.log(`Найдено существующих связей пользователь-задача: ${existingUserTasks}`);

    if (existingUserTasks === 0) {
      console.log('Создание тестовой связи пользователь-задача...');
      try {
        const firstUser = await User.findOne();
        const firstTask = await Task.findOne();
        
        if (firstUser && firstTask) {
          const userTask = await UserTask.create({
            user_id: firstUser.id,
            task_id: firstTask.id,
            status: 'pending'
          });
          console.log(`Создана тестовая связь: ${JSON.stringify(userTask.toJSON())}`);
        } else {
          console.log('Не удалось найти пользователя или задачу для создания тестовой связи');
        }
      } catch (userTaskError) {
        console.error('Ошибка при создании тестовой связи пользователь-задача:', userTaskError);
      }
    }

    // Создаем тестовые предметы для пользователей
    const existingUserItems = await UserItem.count();
    console.log(`Найдено существующих связей пользователь-предмет: ${existingUserItems}`);

    if (existingUserItems === 0) {
      console.log('Создание тестовых связей пользователь-предмет...');
      try {
        const firstUser = await User.findOne();
        const items = await Item.findAll({ limit: 3 });
        
        if (firstUser && items.length > 0) {
          for (const item of items) {
            await UserItem.create({
              user_id: firstUser.id,
              item_id: item.id,
              quantity: 1
            });
          }
          console.log(`Созданы тестовые связи пользователь-предмет для пользователя ${firstUser.id}`);
        } else {
          console.log('Не удалось найти пользователя или предметы для создания тестовых связей');
        }
      } catch (userItemError) {
        console.error('Ошибка при создании тестовых связей пользователь-предмет:', userItemError);
      }
    }

    console.log('База данных успешно инициализирована');
    return true;
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error);
    return false;
  }
};

// Запланированные задачи
const startScheduledTasks = () => {
  console.log('Запуск запланированных задач...');
  
  // Переменная для хранения таймера
  let incomeDistributionTimer = null;
  
  // Функция для запуска начисления пассивного дохода
  const runIncomeDistribution = async () => {
    console.log(`[${new Date().toISOString()}] Выполнение запланированной задачи: начисление пассивного дохода`);
    try {
      const req = {};
      const res = {
        json: (data) => console.log(`[${new Date().toISOString()}] Результат начисления пассивного дохода:`, data),
        status: (code) => ({
          json: (data) => console.log(`[${new Date().toISOString()}] Ошибка (${code}):`, data)
        })
      };
      await userController.distributePassiveIncome(req, res);
      
      // Планируем следующее выполнение через час
      clearTimeout(incomeDistributionTimer);
      incomeDistributionTimer = setTimeout(runIncomeDistribution, 60 * 60 * 1000);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Ошибка при выполнении запланированной задачи начисления пассивного дохода:`, error);
      
      // В случае ошибки, повторяем через 5 минут
      clearTimeout(incomeDistributionTimer);
      incomeDistributionTimer = setTimeout(runIncomeDistribution, 5 * 60 * 1000);
    }
  };
  
  // Запускаем первое начисление через 1 минуту после старта сервера
  incomeDistributionTimer = setTimeout(runIncomeDistribution, 60 * 1000);

  console.log('Запланированные задачи успешно запущены');
};

// API маршруты
// Require Telegram WebApp auth for mutating requests
const strictAuthForMutations = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
    return telegramWebAppAuth(true)(req, res, next);
  }
  return next();
};

app.use('/api/users', strictAuthForMutations, userRoutes);
app.use('/api/friends', strictAuthForMutations, friendRoutes);
app.use('/api/tasks', strictAuthForMutations, taskRoutes);

// --- Подключение React (build) ---
app.use(express.static(path.join(__dirname, 'build')));

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  }
});

// Логирование
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`PORT: ${PORT}`);

// Запуск сервера
app.listen(PORT, async () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  await connectAndSyncDatabase();
});

// Обработка завершения работы
process.on('SIGINT', () => {
  console.log('\nЗавершение работы сервера...');
  
  // Останавливаем Telegram-боты перед выходом
  telegramBots.stopBots();
  
  console.log('Сервер успешно остановлен.');
  process.exit(0);
});
