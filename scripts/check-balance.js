/**
 * Скрипт для просмотра текущего баланса пользователя
 * Использование: node scripts/check-balance.js <telegram_id>
 * Пример: node scripts/check-balance.js 7121428208
 */

const sequelize = require('../config/database');
const { User, UserItem, Item } = require('../models/associations');

// Функция для просмотра баланса и предметов пользователя
const checkBalance = async (telegramId) => {
  try {
    // Подключаемся к базе данных
    await sequelize.authenticate();
    console.log('Подключение к базе данных установлено.');

    // Находим пользователя по Telegram ID
    const user = await User.findOne({ where: { telegram_id: telegramId } });
    
    if (!user) {
      console.error(`Пользователь с Telegram ID ${telegramId} не найден.`);
      process.exit(1);
    }
    
    // Получаем текущий баланс
    const currentBalance = parseFloat(user.balance || 0);
    
    console.log(`\nИнформация о пользователе ${telegramId}:`);
    console.log(`ID: ${user.id}`);
    console.log(`Имя: ${user.first_name} ${user.last_name || ''}`);
    console.log(`Username: ${user.username || 'не указан'}`);
    console.log(`Баланс: ${currentBalance.toFixed(2)} VL`);
    console.log(`Опыт: ${user.exp || 0}`);
    
    // Получаем предметы пользователя
    // Настраиваем связи
    UserItem.belongsTo(Item, { foreignKey: 'item_id', as: 'item' });
    
    const userItems = await UserItem.findAll({
      where: { user_id: user.id },
      include: [{
        model: Item,
        as: 'item'
      }]
    });
    
    if (userItems && userItems.length > 0) {
      console.log('\nПредметы пользователя:');
      let totalIncome = 0;
      
      userItems.forEach(userItem => {
        const item = userItem.item;
        const income = parseFloat(item.income_per_hour || 0) * (userItem.quantity || 1);
        totalIncome += income;
        
        console.log(`- ${item.name} (ID: ${item.id}): ${userItem.quantity} шт. - ${income.toFixed(2)} VL/час`);
      });
      
      console.log(`\nОбщий доход: ${totalIncome.toFixed(2)} VL/час (${(totalIncome * 24).toFixed(2)} VL/день)`);
    } else {
      console.log('\nУ пользователя нет предметов.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Ошибка при получении информации о пользователе:', error);
    process.exit(1);
  }
};

// Получаем аргументы командной строки
const args = process.argv.slice(2);

if (args.length !== 1) {
  console.error('Использование: node scripts/check-balance.js <telegram_id>');
  console.error('Пример: node scripts/check-balance.js 7121428208');
  process.exit(1);
}

const [telegramId] = args;

// Запускаем функцию проверки баланса
checkBalance(telegramId); 