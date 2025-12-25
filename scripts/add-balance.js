/**
 * Скрипт для добавления VL определенному пользователю
 * Использование: node scripts/add-balance.js <telegram_id> <amount>
 * Пример: node scripts/add-balance.js 7121428208 1000
 */

const sequelize = require('../config/database');
const { User } = require('../models/associations');

// Функция для добавления баланса пользователю
const addBalance = async (telegramId, amount) => {
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
    const amountToAdd = parseFloat(amount);
    
    if (isNaN(amountToAdd)) {
      console.error(`Некорректная сумма: ${amount}`);
      process.exit(1);
    }
    
    // Рассчитываем новый баланс
    const newBalance = currentBalance + amountToAdd;
    
    // Обновляем баланс
    user.balance = newBalance.toFixed(2);
    await user.save();
    
    console.log(`Баланс пользователя ${telegramId} успешно обновлен:`);
    console.log(`Было: ${currentBalance.toFixed(2)} VL`);
    console.log(`Добавлено: ${amountToAdd.toFixed(2)} VL`);
    console.log(`Стало: ${newBalance.toFixed(2)} VL`);
    
    process.exit(0);
  } catch (error) {
    console.error('Ошибка при добавлении баланса:', error);
    process.exit(1);
  }
};

// Получаем аргументы командной строки
const args = process.argv.slice(2);

if (args.length !== 2) {
  console.error('Использование: node scripts/add-balance.js <telegram_id> <amount>');
  console.error('Пример: node scripts/add-balance.js 7121428208 1000');
  process.exit(1);
}

const [telegramId, amount] = args;

// Запускаем функцию добавления баланса
addBalance(telegramId, amount); 