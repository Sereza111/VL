const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');

// Отправка запроса в друзья
router.post('/request', friendController.sendFriendRequest);

// Получение запросов в друзья по Telegram ID пользователя
router.get('/requests/telegram/:telegramId', friendController.getFriendRequestsByTelegramId);

// Получение запросов в друзья по ID пользователя
router.get('/requests/:userId', friendController.getFriendRequests);

// Принятие запроса в друзья
router.post('/accept', friendController.acceptFriendRequest);

// Отклонение запроса в друзья
router.post('/reject', friendController.rejectFriendRequest);

// Получение списка друзей по Telegram ID пользователя
router.get('/telegram/:telegramId', friendController.getFriendsListByTelegramId);

// Получение списка друзей по ID пользователя
router.get('/:userId', friendController.getFriendsList);

module.exports = router;
