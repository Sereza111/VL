// src/screens/HomeScreen.js - Мистический дневник мага
import React, { useRef, useEffect, useState } from 'react';
import { FaFeather, FaStar, FaTimes, FaScroll, FaKeyboard } from 'react-icons/fa';
import anime from 'animejs/lib/anime.js';
import GothicKeyboard from '../components/GothicKeyboard';
import './HomeScreen.css';

// Цветовая палитра
const COLOR_PALETTE = {
  darkPurple: '#3C2F4F',
  beigeParchment: '#E8D3A9',
  darkTurquoise: '#1A3C34',
  inkyBlue: '#1B263B',
  moonBlue: '#A8C7FA',
};

const HomeScreen = ({ balance: initialBalance = 0, dailyIncome: initialDailyIncome = 0 }) => {
  const balance = parseFloat(initialBalance);
  const dailyIncome = parseFloat(initialDailyIncome);
  
  const particlesRef = useRef(null);
  const journalInputRef = useRef(null);
  const [journalEntry, setJournalEntry] = useState('');
  const [savedEntries, setSavedEntries] = useState([]);
  const [showEntries, setShowEntries] = useState(false);
  const [isEntryAnimating, setIsEntryAnimating] = useState(false);
  const [useCustomKeyboard, setUseCustomKeyboard] = useState(false);
  
  // Загрузка записей из localStorage при монтировании компонента
  useEffect(() => {
    try {
      const storedEntries = localStorage.getItem('occultJournal');
      if (storedEntries) {
        setSavedEntries(JSON.parse(storedEntries));
        console.log('Загружены записи дневника из localStorage');
      }
    } catch (error) {
      console.error('Ошибка загрузки записей дневника:', error);
    }
  }, []);
  
  useEffect(() => {
    // Глобальный обработчик ошибок загрузки
    const handleImageLoadError = (event) => {
      event.preventDefault();
      console.error('Ошибка загрузки изображения:', event.target.src);
      event.target.style.display = 'none';
    };

    // Добавляем обработчик ошибок для всех изображений
    const images = document.getElementsByTagName('img');
    for (let img of images) {
      img.addEventListener('error', handleImageLoadError);
    }

    // Создаем наблюдатель за динамически добавляемыми изображениями
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'IMG') {
              node.addEventListener('error', handleImageLoadError);
            }
          });
        }
      });
    });

    // Начинаем наблюдение за всем документом
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });

    // Очистка
    return () => {
      observer.disconnect();
      for (let img of images) {
        img.removeEventListener('error', handleImageLoadError);
      }
    };
  }, []);

  // Сохранение записи в дневник
  const saveJournalEntry = () => {
    if (journalEntry.trim()) {
      setIsEntryAnimating(true);
      
      const newEntry = {
        id: Date.now(),
        text: journalEntry,
        date: new Date().toLocaleDateString('ru-RU'),
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      };
      
      const updatedEntries = [newEntry, ...savedEntries];
      setSavedEntries(updatedEntries);
      setJournalEntry('');
      
      try {
        localStorage.setItem('occultJournal', JSON.stringify(updatedEntries));
      } catch (error) {
        console.error('Ошибка сохранения дневника:', error);
      }
      
      // Анимация сохранения
      anime({
        targets: '.journal-save-btn',
        scale: [1, 1.2, 1],
        rotate: [0, 10, -10, 0],
        duration: 500,
        easing: 'easeInOutQuad',
        complete: () => {
          setIsEntryAnimating(false);
          
          // Анимация появления новой записи
          anime({
            targets: '.journal-entries .journal-entry:first-child',
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 800,
            easing: 'easeOutQuad'
          });
        }
      });
    }
  };

  // Переключение между стандартной и готической клавиатурой
  const toggleKeyboard = () => {
    setUseCustomKeyboard(!useCustomKeyboard);
    
    // Анимация переключения
    anime({
      targets: '.journal-page',
      scale: [1, 0.98, 1],
      duration: 300,
      easing: 'easeInOutQuad'
    });
  };

  // Открытие/закрытие списка записей
  const toggleEntries = () => {
    setShowEntries(!showEntries);
    
    anime({
      targets: '.journal-entries',
      translateX: showEntries ? ['0%', '100%'] : ['100%', '0%'],
      duration: 300,
      easing: 'easeInOutQuad'
    });
  };

  return (
    <div className="home-screen">
      <div ref={particlesRef} className="mystical-particles"></div>
      
      <div className="journal-container">
        <div className="journal-header">
          <div className="journal-title">Дневник мага</div>
          <div 
            className="journal-theme-selector"
            onClick={toggleEntries}
          >
            {showEntries ? <FaTimes /> : <FaScroll />}
          </div>
        </div>
        
        <div className="journal-page">
          {/* Always use system keyboard for text input */}
          <textarea 
            ref={journalInputRef}
            className="journal-input"
            value={journalEntry}
            onChange={(e) => setJournalEntry(e.target.value)}
            placeholder="Запиши свои мистические мысли..."
          ></textarea>
          {/* Optional symbols panel toggle */}
          {useCustomKeyboard && (
            <GothicKeyboard
              initialText={journalEntry}
              onTextChange={setJournalEntry}
              placeholder="Записи..."
              showKeyboard={false}
              enableSound={false}
              language="russian"
              className="journal-gothic-keyboard"
            />
          )}
        </div>
        
        <div className="journal-actions">
          <button 
            className="journal-save-btn" 
            onClick={saveJournalEntry}
            disabled={isEntryAnimating}
          >
            <FaFeather /> Сохранить
          </button>
          
          <button 
            className="keyboard-toggle-btn" 
            onClick={toggleKeyboard}
            title={useCustomKeyboard ? 'Переключить на стандартную клавиатуру' : 'Переключить на готическую клавиатуру'}
          >
            <FaKeyboard /> {useCustomKeyboard ? 'Обычная' : 'Мистика'}
          </button>
        </div>
        
        <div className={`journal-entries ${showEntries ? 'active' : ''}`}>
          <div className="journal-entries-header">
            <h3 className="journal-entries-title">Мистические записи</h3>
            <button 
              className="journal-entries-close"
              onClick={toggleEntries}
            >
              <FaTimes />
            </button>
          </div>
          
          <div className="journal-entry-list">
            {savedEntries.map(entry => (
              <div key={entry.id} className="journal-entry">
                <div className="journal-entry-header">
                  <div className="journal-entry-meta">
                    {entry.date} {entry.time}
                  </div>
                </div>
                <div className="journal-entry-text">
                  {entry.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;