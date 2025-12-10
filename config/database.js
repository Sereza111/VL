const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD,
  {
    host: process.env.MYSQL_HOST,
    dialect: 'mysql',
    logging: false, // Отключить логирование SQL-запросов в консоль (можно включить для отладки)
    dialectOptions: {
      connectTimeout: 60000 // Увеличиваем таймаут подключения до 60 секунд
    }
  }
);

module.exports = sequelize; 