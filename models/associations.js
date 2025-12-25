const User = require('./User');
const Task = require('./Task');
const UserTask = require('./UserTask');
const Friend = require('./Friend');
const Item = require('./Item');
const UserItem = require('./UserItem');

// User-UserTask Association
User.hasMany(UserTask, { foreignKey: 'user_id', as: 'userTasks' });
UserTask.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Task-UserTask Association
Task.hasMany(UserTask, { foreignKey: 'task_id', as: 'userTasks' });
UserTask.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });

// User-Friend Association (self-referencing)
User.hasMany(Friend, { foreignKey: 'user_id', as: 'sentFriendRequests' });
Friend.belongsTo(User, { foreignKey: 'user_id', as: 'sender' });

User.hasMany(Friend, { foreignKey: 'friend_id', as: 'receivedFriendRequests' });
Friend.belongsTo(User, { foreignKey: 'friend_id', as: 'receiver' });

// User-Item Association (many-to-many)
User.belongsToMany(Item, { through: UserItem, foreignKey: 'user_id', as: 'items' });
Item.belongsToMany(User, { through: UserItem, foreignKey: 'item_id', as: 'users' });

module.exports = { User, Task, UserTask, Friend, Item, UserItem }; 