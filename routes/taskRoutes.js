const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// Получение всех задач
router.get('/', taskController.getAllTasks);

// Получение задач пользователя
router.get('/user/:userId', taskController.getUserTasks);

// Назначение задачи пользователю
router.post('/assign', taskController.assignTaskToUser);

// Завершение задачи пользователя
router.post('/complete', taskController.completeUserTask);

// Новые маршруты для специальных задач
router.post('/check-channel-subscription', taskController.checkChannelSubscriptionTask);
router.post('/claim-daily-bonus', taskController.claimDailyBonus);

// Новые маршруты для специфических задач
router.post('/complete-telegram', taskController.checkChannelSubscriptionTask);
router.post('/complete-invite', taskController.assignTaskToUser);
router.post('/complete-daily', taskController.claimDailyBonus);
router.post('/complete-poll', taskController.completeUserTask);

module.exports = router;
