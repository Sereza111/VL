const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Получение всех пользователей
router.get('/', userController.getAllUsers);

// Получение пользователя по telegram_id
router.get('/by-telegram/:telegramId', userController.getUserByTelegramId);

// Создание или обновление пользователя
router.post('/', userController.createOrUpdateUser);

// Обновление баланса пользователя по ID
router.put('/:id/balance', userController.updateUserBalanceById);

// Получение задач пользователя по ID
router.get('/:id/tasks', userController.getUserTasksById);

// Получение пользователя по ID
router.get('/:id', userController.getUserById);

// Обновление пользователя по ID
router.put('/:id', userController.updateUserById);

// Получение баланса пользователя
router.get('/:telegramId/balance', userController.getUserBalance);

// Обновление баланса пользователя (POST метод)
router.post('/:telegramId/balance', userController.updateUserBalancePost);

// Обновление баланса пользователя (PUT метод)
router.put('/:telegramId/balance', userController.updateUserBalancePut);

// Начисление пассивного дохода всем пользователям (админский маршрут)
router.post('/admin/distribute-passive-income', userController.distributePassiveIncome);

// Маршруты для предметов пользователя
router.get('/:id/items', userController.getUserItems);
router.post('/:id/items', userController.addItemToUser);
// Атомарная покупка предмета
router.post('/:id/purchase', userController.purchaseItem);

module.exports = router;
