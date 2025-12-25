const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserTask = sequelize.define('UserTask', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users', // Имя таблицы в базе данных (с большой буквы)
      key: 'id'
    }
  },
  task_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tasks', // Имя таблицы в базе данных
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'rejected'),
    defaultValue: 'pending',
    allowNull: false
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true, // Разрешаем null
    defaultValue: null
  }
}, {
  timestamps: false, // Отключаем автоматические createdAt/updatedAt
  underscored: true, // Использовать snake_case для имен колонок
  tableName: 'user_tasks', // Указываем имя таблицы явно
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'task_id']
    }
  ]
});

module.exports = UserTask; 