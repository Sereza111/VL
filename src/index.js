import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import './config'; // Импортируем конфигурацию

// Initialize occult forest theme elements
const initOccultTheme = () => {
  // Create forest background if it doesn't exist
  if (!document.querySelector('.forest-background')) {
    const forestBg = document.createElement('div');
    forestBg.className = 'forest-background';
    document.body.appendChild(forestBg);
  }
  
  // Initialize candles
  const createCandles = () => {
    const candlePositions = [
      { left: '10%', bottom: '20%' },
      { right: '10%', bottom: '25%' }
    ];
    
    candlePositions.forEach((pos, index) => {
      const candle = document.createElement('div');
      candle.className = `candle candle-${index + 1}`;
      
      // Set position
      Object.keys(pos).forEach(key => {
        candle.style[key] = pos[key];
      });
      
      document.body.appendChild(candle);
    });
  };
  
  // Call initialization functions
  createCandles();
};

// База данных инициализируется на сервере, клиент только отправляет запросы
console.log('Запуск клиентского приложения...');

// Create root and render app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Initialize theme after render
window.addEventListener('load', initOccultTheme);

// Fallback: hide HTML preloader once React is mounted
const hideHtmlPreloader = () => {
  try {
    const preloader = document.querySelector('.preloader');
    if (preloader) {
      preloader.style.transition = 'opacity 0.8s ease';
      preloader.style.opacity = '0';
      setTimeout(() => {
        if (preloader) preloader.style.display = 'none';
      }, 900);
    }
  } catch (e) {
    // no-op
  }
};

// Hide preloader on load and also right after first paint
if (document.readyState === 'complete') {
  setTimeout(hideHtmlPreloader, 300);
} else {
  window.addEventListener('load', () => setTimeout(hideHtmlPreloader, 300));
}
requestAnimationFrame(hideHtmlPreloader);