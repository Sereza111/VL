/**
 * Скрипт для исправления баланса пользователя
 * Использование: node scripts/fix-balance.js <telegram_id> <new_balance>
 * Пример: node scripts/fix-balance.js 7121428208 100
 */

const sequelize = require('../config/database');
const { User } = require('../models/associations');

// Функция для исправления баланса пользователя
const fixBalance = async (telegramId, newBalance) => {
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
    const newBalanceValue = parseFloat(newBalance);
    
    if (isNaN(newBalanceValue)) {
      console.error(`Некорректная сумма: ${newBalance}`);
      process.exit(1);
    }
    
    // Обновляем баланс
    user.balance = newBalanceValue.toFixed(2);
    await user.save();
    
    console.log(`Баланс пользователя ${telegramId} успешно исправлен:`);
    console.log(`Было: ${currentBalance.toFixed(2)} VL`);
    console.log(`Стало: ${newBalanceValue.toFixed(2)} VL`);
    
    process.exit(0);
  } catch (error) {
    console.error('Ошибка при исправлении баланса:', error);
    process.exit(1);
  }
};

// Получаем аргументы командной строки
const args = process.argv.slice(2);

if (args.length !== 2) {
  console.error('Использование: node scripts/fix-balance.js <telegram_id> <new_balance>');
  console.error('Пример: node scripts/fix-balance.js 7121428208 100');
  process.exit(1);
}

const [telegramId, newBalance] = args;

// Запускаем функцию исправления баланса
fixBalance(telegramId, newBalance); 