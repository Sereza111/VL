// src/services/storage.js
export const saveUserData = async (userId, data) => {
  try {
    const key = `vl_${userId}`;
    const serializedData = JSON.stringify(data);

    // Используем Telegram Cloud Storage если доступен
    if (window.Telegram?.WebApp?.CloudStorage) {
      await new Promise((resolve, reject) => {
        window.Telegram.WebApp.CloudStorage.setItem(key, serializedData, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    } else {
      // Локальное хранилище для разработки
      localStorage.setItem(key, serializedData);
    }
    return true;
  } catch (error) {
    console.error('Ошибка сохранения данных:', error);
    return false;
  }
};

export const loadUserData = async (userId) => {
  try {
    const key = `vl_${userId}`;

    // Используем Telegram Cloud Storage если доступен
    if (window.Telegram?.WebApp?.CloudStorage) {
      const value = await new Promise((resolve, reject) => {
        window.Telegram.WebApp.CloudStorage.getItem(key, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });
      });
      return value ? JSON.parse(value) : null;
    }
    
    // Локальное хранилище для разработки
    const localData = localStorage.getItem(key);
    return localData ? JSON.parse(localData) : null;
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
    return null;
  }
};