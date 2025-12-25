// src/screens/TasksScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { getActiveTasks, assignTaskToUser, completeUserTask } from '../services/taskService';
import { getUserByTelegramId } from '../services/userService';
import './TasksScreen.css';

const TasksScreen = ({ onComplete, userId }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Загрузка задач из базы данных - переделана в useCallback для повторного использования
  const loadTasks = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      // Получаем данные пользователя
      if (userId) {
        const userData = await getUserByTelegramId(userId);
        setUser(userData);
      }
      
      // Получаем активные задачи
      const activeTasks = await getActiveTasks();
      
      // Преобразуем задачи для отображения
      const formattedTasks = activeTasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        reward: task.reward,
        progress: 0,
        target: 1,
        status: 'active',
        expReward: task.expReward || Math.floor(task.reward / 5) // Добавляем expReward если его нет
      }));
      
      setTasks(formattedTasks);
    } catch (error) {
      console.error('Ошибка при загрузке задач:', error);
      setError('Не удалось загрузить задания. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
      if (showRefresh) {
        setRefreshing(false);
      }
    }
  }, [userId]);

  // Первичная загрузка задач
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Функция для назначения задачи пользователю
  const assignTask = async (taskId) => {
    if (!user) {
      setError('Для выполнения задания необходимо авторизоваться');
      return;
    }
    
    try {
      const result = await assignTaskToUser(user.id, taskId);
      
      if (!result.success) {
        setError(result.message || 'Не удалось начать задание');
        return;
      }
      
      // Обновляем состояние задачи
      setTasks(prev => prev.map(task => {
        if (task.id === taskId) {
          return { ...task, progress: 1, status: 'assigned' };
        }
        return task;
      }));
    } catch (error) {
      console.error('Ошибка при назначении задачи:', error);
      setError('Произошла ошибка при назначении задачи');
    }
  };

  // Функция для завершения задачи и получения награды
  const claimReward = async (taskId) => {
    if (!user) {
      setError('Для получения награды необходимо авторизоваться');
      return;
    }
    
    try {
      const task = tasks.find(t => t.id === taskId);
      
      if (!task || task.progress < task.target) {
        setError('Задание еще не завершено');
        return;
      }
      
      // Завершаем задачу в базе данных
      const result = await completeUserTask(user.id, taskId);
      
      if (!result.success) {
        setError(result.message || 'Не удалось завершить задание');
        return;
      }
      
      // Вызываем колбэк для обновления баланса в родительском компоненте
      if (onComplete) {
        onComplete(task.reward, task.expReward || task.reward / 5);
      }
      
      // Показываем уведомление об успешном завершении
      setError({ type: 'success', message: `Вы получили ${task.reward} VL и ${task.expReward || Math.floor(task.reward / 5)} опыта!` });
      
      // Удаляем задачу из списка
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Ошибка при завершении задачи:', error);
      setError('Произошла ошибка при получении награды');
    }
  };

  // Функция для обновления списка заданий
  const refreshTasks = () => {
    loadTasks(true);
  };

  // Отображение состояния загрузки
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Загрузка заданий...</p>
      </div>
    );
  }

  return (
    <div className="screen tasks-screen">
      <h2 className="screen-title">Задания</h2>
      
      {/* Добавляем кнопку обновления списка заданий */}
      <div className="tasks-controls">
        <button 
          className={`refresh-button ${refreshing ? 'refreshing' : ''}`}
          onClick={refreshTasks}
          disabled={refreshing}
        >
          {refreshing ? 'Обновление...' : 'Обновить задания'}
        </button>
      </div>
      
      {/* Отображение ошибок или уведомлений */}
      {error && (
        <div className={`notification ${error.type === 'success' ? 'success' : 'error'}`}>
          {typeof error === 'string' ? error : error.message}
        </div>
      )}
      
      <div className="tasks-list">
        {tasks.length > 0 ? (
          tasks.map(task => {
            const progressPercent = (task.progress / task.target) * 100;
            
            return (
              <div key={task.id} className="task-item">
                <div className="task-info">
                  <h3>{task.title}</h3>
                  {task.description && <p className="task-description">{task.description}</p>}
                  <div className="progress-container">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                    <div className="progress-text">
                      {task.progress} / {task.target}
                    </div>
                  </div>
                </div>
                <div className="task-reward">
                  <div className="reward-value">
                    <div className="vl-reward">+{task.reward} VL</div>
                    <div className="exp-reward">+{task.expReward || Math.floor(task.reward / 5)} XP</div>
                  </div>
                  {task.status === 'active' ? (
                    <button 
                      className="assign-button"
                      onClick={() => assignTask(task.id)}
                    >
                      Начать
                    </button>
                  ) : (
                    <button 
                      className={`claim-button ${task.progress < task.target ? 'disabled' : ''}`}
                      onClick={() => claimReward(task.id)}
                      disabled={task.progress < task.target}
                    >
                      Получить
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-tasks">
            <p>Нет доступных заданий</p>
            <button className="refresh-button" onClick={refreshTasks}>
              Обновить
            </button>
          </div>
        )}
      </div>
      
      {/* Дополнительная информация о заданиях */}
      <div className="tasks-info">
        <p>Выполняйте задания для получения VL и опыта. Чем больше заданий вы выполните, тем больше наград получите!</p>
      </div>
    </div>
  );
};

export default TasksScreen;