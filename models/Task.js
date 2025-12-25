const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reward: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
    allowNull: false
  }
}, {
  timestamps: true, // Это добавит поля createdAt и updatedAt
  underscored: true, // Это преобразует camelCase в snake_case для полей createdAt и updatedAt, т.е. created_at и updated_at
  tableName: 'tasks' // Указываем имя таблицы явно
});

module.exports = Task; 