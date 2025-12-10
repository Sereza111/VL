// Заглушка для конфигурации без использования dotenv

// Конфигурация приложения

// Определяем, находимся ли мы в production окружении
const isProduction = process.env.NODE_ENV === 'production';

// Клиент НЕ должен содержать секреты БД. Оставляем только API конфиг.
const dbConfig = null;

// Конфигурация API
const apiConfig = {
  // Используем относительные пути для API
  baseUrl: '/api',
  // Флаг для имитации API запросов (true - использовать моки, false - реальные запросы)
  mock: false
};

export default {
  db: dbConfig,
  api: apiConfig,
  isProduction,
  // Feature flags to control new mechanics and visuals
  features: {
    enablePortalMechanic: true,
    enableMiniGames: true,
    enableVFX: true,
    enableGenerativeIcons: true,
    enableGenerativeBackgrounds: true
  }
}; 