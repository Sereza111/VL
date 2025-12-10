const sequelize = require('../config/database');
const { Item } = require('../models/associations');

// Инициализация таблицы предметов
const initItems = async () => {
  try {
    await sequelize.authenticate();
    console.log('Подключение к MySQL установлено успешно.');
    
    // Синхронизируем модель с базой данных (не удаляя существующие таблицы)
    await sequelize.sync({ force: false });
    
    // Проверяем, есть ли уже предметы в базе
    const existingItems = await Item.count();
    console.log(`Найдено существующих предметов: ${existingItems}`);
    
    if (existingItems === 0) {
      console.log('Создание начальных предметов...');
      
      // Создаем начальные предметы
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
        },
        {
          name: 'Крипто-завод',
          description: 'Генерирует 50 VL/час',
          price: 10000,
          income_per_hour: 50,
          image_url: '/assets/items/crypto-factory.svg',
          type: 'artifact',
          status: 'active'
        },
        {
          name: 'Arcanum Sigil',
          description: 'Древний символ мудрости',
          price: 200,
          income_per_hour: 1,
          image_url: '/assets/items/arcanum-sigil.svg',
          type: 'artifact',
          status: 'active'
        },
        {
          name: 'Shadow Essence',
          description: 'Эссенция теней',
          price: 300,
          income_per_hour: 1.5,
          image_url: '/assets/items/shadow-essence.svg',
          type: 'consumable',
          status: 'active'
        },
        {
          name: 'Luminous Crystal',
          description: 'Светящийся кристалл',
          price: 500,
          income_per_hour: 2.5,
          image_url: '/assets/items/luminous-crystal.svg',
          type: 'artifact',
          status: 'active'
        },
        {
          name: 'Time Fragment',
          description: 'Фрагмент времени',
          price: 1000,
          income_per_hour: 5,
          image_url: '/assets/items/time-fragment.svg',
          type: 'artifact',
          status: 'active'
        },
        {
          name: 'Spirit Vessel',
          description: 'Сосуд духов',
          price: 2000,
          income_per_hour: 10,
          image_url: '/assets/items/spirit-vessel.svg',
          type: 'consumable',
          status: 'active'
        },
        {
          name: 'Verdant Seed',
          description: 'Зеленое семя',
          price: 5000,
          income_per_hour: 25,
          image_url: '/assets/items/verdant-seed.svg',
          type: 'artifact',
          status: 'active'
        },
        {
          name: 'Aether Prism',
          description: 'Эфирная призма',
          price: 10000,
          income_per_hour: 50,
          image_url: '/assets/items/aether-prism.svg',
          type: 'artifact',
          status: 'active'
        },
        {
          name: 'Mysterium Codex',
          description: 'Кодекс тайн',
          price: 20000,
          income_per_hour: 100,
          image_url: '/assets/items/mysterium-codex.svg',
          type: 'legendary',
          status: 'active'
        }
      ]);
      
      console.log(`Создано ${items.length} начальных предметов`);
    }
    
    console.log('Инициализация предметов завершена успешно');
    process.exit(0);
  } catch (error) {
    console.error('Ошибка при инициализации предметов:', error);
    process.exit(1);
  }
};

// Запускаем инициализацию
initItems(); 