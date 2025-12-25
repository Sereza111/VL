const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Friend = sequelize.define('Friend', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    // references: { // Будут настроены позже в файле ассоциаций
    //   model: 'User',
    //   key: 'id'
    // }
  },
  friend_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    // references: { // Будут настроены позже в файле ассоциаций
    //   model: 'User',
    //   key: 'id'
    // }
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
    defaultValue: 'pending',
    allowNull: false
  }
}, {
  timestamps: true, // Добавляет createdAt и updatedAt
  underscored: true, // Использовать snake_case для имен колонок
  tableName: 'friends', // Указываем имя таблицы явно
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'friend_id']
    }
  ]
});

module.exports = Friend; 