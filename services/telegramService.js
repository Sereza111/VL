const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const MAIN_BOT_TOKEN = process.env.MAIN_BOT_TOKEN;
const CHANNEL_USERNAME = process.env.CHANNEL_USERNAME || '@VLTOKEN';

async function checkChannelSubscription(telegramUserId) {
  try {
    if (!MAIN_BOT_TOKEN) {
      console.error('MAIN_BOT_TOKEN не установлен в окружении');
      return false;
    }
    const bot = new TelegramBot(MAIN_BOT_TOKEN);
    
    try {
      const chatMember = await bot.getChatMember(CHANNEL_USERNAME, telegramUserId);
      
      // Статусы подписки: member, administrator, creator
      const subscribedStatuses = ['member', 'administrator', 'creator'];
      
      return subscribedStatuses.includes(chatMember.status);
    } catch (error) {
      console.error('Ошибка проверки подписки:', error);
      return false;
    }
  } catch (error) {
    console.error('Ошибка инициализации бота:', error);
    return false;
  }
}

module.exports = {
  checkChannelSubscription
};