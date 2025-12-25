const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Item = require('./Item');

const UserItem = sequelize.define('UserItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  item_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'items',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  purchased_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'user_items',
  timestamps: true
});

// Устанавливаем связь с Item
UserItem.belongsTo(Item, { foreignKey: 'item_id', as: 'item' });

module.exports = UserItem; 