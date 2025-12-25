const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Создадим этот файл позже

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    defaultValue: 'Пользователь'
  },
  balance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 100.00
  },
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  experience: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  telegram_id: {
    type: DataTypes.STRING,
    unique: true, // Equivalent to sparse for unique, handles nulls differently
    allowNull: true
  },
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Для простоты пока храним друзей и запросы как JSON строки.
  // Позже это будет переделано в настоящие связи many-to-many.
  friends: {
    type: DataTypes.TEXT, // Store as JSON string
    defaultValue: '[]',
    get() {
      const rawValue = this.getDataValue('friends');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('friends', JSON.stringify(value));
    }
  },
  friendRequests: {
    type: DataTypes.TEXT, // Store as JSON string
    defaultValue: '[]',
    get() {
      const rawValue = this.getDataValue('friendRequests');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('friendRequests', JSON.stringify(value));
    }
  }
}, {
  timestamps: true, // `createdAt` and `updatedAt` (automatically handled by Sequelize)
  // `updatedAt` is automatically added by timestamps: true
  // `createdAt` already exists in mongoose schema, so Sequelize will map to it.
  // To match the exact Mongoose schema's `createdAt` behavior,
  // we ensure `createdAt` is present and auto-filled.
  // Sequelize adds `createdAt` and `updatedAt` by default if `timestamps: true`
  // and the columns exist in the database.
  tableName: 'Users' // Явно указываем имя таблицы с большой буквы
});

module.exports = User; 